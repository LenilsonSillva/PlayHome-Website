import { useState } from "react";
import { GameCard } from "../../components/GameCard/GameCard";
import { AppDownloadModal } from "../../components/AppDownloadModal/AppDownloadModal";
import { PlayerContextProvider } from "../../contexts/playersProvider";
import { useI18n } from "../../i18n";
import type { Game } from "../../types/game";
import playhomeIcon from "../../assets/brand/playhome-icon.png";
import styles from "./styles.module.css";

type ConnectionMode = "local" | "online";

type HomeGame = Game & {
  accent: string;
  btn: string;
};

export default function Home() {
  const { t } = useI18n();
  const [mode, setMode] = useState<ConnectionMode>("local");
  const [showDownloadModal, setShowDownloadModal] = useState(true);

  const games: HomeGame[] = [
    {
      id: "impostor",
      name: t("games.impostor_title", "IMPOSTOR"),
      description: t("games.impostor_desc", "Find the hidden impostor before the table turns on itself."),
      minPlayers: 3,
      maxPlayers: 20,
      route: "/games/impostor/lobby",
      icon: "🤫",
      accent: "var(--danger-neon)",
      btn: "var(--button-red)",
    },
    {
      id: "secret-word",
      name: t("games.cripto_title", "CRYPTOGRAPHY"),
      description: t("games.cripto_desc", "Give precise clues and help your team decrypt the word."),
      minPlayers: 4,
      maxPlayers: 20,
      route: "/games/secretWord/lobby",
      icon: "🔑",
      accent: "var(--tech-cyan)",
      btn: "var(--button-tech)",
    },
  ];

  return (
    <PlayerContextProvider>
      <div className={styles.pageWrapper}>
        <div className={styles.ambientPink} aria-hidden="true" />
        <div className={styles.ambientBlue} aria-hidden="true" />
        <div className={`${styles.orbit} ${styles.orbitOne}`} aria-hidden="true" />
        <div className={`${styles.orbit} ${styles.orbitTwo}`} aria-hidden="true" />

        <main className={styles.homeContainer}>
          <section className={styles.hero} aria-labelledby="home-title">
            <div className={styles.heroMeta}>
              <span className={styles.liveDot} />
              <span>{t("home.system_status", "SYSTEM ONLINE")}</span>
              <span className={styles.metaDivider}>/</span>
              <span>PLAYHOME</span>
            </div>

            <div className={styles.brandLockup}>
              <img className={styles.brandIcon} src={playhomeIcon} alt="" />
              <div>
                <p className={styles.brandName} id="home-title">
                  PLAY<span>HOME</span>
                </p>
                <p className={styles.brandKicker}>{t("site.heroKicker", "THE GAME ROOM FOR YOUR HOME")}</p>
              </div>
            </div>

            <div className={styles.heroCopy}>
              <h1>{t("site.heroTitle", "Play together. Think different.")}</h1>
              <p>{t("site.heroBody", "Turn any get-together into a memorable match.")}</p>
            </div>

            <div className={styles.modeBlock}>
              <div className={styles.sectionMarker}>
                <span>01</span>
                <span>{t("site.chooseMode", "How are you playing?")}</span>
              </div>
              <div className={styles.modeRail} role="tablist" aria-label={t("site.chooseMode", "How are you playing?")}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "local"}
                  className={`${styles.modeButton} ${mode === "local" ? styles.modeSelected : ""}`}
                  onClick={() => setMode("local")}
                >
                  <span className={styles.modeIcon} aria-hidden="true">⌂</span>
                  <span className={styles.modeText}>
                    <strong>{t("site.localMode", "Local Game")}</strong>
                    <small>{t("site.localModeBody", "One device, everyone around the same table.")}</small>
                  </span>
                  <span className={styles.modeArrow} aria-hidden="true">↗</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === "online"}
                  className={`${styles.modeButton} ${mode === "online" ? styles.modeSelected : ""}`}
                  onClick={() => setMode("online")}
                >
                  <span className={styles.modeIcon} aria-hidden="true">⌁</span>
                  <span className={styles.modeText}>
                    <strong>{t("site.onlineMode", "Online Game")}</strong>
                    <small>{t("site.onlineModeBody", "Create a room and invite your friends.")}</small>
                  </span>
                  <span className={styles.modeArrow} aria-hidden="true">↗</span>
                </button>
              </div>
            </div>
          </section>

          <section className={styles.gameShelf} aria-labelledby="game-shelf-title">
            <div className={styles.shelfHeader}>
              <div>
                <p className={styles.shelfEyebrow}>{t("site.shelfLabel", "TWO GAMES · ENDLESS ROUNDS")}</p>
                <h2 id="game-shelf-title">{t("site.chooseGame", "Choose an experience")}</h2>
              </div>
              <span className={styles.shelfCount}>02 / 02</span>
            </div>
            <div className={styles.gamesGrid}>
              {games.map((game) => (
                <GameCard key={game.id} game={{ ...game, mode }} />
              ))}
            </div>
          </section>

          <footer className={styles.homeFooter}>
            <div className={styles.bankNote}>
              <img className={styles.footerIcon} src={playhomeIcon} alt="PlayHome" />
              <span>
                <strong>{t("site.officialBank", "Official PlayHome bank")}</strong>
                <small>{t("site.bankBody", "Categories and words stay in sync with the app.")}</small>
                <small>{t("site.studio", "By Usuper Interactive")}</small>
              </span>
            </div>
            <a
              className={styles.downloadCta}
              href="https://play.google.com/store/apps/details?id=com.usuper.playhome"
              target="_blank"
              rel="noreferrer"
              onClick={() => setShowDownloadModal(false)}
            >
              <span>{t("site.downloadApp", "Download the app")}</span>
              <span aria-hidden="true">↗</span>
            </a>
            <span className={styles.footerCode}>PLAY / PLAY / REPEAT</span>
          </footer>
        </main>
        {showDownloadModal && (
          <AppDownloadModal onClose={() => setShowDownloadModal(false)} />
        )}
      </div>
    </PlayerContextProvider>
  );
}
