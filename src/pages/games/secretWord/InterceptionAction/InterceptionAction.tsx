import { useCallback, useEffect, useRef, useState } from "react";
import type { CryptoGameState } from "../GameLogistic/types";
import styles from "./interceptionAction.module.css";
import { WordRevealBox } from "../components/WordRevealBox";
import { CryptoHud } from "../components/CryptoHud";
import successSfx from "../../../../assets/sounds/success.wav";
import skipSfx from "../../../../assets/sounds/skip.mp3";
import alertSfx from "../../../../assets/sounds/alert.wav";
import endSfx from "../../../../assets/sounds/end.wav";
import silentWav from "../../../../assets/sounds/silent.wav";
import { useIOSAudioUnlock } from "../../../../hooks/useIOSAudioUnlock";

type Props = {
  data: CryptoGameState;
  onFinishMatch: (winnerTeamIdx: number | null) => void;
  onPassTurn: () => void;
  onStartTimer: () => void;
  onReroll: () => void;
};

// Modo INTERCEPTAÇÃO offline — mesmo fluxo do PlayHome-RN:
// dica dada -> cronômetro -> acertou (ponto) ou errou (passa a vez);
// tempo esgotado conta como erro e passa a vez automaticamente.
export function InterceptionAction({
  data,
  onFinishMatch,
  onPassTurn,
  onStartTimer,
  onReroll,
}: Props) {
  const currentTeam = data.teams[data.currentTeamIndex];
  const operator = currentTeam.players.find(
    (p) => p.id === currentTeam.operatorId,
  );

  const [seconds, setSeconds] = useState(data.config.roundTime);
  const [timerActive, setTimerActive] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [hasViewedWord, setHasViewedWord] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<"none" | "success" | "fail">(
    "none",
  );
  const turnEndTime = useRef<number | null>(null);

  const { initAudio, playSound } = useIOSAudioUnlock(
    {
      success: successSfx,
      skip: skipSfx,
      alert: alertSfx,
      end: endSfx,
    },
    silentWav,
  );

  // Reseta o timer quando a palavra ou o time mudar (turno novo)
  useEffect(() => {
    setTimerActive(false);
    turnEndTime.current = null;
    setSeconds(data.config.roundTime);
    setHasViewedWord(false);
    setIsRevealing(false);
  }, [data.currentWord, data.currentTeamIndex, data.config.roundTime]);

  const triggerFeedback = useCallback(
    (type: "success" | "fail") => {
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

  const startTurnTimer = () => {
    setTimerActive(true);
    turnEndTime.current = Date.now() + data.config.roundTime * 1000;
    onStartTimer();
  };

  // Loop do cronômetro (tempo esgotado = errou/passou a vez)
  useEffect(() => {
    if (!timerActive || !turnEndTime.current) return;

    const interval = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.ceil((turnEndTime.current! - Date.now()) / 1000),
      );
      setSeconds(remaining);

      if (remaining === 3) playSound("alert");

      if (remaining <= 0) {
        clearInterval(interval);
        playSound("end");
        onPassTurn();
      }
    }, 250);

    return () => clearInterval(interval);
  }, [timerActive, onPassTurn, playSound]);

  const handleWin = () => {
    if (isProcessing || !hasViewedWord) return;
    setIsProcessing(true);
    triggerFeedback("success");
    // Pequeno delay para ver o feedback antes de trocar de palavra
    setTimeout(() => {
      onFinishMatch(data.currentTeamIndex);
      setIsProcessing(false);
    }, 400);
  };

  const handlePass = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    triggerFeedback("fail");
    setTimeout(() => {
      onPassTurn();
      setIsProcessing(false);
    }, 300);
  };

  const handlePointerDown = useCallback(() => {
    initAudio(); // desbloqueia áudio no iOS
    if (!hasViewedWord) setHasViewedWord(true);
    if (!isRevealing) setIsRevealing(true);
  }, [hasViewedWord, isRevealing, initAudio]);

  const handlePointerUp = useCallback(() => {
    setIsRevealing(false);
  }, []);

  const progress = Math.min(
    (data.currentMatchIndex / Math.max(data.config.wordLimit, 1)) * 100,
    100,
  );

  return (
    <div className={styles.container}>
      <div className={styles.progressIndicator}>
        PALAVRA {data.currentMatchIndex + 1} DE {data.config.wordLimit}
        <div className={styles.progressBg}>
          <div
            className={styles.progressFill}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <CryptoHud
        label="VEZ DE"
        teamName={currentTeam.name}
        teamColor={currentTeam.color}
        operatorName={operator?.name ?? "---"}
        stats={[{ text: "✅", value: currentTeam.roundScore, tone: "success" }]}
        countdown={timerActive ? seconds : null}
        totalTime={data.config.roundTime}
      />

      <WordRevealBox
        word={data.currentWord}
        feedback={feedback}
        isRevealing={isRevealing}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        hasStarted={hasViewedWord}
      />

      <div className={styles.actionsWrapper}>
        {!timerActive ? (
          <div className={styles.setupActions}>
            <button
              className={styles.startTimerBtn}
              onClick={startTurnTimer}
              disabled={!hasViewedWord}
            >
              DICA DADA! INICIAR RESPOSTA ⏱️
            </button>
            <button
              className={styles.rerollBtn}
              onClick={() => {
                setHasViewedWord(false);
                onReroll();
              }}
            >
              🔄 TROCAR PALAVRA
            </button>
          </div>
        ) : (
          <div className={styles.gameActions}>
            <button className={styles.failBtn} onClick={handlePass}>
              ERROU / PASSAR ⏭️
            </button>
            <button
              className={styles.winBtn}
              onClick={handleWin}
              disabled={!hasViewedWord || isProcessing}
            >
              ACERTOU! 🏆
            </button>
          </div>
        )}
      </div>

      <div className={styles.teamsStatus}>
        {data.teams.map((t, idx) => (
          <div
            key={t.id}
            className={`${styles.teamDot} ${idx === data.currentTeamIndex ? styles.activeDot : ""}`}
            style={{ backgroundColor: t.color } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  );
}
