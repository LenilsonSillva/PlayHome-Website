import { useI18n, LANGUAGE_OPTIONS, type LanguageCode } from "../../i18n";
import { useTheme } from "../../contexts/themeContext";
import styles from "./siteControls.module.css";

const LANGUAGE_FLAGS: Record<LanguageCode, string> = {
  pt: "🇧🇷",
  "pt-PT": "🇵🇹",
  en: "🇺🇸",
  "en-GB": "🇬🇧",
  es: "🇪🇸",
  "es-419": "🌎",
  fr: "🇫🇷",
  de: "🇩🇪",
  it: "🇮🇹",
  ja: "🇯🇵",
  ko: "🇰🇷",
  ru: "🇷🇺",
  zh: "🇨🇳",
  hi: "🇮🇳",
  ar: "🇸🇦",
};

export function SiteControls() {
  const { language, setLanguage, t } = useI18n();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className={styles.controls} aria-label="PlayHome settings">
      <label className={styles.languageControl}>
        <span className={styles.srOnly}>{t("site.language", "Language")}</span>
        <span className={styles.globe} aria-hidden="true">{LANGUAGE_FLAGS[language]}</span>
        <select
          value={language}
          onChange={(event) => setLanguage(event.target.value as LanguageCode)}
          aria-label={t("site.language", "Language")}
        >
          {LANGUAGE_OPTIONS.map((option) => (
            <option key={option.code} value={option.code}>
              {option.nativeLabel}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className={styles.themeButton}
        onClick={toggleTheme}
        aria-label={`${t("site.themeSwitch", "Switch theme")}: ${theme === "dark" ? t("site.light", "Light") : t("site.dark", "Dark")}`}
        title={`${t("site.theme", "Theme")}: ${theme === "dark" ? t("site.light", "Light") : t("site.dark", "Dark")}`}
      >
        <span aria-hidden="true">{theme === "dark" ? "☼" : "☾"}</span>
      </button>
    </aside>
  );
}
