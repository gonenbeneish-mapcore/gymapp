export type ThemePref = "system" | "dark" | "light";

export const ACCENTS = [
  { id: "lime", name: "Lime", hex: "#c8f04a" },
  { id: "cyan", name: "Cyan", hex: "#4fd8eb" },
  { id: "amber", name: "Amber", hex: "#ffc94a" },
  { id: "violet", name: "Violet", hex: "#b79cff" },
  { id: "pink", name: "Pink", hex: "#ff8cc6" },
] as const;

export type AccentId = (typeof ACCENTS)[number]["id"];

const THEME_KEY = "gymapp.theme";
const ACCENT_KEY = "gymapp.accent";

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable (private mode) — the choice just won't persist */
  }
}

export function getTheme(): ThemePref {
  const v = read(THEME_KEY);
  return v === "dark" || v === "light" ? v : "system";
}

export function getAccent(): AccentId {
  const v = read(ACCENT_KEY);
  return ACCENTS.some((a) => a.id === v) ? (v as AccentId) : "lime";
}

/** Apply saved appearance to <html>. Call once at startup and after changes. */
export function applyAppearance(theme = getTheme(), accent = getAccent()) {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);

  const hex = ACCENTS.find((a) => a.id === accent)?.hex ?? ACCENTS[0].hex;
  root.style.setProperty("--accent", hex);
  // On dark backgrounds the accent doubles as text colour; light mode keeps its darker token.
  if (accent === "lime") {
    root.style.removeProperty("--accent-text");
    root.style.removeProperty("--accent-soft");
    root.style.removeProperty("--tab-active");
  } else {
    const isLight =
      theme === "light" || (theme === "system" && matchMedia("(prefers-color-scheme: light)").matches);
    root.style.setProperty("--accent-text", isLight ? "#111315" : hex);
    root.style.setProperty("--accent-soft", isLight ? hex : `${hex}29`);
    root.style.setProperty("--tab-active", isLight ? "#111315" : hex);
  }
}

export function saveTheme(theme: ThemePref) {
  write(THEME_KEY, theme);
  applyAppearance(theme, getAccent());
}

export function saveAccent(accent: AccentId) {
  write(ACCENT_KEY, accent);
  applyAppearance(getTheme(), accent);
}
