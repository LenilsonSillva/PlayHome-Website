import { useEffect, useState } from "react";
import styles from "./revelPhase.module.css";
import type { ImpostorGameState } from "../../GameLogistic/types";
import { PlayerAvatar } from "../../../../../components/PlayerAvatar/PlayerAvatar";
import { useI18n } from "../../../../../i18n";

type RevealPhaseProps = {
  data: any;
  onNextPhase: (phase: ImpostorGameState["phase"]) => void;
  onExit: () => void;
  isOnline?: boolean;
  onReroll?: () => void;
  onToggleReadyOnline?: () => void;
};

export function RevealPhase({
  data,
  onNextPhase,
  onExit,
  isOnline,
  onReroll,
  onToggleReadyOnline,
}: RevealPhaseProps) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const allReady = data.allPlayers?.every((p: any) => p.ready);

  const canReroll = isOnline ? data.isHost : true;

  const player = isOnline
    ? {
        name: data.myName || t("games.impostor_lobby_you", "YOU"),
        emoji: data.myEmoji,
        color: data.myColor,
        isImpostor: data.isImpostor,
        word: data.word,
        hint: data.hint,
      }
    : data.players[index];

  const revealPlayers = data.allPlayers ?? data.players ?? [];
  const allies =
    data.impostorsUnited && player?.isImpostor
      ? revealPlayers.filter(
          (candidate: any) =>
            candidate.isImpostor && candidate.name !== player.name,
        )
      : [];

  function handleNext() {
    if (isOnline) {
      onNextPhase("discussion");
      return;
    }

    setRevealed(false);
    setIndex((prev) => prev + 1);
  }

  const handleRerollAction = () => {
    if (
      window.confirm(
        t(
          "games.impostor_reveal_changeWord_confirm",
          "Change the word and draw new impostors?",
        ),
      )
    ) {
      onReroll?.();
      setIndex(0);
      setRevealed(false);
    }
  };

  const handleReadyButtonOnline = () => {
    setRevealed(false);
    !data.ready && onToggleReadyOnline?.();
  };

  useEffect(() => {
    if (isOnline) setRevealed(false);
  }, [isOnline, data.word]);

  useEffect(() => {
    if (!isOnline && !player) onNextPhase("discussion");
  }, [onNextPhase, player, isOnline]);

  if (!player) return null;

  return (
    <div className={styles.container}>
      <button className={styles.exitBtn} onClick={onExit}>
        <strong className={styles.exitAndRerolEmoji}>⬅️</strong>{" "}
        {t("alerts.quit", "QUIT")}
      </button>

      {canReroll && (
        <button className={styles.rerollBtn} onClick={handleRerollAction}>
          {t("games.impostor_reveal_changeWord", "CHANGE WORD")} {" "}
          <strong className={styles.exitAndRerolEmoji}>🔄</strong>
        </button>
      )}

      <div className={styles.revealCard}>
        {!revealed ? (
          <>
            <p className={styles.instruction}>
              {isOnline
                ? t("games.impostor_reveal_confirmIdentity", "CONFIRM YOUR IDENTITY")
                : t("games.impostor_reveal_passDevice", "PASS THE DEVICE TO")}
            </p>

            <PlayerAvatar
              emoji={player.emoji}
              color={player.color}
              size={100}
              hideScan={false}
            />

            <h1 className={styles.playerName}>{player.name}</h1>

            <button
              className={`${styles.actionBtn} ${styles.revealBtn}`}
              onClick={() => setRevealed(true)}
            >
              {t("games.impostor_reveal_revealNowBtn", "REVEAL NOW")}
            </button>
          </>
        ) : (
          <>
            <div className={styles.infoWrapper}>
              {player.isImpostor ? (
                <>
                  <p className={styles.instruction}>
                    {t("games.impostor_reveal_youAre", "YOU ARE THE")}
                  </p>
                  <div className={styles.wordDisplayImpostor}>
                    <h1
                      className={`${styles.secretWord} ${styles.impostorGlow}`}
                    >
                      {t("games.impostor_reveal_impostorRole", "IMPOSTOR")}
                    </h1>
                  </div>
                  {player.hint && (
                    <div className={styles.hintBox}>
                      <p>
                        {t("games.impostor_reveal_hintLabel", "HINT")}: {player.hint}
                      </p>
                    </div>
                  )}
                  {allies.length > 0 && (
                    <div className={styles.alliesBox}>
                      <strong>
                        {t("games.impostor_reveal_ally", "YOUR ALLIES")}
                      </strong>
                      <span>{allies.map((ally: any) => ally.name).join(", ")}</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className={styles.instruction}>
                    {t("games.impostor_reveal_yourWordIs", "YOUR WORD IS:")}
                  </p>
                  <div className={styles.wordDisplay}>
                    <h1 className={`${styles.secretWord} ${styles.techGlow}`}>
                      {player.word}
                    </h1>
                  </div>
                </>
              )}
            </div>

            {(data.whoStart === player.name ||
              (isOnline && data.whoStart === "VOCÊ")) && (
              <div className={styles.starterAlert}>
                ⚠️ {t("games.impostor_reveal_youStart", "YOU START THE MATCH!")}
              </div>
            )}

            <button
              className={`${styles.actionBtn} ${styles.nextBtn}`}
              onClick={isOnline ? handleReadyButtonOnline : handleNext}
            >
              {isOnline
                ? data.ready
                  ? t("games.impostor_reveal_hideBtn", "HIDE")
                  : t("games.impostor_reveal_isReady", "I AM READY")
                : t("games.impostor_reveal_hideAndPass", "HIDE AND PASS")}
            </button>
          </>
        )}
      </div>

      {isOnline && (
        <div className={styles.readyList}>
          <h3>{t("games.impostor_statusModal_roomStatus", "READY STATUS")}</h3>
          {data.allPlayers?.map((p: any) => (
            <div key={p.socketId} className={styles.readyRow}>
              <span>
                {p.name === player.name
                  ? t("games.impostor_lobby_you", "YOU")
                  : p.name}
              </span>
              <span className={p.ready ? styles.ready : styles.notReady}>
                {p.ready
                  ? t("games.impostor_statusModal_ready", "READY")
                  : t("games.impostor_statusModal_waiting", "WAITING")}
              </span>
            </div>
          ))}
        </div>
      )}

      {isOnline && data.isHost && allReady && (
        <button
          className={styles.startBtn}
          onClick={() => onNextPhase("discussion")}
        >
          {t("games.impostor_reveal_startDiscussion", "START DISCUSSION")}
        </button>
      )}
    </div>
  );
}
