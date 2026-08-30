import styles from "./secretWordHeader.module.css";
import "../../../src/styles/theme.css";
import { useNavigate } from "react-router-dom";
import type { CryptoMode } from "../../pages/games/secretWord/GameLogistic/types";
import { useI18n } from "../../i18n";
import playhomeIcon from "../../assets/brand/playhome-icon.png";

type ChildProps = {
  mode: (value: CryptoMode) => void;
  currentMode: CryptoMode;
  connectionMode: "local" | "online";
  onConnectionMode: (value: "local" | "online") => void;
};

export function SecretWordHeader({
  mode,
  currentMode,
  connectionMode,
  onConnectionMode,
}: ChildProps) {
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
          <span>02</span>
          {t("home.header_protocol", "GAME SYSTEM")}
        </div>
      </header>
      <button type="button" className={styles.backButton} onClick={() => navigate("/")}>
        ← {t("site.backToMenu", "Back to main menu")}
      </button>

      <div className={styles.gameSection}>
        <div className={styles.titleMeta}>{t("home.card_subTitleCrypto", "LOGIC & STRATEGY")}</div>
        <h1 className={styles.gameTitle}>
          {t("games.cryptography_title", "CRYPTOGRAPHY")} <span className={styles.shhEmoji}>🔑</span>
        </h1>
        <p className={styles.gameDescription}>{t("games.cripto_desc", "Decode the word with precise clues from your team.")}</p>

        <p className={styles.instruction}>{t("site.chooseMode", "How are you playing?")}</p>
        <div className={styles.modeSelector} role="tablist" aria-label={t("site.chooseMode", "How are you playing?")}>
          <button
            type="button"
            role="tab"
            aria-selected={connectionMode === "local"}
            className={`${styles.modeBtn} ${connectionMode === "local" ? styles.active : ""}`}
            onClick={() => onConnectionMode("local")}
          >
            <span className={styles.btnIcon}>⌂</span>
            <span className={styles.btnText}>{t("site.localMode", "Local Game")}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={connectionMode === "online"}
            className={`${styles.modeBtn} ${connectionMode === "online" ? styles.active : ""}`}
            onClick={() => onConnectionMode("online")}
          >
            <span className={styles.btnIcon}>⌁</span>
            <span className={styles.btnText}>{t("site.onlineMode", "Online Game")}</span>
          </button>
          <div className={`${styles.slider} ${connectionMode === "online" ? styles.slideRight : ""}`} />
        </div>

        <p className={styles.instruction}>{t("site.chooseGameMode", "Choose a game mode")}</p>
        <div className={`${styles.modeSelector} ${styles.protocolSelector}`} role="tablist" aria-label={t("site.chooseGameMode", "Choose a game mode")}>
          <button
            type="button"
            role="tab"
            aria-selected={currentMode === "infiltration"}
            className={`${styles.modeBtn} ${currentMode === "infiltration" ? styles.active : ""}`}
            onClick={() => mode("infiltration")}
          >
            <span className={styles.btnIcon}>⚡</span>
            <span className={styles.btnText}>{t("games.cryptography_mode_infiltration", "Infiltration")}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={currentMode === "interception"}
            className={`${styles.modeBtn} ${currentMode === "interception" ? styles.active : ""}`}
            onClick={() => mode("interception")}
          >
            <span className={styles.btnIcon}>⚔️</span>
            <span className={styles.btnText}>{t("games.cryptography_mode_interception", "Interception")}</span>
          </button>
          <div className={`${styles.slider} ${styles.protocolSlider} ${currentMode === "interception" ? styles.slideRight : ""}`} />
        </div>
      </div>
    </div>
  );
}
