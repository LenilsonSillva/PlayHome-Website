import styles from "./impostorHeader.module.css";
import "../../styles/theme.css";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../../i18n";
import playhomeIcon from "../../assets/brand/playhome-icon.png";

type ChildProps = {
  mode: (value: "local" | "online") => void;
  currentMode: "local" | "online" | null;
};

export function ImpostorHeader({ mode, currentMode }: ChildProps) {
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <div className={styles.wrapper}>
      <div className={styles.ambientLight} />

      <header className={styles.topHeader}>
        <button type="button" className={styles.logoLink} onClick={() => navigate("/")}>
          <img className={styles.logoIcon} src={playhomeIcon} alt="" />
          <span className={styles.mainTitle}>
            PLAY<span>HOME</span>
          </span>
        </button>
        <div className={styles.systemBadge}>
          <span>01</span>
          {t("home.header_protocol", "GAME SYSTEM")}
        </div>
      </header>
      <button type="button" className={styles.backButton} onClick={() => navigate("/")}>
        ← {t("site.backToMenu", "Back to main menu")}
      </button>

      <div className={styles.gameSection}>
        <div className={styles.titleMeta}>{t("home.card_subTitleImpostor", "SOCIAL DEDUCTION")}</div>
        <h1 className={styles.gameTitle}>
          {t("games.impostor_title", "IMPOSTOR")} <span className={styles.shhEmoji}>🤫</span>
        </h1>
        <p className={styles.gameDescription}>{t("games.impostor_desc", "Find the hidden impostor before it is too late.")}</p>

        <p className={styles.instruction}>{t("site.chooseMode", "How are you playing?")}</p>
        <div className={styles.modeSelector} role="tablist" aria-label={t("site.chooseMode", "How are you playing?")}>
          <button
            type="button"
            role="tab"
            aria-selected={currentMode === "local"}
            className={`${styles.modeBtn} ${currentMode === "local" ? styles.active : ""}`}
            onClick={() => mode("local")}
          >
            <span className={styles.btnIcon}>⌂</span>
            <span className={styles.btnText}>{t("site.localMode", "Local Game")}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={currentMode === "online"}
            className={`${styles.modeBtn} ${currentMode === "online" ? styles.active : ""}`}
            onClick={() => mode("online")}
          >
            <span className={styles.btnIcon}>⌁</span>
            <span className={styles.btnText}>{t("site.onlineMode", "Online Game")}</span>
          </button>
          <div className={`${styles.slider} ${currentMode === "online" ? styles.slideRight : ""}`} />
        </div>
      </div>
    </div>
  );
}
