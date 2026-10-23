import { create } from "zustand";

const STORAGE_KEY = "notion_lite_theme";

function applyThemeToDom(theme) {
  if (typeof document === "undefined") return "light";
  const root = document.documentElement;
  const resolved =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;
  if (resolved === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  return resolved;
}

const initialTheme =
  typeof window !== "undefined"
    ? window.localStorage.getItem(STORAGE_KEY) || "light"
    : "light";

const initialResolved = applyThemeToDom(initialTheme);

export const useThemeStore = create((set) => ({
  theme: initialTheme,
  resolvedTheme: initialResolved,
  setTheme: (nextTheme) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
    }
    const resolved = applyThemeToDom(nextTheme);
    set({ theme: nextTheme, resolvedTheme: resolved });
  },
}));

export function useTheme() {
  return useThemeStore();
}
