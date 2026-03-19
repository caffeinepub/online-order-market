import { useEffect, useState } from "react";

export type Theme = "blue" | "dark" | "gold";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      return (localStorage.getItem("theme") as Theme) || "blue";
    } catch {
      return "blue";
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark");
    root.removeAttribute("data-theme");

    if (theme === "dark") {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
    } else if (theme === "gold") {
      root.setAttribute("data-theme", "gold");
    } else {
      root.setAttribute("data-theme", "blue");
    }
    try {
      localStorage.setItem("theme", theme);
    } catch {}
  }, [theme]);

  const cycleTheme = () =>
    setThemeState((t) => {
      if (t === "blue") return "dark";
      if (t === "dark") return "gold";
      return "blue";
    });

  const setTheme = (t: Theme) => setThemeState(t);

  return { theme, cycleTheme, setTheme };
}
