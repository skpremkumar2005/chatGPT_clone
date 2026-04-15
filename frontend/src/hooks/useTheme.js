import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setTheme } from "../redux/slices/uiSlice";

const useTheme = () => {
  const dispatch = useDispatch();
  const theme = useSelector((state) => state.ui.theme);

  // On mount, read saved preference or system preference
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") {
      dispatch(setTheme(saved));
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      dispatch(setTheme(prefersDark ? "dark" : "light"));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply / remove the "dark" class on <html> whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    dispatch(setTheme(theme === "dark" ? "light" : "dark"));
  };

  return { theme, toggleTheme, isDark: theme === "dark" };
};

export default useTheme;
