import { PlayerAvatar } from "../../../../../components/PlayerAvatar/PlayerAvatar";
import { useI18n } from "../../../../../i18n";
import styles from "./spectatorView.module.css";

export function SpectatorView({ gameData }: { gameData: any }) {
  const { t } = useI18n();
  const rawPlayers = gameData.players ?? gameData.allPlayers ?? [];

  const players = (rawPlayers || []).map((p: any) => ({
    id: p.id ?? p.socketId,
    name: p.name,
    emoji: p.emoji,
    color: p.color,
    isAlive: typeof p.isAlive === "boolean" ? p.isAlive : true,
    voted: !!p.voted,
    ready: !!p.ready,
    score: p.globalScore ?? p.score ?? 0,
  }));

  const phaseLabel = () => {
    switch (gameData.phase) {
      case "reveal":
        return t("games.impostor_phase_reveal", "REVEAL");
      case "discussion":
        return t("games.impostor_phase_discussion", "DISCUSSION");
      case "voting":
        return t("games.impostor_phase_voting", "VOTING");
      case "result":
        return t("games.impostor_phase_result", "RESULT");
      default:
        return t("games.impostor_phase_spectator", "SPECTATOR");
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.scanline} />

      <main className={styles.container}>
        <div className={`glass-panel ${styles.mainCard}`}>
          <header className={styles.header}>
            <div className={styles.liveIndicator}>
              <span className={styles.dot} />
              {t("games.impostor_spectator_liveFeed", "LIVE FEED")}
            </div>
            <h1 className={styles.title}>
              {t("games.impostor_spectator_observer", "OBSERVER")} {" "}
              <span>{t("games.impostor_spectator_tatical", "TACTICAL")}</span>
            </h1>
            <p className={styles.subtitle}>
              {t(
                "games.impostor_spectator_monitorLabel",
                "Real-time player monitoring",
              )}
            </p>
          </header>

          <div className={styles.statusBox}>
            <div className={styles.phaseBadge}>
              {t("games.impostor_spectator_systemStatus", "SYSTEM STATUS:")} {" "}
              <strong>{phaseLabel()}</strong>
            </div>
          </div>

          <section className={styles.groupSection}>
            <h3 className={styles.label}>
              {t("games.impostor_spectator_crewStatus", "PLAYER STATUS")}
            </h3>

            <div className={styles.playerGrid}>
              {players.map((p: any) => (
                <div
                  key={p.id}
                  className={`${styles.playerCard} ${!p.isAlive ? styles.dead : ""}`}
                >
                  <div className={styles.avatarMini}>
                    <PlayerAvatar
                      emoji={p.emoji}
                      color={p.isAlive ? p.color : "#475569"}
                      size={45}
                      hideScan={!p.isAlive}
                    />
                  </div>

                  <div className={styles.playerInfo}>
                    <span className={styles.name}>{p.name}</span>
                    <span className={styles.statusText}>
                      {p.isAlive
                        ? t("games.impostor_spectator_activeSignal", "ACTIVE SIGNAL")
                        : t("games.impostor_spectator_lostSignal", "SIGNAL LOST")}
                    </span>
                  </div>

                  <div className={styles.playerMeta}>
                    <span className={styles.score}>
                      {p.score} {t("site.points", "PTS")}
                    </span>
                    {gameData.phase === "voting" && p.isAlive && (
                      <span
                        className={`${styles.voteIndicator} ${p.voted ? styles.voted : ""}`}
                      >
                        {p.voted
                          ? t("games.impostor_statusModal_voted", "VOTED")
                          : t("games.impostor_statusModal_waiting", "WAITING")}
                      </span>
                    )}
                    {gameData.phase === "reveal" && (
                      <span
                        className={`${styles.readyFlag} ${p.ready ? styles.isReady : ""}`}
                      >
                        {p.ready
                          ? t("games.impostor_statusModal_ready", "READY")
                          : t("games.impostor_spectator_reading", "READING")}
                      </span>
                    )}
                  </div>

                  {!p.isAlive && (
                    <div className={styles.deadOverlay}>
                      {t("games.impostor_spectator_eliminated", "ELIMINATED")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <footer className={styles.footer}>
            <div className={styles.loadingInfo}>
              <div className={styles.spinner} />
              {t(
                "games.impostor_spectator_waitingEnd",
                "WAITING FOR THE ROUND TO END...",
              )}
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
