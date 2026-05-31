import { defineConfig, loadEnv } from "vite";
import path from "path";
import Vue from "@vitejs/plugin-vue";
import ViteImages from "vite-plugin-vue-images";

function proxyConfig(target) {
  return {
    "/api": {
      target,
      changeOrigin: true,
      secure: false,
    },
    "/uploads": {
      target,
      changeOrigin: true,
      secure: false,
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const appEnv = loadEnv(mode, process.cwd(), "");
  const apiProxyTarget = appEnv.CMS_API_PROXY_TARGET || "http://localhost:4000";
  const proxy = proxyConfig(apiProxyTarget);

  return {
    plugins: [
      Vue(),
      ViteImages({
        dirs: ["src/assets/images"],
      }),
    ],
    server: {
      proxy,
    },
    preview: {
      proxy,
    },
    resolve: {
      extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json", ".vue", ".css"],
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
