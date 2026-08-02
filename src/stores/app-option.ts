import { defineStore } from "pinia";

const themeKey = "ngocchau.theme";

function initialTheme(): "light" | "dark" {
  return window.localStorage.getItem(themeKey) === "dark" ? "dark" : "light";
}

function applyTheme(theme: "light" | "dark"): void {
  document.documentElement.dataset.bsTheme = theme;
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  window.localStorage.setItem(themeKey, theme);
}

function applySidebarState(collapsed: boolean): void {
  document.documentElement.classList.toggle("navbar-vertical-collapsed", collapsed);
}

export const useAppOptionStore = defineStore("appOption", {
  state: () => ({
    sidebarCollapsed: false,
    mobileNavOpen: false,
    profileOpen: false,
    changePasswordOpen: false,
    theme: initialTheme() as "light" | "dark",
  }),
  actions: {
    toggleSidebar(): void {
      this.sidebarCollapsed = !this.sidebarCollapsed;
      applySidebarState(this.sidebarCollapsed);
    },
    toggleMobileNav(): void {
      this.mobileNavOpen = !this.mobileNavOpen;
    },
    closeMobileNav(): void {
      this.mobileNavOpen = false;
    },
    toggleProfile(): void {
      this.profileOpen = !this.profileOpen;
    },
    closeProfile(): void {
      this.profileOpen = false;
    },
    openChangePassword(): void {
      this.changePasswordOpen = true;
    },
    closeChangePassword(): void {
      this.changePasswordOpen = false;
    },
    toggleTheme(): void {
      this.theme = this.theme === "light" ? "dark" : "light";
      applyTheme(this.theme);
    },
    initialize(): void {
      applyTheme(this.theme);
      applySidebarState(this.sidebarCollapsed);
    },
  },
});
