import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const { createPinia, setActivePinia } = require("pinia");
const root = fileURLToPath(new URL("../src/", import.meta.url));
const storage = new Map();
const window = {
  localStorage: {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  },
};
const tokenKey = "ngocchau.cms2.token";
const userKey = "ngocchau.cms2.user";
const request = {
  get: async () => {
    throw new Error("Unexpected GET");
  },
  post: async () => {
    throw new Error("Unexpected POST");
  },
};
const boundary = {
  request,
  apiError: (error) => error,
  getToken: () => storage.get(tokenKey) || "",
  setToken: (token) =>
    token ? storage.set(tokenKey, token) : storage.delete(tokenKey),
};
const modules = new Map();
let routeGuard;
const router = {
  beforeEach: (guard) => {
    routeGuard = guard;
  },
  afterEach: () => {},
};
function load(name) {
  if (name === "@/request") return boundary;
  if (name === "vue-router")
    return { createRouter: () => router, createWebHistory: () => ({}) };
  if (name === "@/router/client" || name === "@/router/administrator")
    return { default: [] };
  if (!name.startsWith("@/")) return require(name);
  if (modules.has(name)) return modules.get(name);
  const file = `${root}${name.slice(2)}.ts`;
  return evaluate(file, name);
}
function evaluate(file, name) {
  const source = ts.transpileModule(
    readFileSync(file, "utf8").replaceAll("import.meta.env.", "({})."),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const module = { exports: {} };
  vm.runInThisContext(
    `(function(require, module, exports, window) {${source}\n})`,
    { filename: file },
  )(load, module, module.exports, window);
  modules.set(name, module.exports);
  return module.exports;
}
const { authenStore } = load("@/stores/app-authen");
const { useDashboardStore } = load("@/views/Dashboard/store");
const { dashboardService } = load("@/views/Dashboard/service");
function setup(user = { id: "A", permissions: ["orders.view"] }) {
  storage.clear();
  storage.set(tokenKey, "token-A");
  storage.set(userKey, JSON.stringify(user));
  setActivePinia(createPinia());
  return { auth: authenStore(), dashboard: useDashboardStore() };
}
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

test("initialize refreshes cached permissions, including grants and revocations", async () => {
  for (const permissions of [["dashboard.view"], []]) {
    const { auth } = setup();
    let calls = 0;
    request.get = async (path) => {
      assert.equal(path, "/auth/me");
      calls++;
      return { data: { user: { id: "A", permissions } } };
    };
    await auth.initialize();
    assert.equal(calls, 1);
    assert.deepEqual(auth.permissions, permissions);
    assert.equal(auth.can("orders.view"), false);
    assert.equal(auth.can("dashboard.view"), permissions.length > 0);
    assert.deepEqual(JSON.parse(storage.get(userKey)).permissions, permissions);
    await auth.initialize();
    assert.equal(calls, 1);
  }
});

test("401 clears the session and dashboard; missing token skips hydration", async () => {
  const { auth, dashboard } = setup();
  dashboard.data = { owner: "A" };
  request.get = async () => {
    throw { status: 401, message: "Unauthorized" };
  };
  await auth.initialize();
  assert.equal(auth.isAuthenticated, false);
  assert.equal(auth.user, null);
  assert.equal(dashboard.data, null);
  assert.equal(storage.has(tokenKey), false);
  assert.equal(storage.has(userKey), false);
  auth.isHydrated = false;
  request.get = async () => assert.fail("No request without a token");
  await auth.initialize();
});

test("network and 5xx reject hydration without losing the token and allow retry", async () => {
  for (const error of [
    { message: "Offline" },
    { status: 503, message: "Unavailable" },
  ]) {
    const { auth } = setup();
    request.get = async () => {
      throw error;
    };
    await assert.rejects(auth.initialize(), (actual) => actual === error);
    assert.equal(auth.token, "token-A");
    assert.equal(storage.get(tokenKey), "token-A");
    assert.equal(auth.isHydrated, false);
    request.get = async () => ({
      data: { user: { id: "A", permissions: [] } },
    });
    await auth.initialize();
    assert.deepEqual(auth.permissions, []);
  }
});

test("successful login persists server permissions; failed login clears loading", async () => {
  const { auth } = setup();
  auth.logout();
  request.post = async () => ({
    data: {
      access_token: "token-B",
      user: { id: "B", permissions: ["dashboard.view"] },
    },
  });
  await auth.login({ username: "B", password: "test-only" });
  assert.equal(auth.user.id, "B");
  assert.equal(storage.get(tokenKey), "token-B");
  assert.equal(auth.can("dashboard.view"), true);
  auth.logout();
  request.post = async () => {
    throw { status: 401, message: "Invalid credentials" };
  };
  await assert.rejects(auth.login({ username: "B", password: "test-only" }));
  assert.equal(auth.isLoading, false);
  assert.equal(auth.isAuthenticated, false);
});

test("latest login owns the session and loading state when responses arrive out of order", async () => {
  const { auth } = setup();
  auth.logout();
  const first = deferred();
  const second = deferred();
  request.post = (_path, credentials) =>
    credentials.username === "A" ? first.promise : second.promise;

  const loginA = auth.login({ username: "A", password: "test-only" });
  const loginB = auth.login({ username: "B", password: "test-only" });
  second.resolve({ data: { token: "token-B", user: { id: "B" } } });
  await loginB;
  assert.equal(auth.user.id, "B");
  assert.equal(auth.isLoading, false);

  first.resolve({ data: { token: "token-A", user: { id: "A" } } });
  await loginA;
  assert.equal(auth.user.id, "B");
  assert.equal(storage.get(tokenKey), "token-B");
  assert.equal(JSON.parse(storage.get(userKey)).id, "B");
});

test("logout invalidates a pending login without letting it restore the session", async () => {
  const { auth } = setup();
  auth.logout();
  const response = deferred();
  request.post = () => response.promise;
  const pending = auth.login({ username: "A", password: "test-only" });

  auth.logout();
  assert.equal(auth.isLoading, false);
  response.resolve({ data: { token: "token-A", user: { id: "A" } } });
  await pending;
  assert.equal(auth.isAuthenticated, false);
  assert.equal(auth.user, null);
  assert.equal(storage.has(tokenKey), false);
  assert.equal(storage.has(userKey), false);
});

test("logout invalidates pending dashboard results across A to B sessions", async () => {
  for (const failure of [false, true]) {
    const { auth, dashboard } = setup();
    const old = deferred();
    let signal;
    dashboardService.overview = (_query, requestSignal) => {
      signal = requestSignal;
      return old.promise;
    };
    dashboard.data = { owner: "A" };
    dashboard.lastUpdatedAt = "old";
    const pending = dashboard.load({ preset: "today" });
    auth.logout();
    assert.equal(signal.aborted, true);
    assert.equal(dashboard.data, null);
    assert.equal(dashboard.lastUpdatedAt, "");
    assert.equal(dashboard.loading, false);
    assert.deepEqual(dashboard.query, { preset: "last30Days" });
    request.post = async () => ({
      data: { token: "token-B", user: { id: "B" } },
    });
    await auth.login({ username: "B", password: "test-only" });
    dashboardService.overview = async () => ({ owner: "B" });
    await dashboard.load();
    if (failure) old.reject({ message: "Old failure" });
    else old.resolve({ owner: "A" });
    await pending;
    assert.equal(dashboard.data.owner, "B");
    assert.equal(dashboard.error, "");
  }
});

test("same-session refresh keeps the last data on error and latest request wins", async () => {
  const { dashboard } = setup();
  dashboardService.overview = async () => ({ owner: "latest" });
  await dashboard.load();
  const timestamp = dashboard.lastUpdatedAt;
  dashboardService.overview = async () => {
    throw { message: "Offline" };
  };
  await dashboard.load();
  assert.equal(dashboard.data.owner, "latest");
  assert.equal(dashboard.lastUpdatedAt, timestamp);
  assert.equal(dashboard.error, "Offline");
  const old = deferred();
  dashboardService.overview = () => old.promise;
  const pending = dashboard.load();
  dashboardService.overview = async () => ({ owner: "newest" });
  await dashboard.load();
  old.resolve({ owner: "stale" });
  await pending;
  assert.equal(dashboard.data.owner, "newest");
});

test("a late auth profile cannot overwrite a newly logged in user", async () => {
  const { auth } = setup();
  const old = deferred();
  request.get = () => old.promise;
  const pending = auth.fetchMe();
  auth.logout();
  request.post = async () => ({
    data: { token: "token-B", user: { id: "B" } },
  });
  await auth.login({ username: "B", password: "test-only" });
  old.resolve({ data: { user: { id: "A" } } });
  await pending;
  assert.equal(auth.user.id, "B");
  assert.equal(JSON.parse(storage.get(userKey)).id, "B");
});

test("request interceptor ignores old-session 401 but logs out the current session", async () => {
  const transport = evaluate(`${root}request/index.ts`, "real-request");
  let logouts = 0;
  transport.configureRequest({
    onUnauthorized: () => {
      logouts++;
    },
  });
  for (const currentToken of ["token-B", "", "token-A"]) {
    storage.set(tokenKey, "token-A");
    const old = deferred();
    const started = deferred();
    transport.request.defaults.adapter = (config) => {
      started.resolve(config);
      return old.promise;
    };
    const pending = transport.request.get("/auth/me");
    const config = await started.promise;
    assert.equal(config.headers.get("Authorization"), "Bearer token-A");
    storage.set(tokenKey, currentToken);
    old.reject({
      config,
      response: { status: 401, data: { message: "Unauthorized" } },
    });
    await assert.rejects(pending, (error) => error.status === 401);
    assert.equal(logouts, currentToken === "token-A" ? 1 : 0);
  }
});

test("request interceptor rejects a late 401 from an earlier lifecycle reusing the same token", async () => {
  const transport = evaluate(
    `${root}request/index.ts`,
    "real-request-reused-token",
  );
  let logouts = 0;
  transport.configureRequest({
    onUnauthorized: () => {
      logouts++;
    },
  });
  transport.setToken("token-A");
  const old = deferred();
  const started = deferred();
  transport.request.defaults.adapter = (config) => {
    started.resolve(config);
    return old.promise;
  };

  const pending = transport.request.get("/auth/me");
  const config = await started.promise;
  assert.equal(config.headers.get("Authorization"), "Bearer token-A");
  transport.setToken("");
  transport.setToken("token-A");
  old.reject({
    config,
    response: { status: 401, data: { message: "Unauthorized" } },
  });

  await assert.rejects(pending, (error) => error.status === 401);
  assert.equal(logouts, 0);
});

test("request interceptor logs out current 401 but not current network or 5xx failures", async () => {
  const transport = evaluate(
    `${root}request/index.ts`,
    "real-request-current-errors",
  );
  let logouts = 0;
  transport.configureRequest({
    onUnauthorized: () => {
      logouts++;
    },
  });
  transport.setToken("token-A");

  for (const response of [
    undefined,
    { status: 503, data: { message: "Unavailable" } },
    { status: 401, data: { message: "Unauthorized" } },
  ]) {
    transport.request.defaults.adapter = async (config) =>
      Promise.reject({
        config,
        response,
        message: response ? "Request failed" : "Offline",
      });
    await assert.rejects(transport.request.get("/auth/me"));
  }
  assert.equal(logouts, 1);
});

test("persisted token reload starts a valid request lifecycle", async () => {
  storage.set(tokenKey, "persisted-token");
  const transport = evaluate(
    `${root}request/index.ts`,
    "real-request-persisted-token",
  );
  let logouts = 0;
  transport.configureRequest({
    onUnauthorized: () => {
      logouts++;
    },
  });
  transport.request.defaults.adapter = async (config) =>
    Promise.reject({
      config,
      response: { status: 401, data: { message: "Unauthorized" } },
    });

  await assert.rejects(
    transport.request.get("/auth/me"),
    (error) => error.status === 401,
  );
  assert.equal(logouts, 1);
});

test("router exposes login retry when hydration fails, then resumes current permissions", async () => {
  const { auth } = setup();
  load("@/router/index").createCmsRouter();
  const route = {
    name: "dashboard",
    fullPath: "/dashboard",
    path: "/dashboard",
    matched: [{ meta: { auth: true } }],
    meta: { permission: "dashboard.view" },
  };
  const login = {
    name: "login",
    fullPath: "/login",
    path: "/login",
    matched: [],
    meta: { guestOnly: true },
  };
  request.get = async () => {
    throw { status: 503, message: "Unavailable" };
  };
  assert.deepEqual(await routeGuard(route), {
    name: "login",
    query: { redirect: "/dashboard" },
  });
  assert.equal(await routeGuard(login), true);
  assert.equal(auth.token, "token-A");
  request.get = async () => ({
    data: { user: { id: "A", permissions: ["dashboard.view"] } },
  });
  assert.equal(await routeGuard(route), true);
  auth.isHydrated = false;
  request.get = async () => ({ data: { user: { id: "A", permissions: [] } } });
  assert.equal(await routeGuard(route), "/403");
});

test("failed login during hydration outage must not validate cached permissions", async () => {
  const { auth } = setup();
  request.post = async () => {
    throw { status: 503, message: "Unavailable" };
  };
  await assert.rejects(auth.login({ username: "A", password: "test-only" }));
  assert.equal(auth.token, "token-A");
  assert.equal(auth.isHydrated, false);
});
