import { useEffect, useRef, useState } from "react";
import styles from "./discussPhase.module.css";
import type {
  GameRouteState,
  ImpostorGameState,
} from "../../GameLogistic/types";
import { PlayerAvatar } from "../../../../../components/PlayerAvatar/PlayerAvatar";
import startedSd from "./../../../../../assets/sounds/alert.wav";
import { useI18n } from "../../../../../i18n";

type DiscussPhaseProps = {
  data: GameRouteState["data"] | any;
  onNextPhase: (phase: ImpostorGameState["phase"]) => void;
  isOnline?: boolean;
};

export function DiscussPhase({
  data,
  onNextPhase,
  isOnline,
}: DiscussPhaseProps) {
  const { t } = useI18n();
  const [seconds, setSeconds] = useState(0);
  const players = Array.isArray(data.players) ? data.players : [];
  const aliveImpostorsCount = players.filter(
    (p: any) => p.isImpostor && p.isAlive,
  ).length;
  const [, setFeedback] = useState<"none" | "started">("none");
  const impostorSound = useRef(new Audio(startedSd));

  const playSound = (audioRef: React.RefObject<HTMLAudioElement>) => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
    setTimeout(() => setFeedback("none"), 300);
  };

  const triggerFeedback = (type: "started") => {
    if (type === "started") {
      playSound(impostorSound);
      if ("vibrate" in navigator) navigator.vibrate(200);
      setTimeout(() => setFeedback("none"), 10);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => setSeconds((p) => p + 1), 1000);
    if (seconds === 0) triggerFeedback("started");
    return () => clearInterval(interval);
  }, []);

  const sortedPlayers = [...players]
    .filter((p) => p.isAlive)
    .sort((a, b) => (b.globalScore ?? 0) - (a.globalScore ?? 0));

  function formatTime(totalSeconds: number) {
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  return (
    <div className={styles.container}>
      <div className={styles.glassPanel}>
        {isOnline && data.roomCode ? (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <h1 className={styles.title}>
              {t("games.impostor_phase_discussion", "DISCUSSION")}
            </h1>
            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                padding: "4px 12px",
                borderRadius: "4px",
                fontSize: "12px",
                fontFamily: "monospace",
                color: "var(--text-secondary)",
              }}
            >
              {t("site.roomCode", "ROOM")}: <strong>{data.roomCode}</strong>
            </div>
          </div>
        ) : (
          <h1 className={styles.title}>
            {t("games.impostor_phase_discussion", "DISCUSSION")}
          </h1>
        )}

        <div className={styles.timerContainer}>
          <span className={styles.timerLabel}>
            {t("games.impostor_discuss_time", "ELAPSED TIME")}
          </span>
          <div className={styles.clock}>{formatTime(seconds)}</div>
        </div>

        <div className={styles.statusBox}>
          {data.whoStart && (
            <p className={styles.startInfo}>
              📡 <strong>{data.whoStart.toUpperCase()}</strong>{" "}
              {t("games.impostor_discuss_whoStart", "STARTS THE DISCUSSION")}
            </p>
          )}

          <p className={styles.impostorCount}>
            ⚠️ {aliveImpostorsCount}{" "}
            {aliveImpostorsCount === 1
              ? t("games.impostor_discuss_impostor", "IMPOSTOR")
              : t("games.impostor_discuss_impostors", "IMPOSTORS")} {" "}
            {t("games.impostor_discuss_impostorsLeft", "ALIVE")}
          </p>
        </div>

        <div className={styles.playerGrid}>
          {sortedPlayers.map((p) => (
            <div
              key={p.id}
              className={styles.playerCard}
              style={{ "--player-color": p.color } as any}
            >
              <PlayerAvatar
                emoji={p.emoji}
                color={p.color}
                size={40}
                hideScan
              />
              <div className={styles.playerInfo}>
                <span className={styles.playerName}>{p.name}</span>
                <span className={styles.playerScore}>
                  {t("games.impostor_discuss_score", "SCORE")}: {p.globalScore}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.buttonGroup}>
          {!isOnline || (isOnline && data.isHost) ? (
            <button
              className={`${styles.actionBtn} ${styles.votingBtn}`}
              onClick={() => onNextPhase("voting")}
            >
              {t("games.impostor_discuss_startVote", "START VOTING")}
            </button>
          ) : (
            <div className={styles.waitHost}>
              ⏳ {t("games.impostor_discuss_waitHost", "Wait for the host to start the voting...")}
            </div>
          )}

          {!isOnline && (
            <button
              className={`${styles.actionBtn} ${styles.skipBtn}`}
              onClick={() => onNextPhase("elimination")}
            >
              {t("games.impostor_discuss_eliminate", "SKIP VOTE AND ELIMINATE")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
