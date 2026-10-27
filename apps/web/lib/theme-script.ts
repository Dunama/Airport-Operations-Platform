export const THEME_KEY = "aop:theme";

/**
 * Runs in <head> before first paint (see app/layout.tsx) so the right theme
 * is applied without a flash. Keep in sync with `apply` in use-theme.ts.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");var d=t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light"}catch(e){}})()`;
