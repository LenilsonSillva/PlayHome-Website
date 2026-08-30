import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./infiltrationAction.module.css";
import type { CryptoGameState } from "../GameLogistic/types";
import { WordRevealBox } from "../components/WordRevealBox";
import { CryptoHud } from "../components/CryptoHud";
import successSfx from "../../../../assets/sounds/success.wav";
import skipSfx from "../../../../assets/sounds/skip.mp3";
import alertSfx from "../../../../assets/sounds/alert.wav";
import endSfx from "../../../../assets/sounds/end.wav";
import silentWav from "../../../../assets/sounds/silent.wav";
import { useIOSAudioUnlock } from "../../../../hooks/useIOSAudioUnlock";
import { useI18n } from "../../../../i18n";

type Props = {
  data: CryptoGameState;
  onAction: (type: "correct" | "skip") => void;
  onTimeUp: () => void;
  onStartTimer: () => void;
};

// Modo INFILTRAÇÃO offline — mesmo fluxo do PlayHome-RN:
// cronômetro explícito -> acertou/pular -> tempo esgota e a vez
// passa para o próximo group (até fechar a rodada).
export function InfiltrationAction({
  data,
  onAction,
  onTimeUp,
  onStartTimer,
}: Props) {
  const { t } = useI18n();
  const currentTeam = data.teams[data.currentTeamIndex];
  const operator = currentTeam.players.find(
    (p) => p.id === currentTeam.operatorId,
  );
  const running = data.roundEndTime !== undefined;

  const [timeLeft, setTimeLeft] = useState(data.config.roundTime);
  const [isRevealing, setIsRevealing] = useState(false);
  const [hasViewedWord, setHasViewedWord] = useState(false);
  const [feedback, setFeedback] = useState<"none" | "success" | "skip">(
    "none",
  );
  const alertFired = useRef(false);

  const { initAudio, playSound } = useIOSAudioUnlock(
    {
      success: successSfx,
      skip: skipSfx,
      alert: alertSfx,
      end: endSfx,
    },
    silentWav,
  );

  // Timer blindado: conta a partir do roundEndTime do estado (bomba-relógio)
  useEffect(() => {
    if (!data.roundEndTime) {
      setTimeLeft(data.config.roundTime);
      alertFired.current = false;
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil((data.roundEndTime! - Date.now()) / 1000),
      );
      setTimeLeft(remaining);

      if (remaining === 10 && !alertFired.current) {
        alertFired.current = true;
        playSound("alert");
      }

      if (remaining <= 0) {
        clearInterval(interval);
        playSound("end");
        onTimeUp();
      }
    }, 250);

    return () => clearInterval(interval);
  }, [data.roundEndTime, data.config.roundTime, onTimeUp, playSound]);

  // Reseta a visualização quando a palavra ou o time mudar (turno novo)
  useEffect(() => {
    setHasViewedWord(false);
    setIsRevealing(false);
  }, [data.currentWord, data.currentTeamIndex]);

  const triggerFeedback = useCallback(
    (type: "success" | "skip") => {
      setFeedback(type);
      if (type === "success") {
        playSound("success");
        if ("vibrate" in navigator) navigator.vibrate(200);
      } else {
        playSound("skip");
        if ("vibrate" in navigator) navigator.vibrate([100, 50, 100]);
      }
      setTimeout(() => setFeedback("none"), 300);
    },
    [playSound],
  );

  const handlePointerDown = useCallback(() => {
    initAudio(); // desbloqueia áudio no iOS
    if (!hasViewedWord) setHasViewedWord(true);
    if (!isRevealing) setIsRevealing(true);
  }, [hasViewedWord, isRevealing, initAudio]);

  const handlePointerUp = useCallback(() => {
    setIsRevealing(false);
  }, []);

  return (
    <div className={styles.container}>
      <CryptoHud
        label={t("games.cryptography_action_playingNow", "PLAYING NOW")}
        teamName={currentTeam.name}
        teamColor={currentTeam.color}
        operatorName={operator?.name ?? "---"}
        stats={[
          {
            text: "✅",
            value: currentTeam.roundScore,
            tone: "success",
          },
          {
            text: t("games.cryptography_action_skips", "SKIPS LEFT"),
            value: data.skipsLeft === 999 ? "∞" : data.skipsLeft,
            tone: "warning",
          },
        ]}
        countdown={running ? timeLeft : null}
        totalTime={data.config.roundTime}
      />

      <WordRevealBox
        word={data.currentWord}
        hasStarted={running}
        isRevealing={isRevealing}
        feedback={feedback}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      />

      <div className={styles.statsRow}>
        <div className={styles.statBox}>
          <label>{t("games.cryptography_action_hits", "HITS")}</label>
          <span>{currentTeam.roundScore}</span>
        </div>
        <div className={styles.statBox}>
          <label>{t("games.cryptography_action_skips", "SKIPS LEFT")}</label>
          <span>
            {data.skipsLeft === 999
              ? `∞ (${t("site.unlimited", "unlimited")})`
              : `${data.skipsLeft} / ${data.config.skipLimit}`}
          </span>
        </div>
      </div>

      {!running ? (
        <button
          className={styles.startBtn}
          onClick={() => {
            initAudio();
            playSound("alert");
            onStartTimer();
          }}
        >
          ⏱️ {t("games.cryptography_action_tapToStart", "START TIMER")} ({data.config.roundTime}s)
        </button>
      ) : (
        <div className={styles.actions}>
          <button
            className={styles.skipBtn}
            onClick={() => {
              triggerFeedback("skip");
              onAction("skip");
            }}
            disabled={data.skipsLeft === 0}
          >
            {t("games.cryptography_action_skipBtn", "SKIP")}
          </button>
          <button
            className={styles.correctBtn}
            onClick={() => {
              triggerFeedback("success");
              onAction("correct");
            }}
            disabled={!hasViewedWord}
          >
            {t("games.cryptography_action_correctBtn", "CORRECT! 🚀")}
          </button>
        </div>
      )}
    </div>
  );
}
