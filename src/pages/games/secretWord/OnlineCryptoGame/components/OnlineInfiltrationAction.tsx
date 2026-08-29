import { useCallback, useEffect, useRef, useState } from "react";
import type { CryptoView } from "../../../../../types/cryptoOnline";
import { Scoreboard, TeamMembers } from "./shared";
import { CryptoHud } from "../../components/CryptoHud";
import { WordRevealBox } from "../../components/WordRevealBox";
import successSfx from "../../../../../assets/sounds/success.wav";
import skipSfx from "../../../../../assets/sounds/skip.mp3";
import alertSfx from "../../../../../assets/sounds/alert.wav";
import endSfx from "../../../../../assets/sounds/end.wav";
import silentWav from "../../../../../assets/sounds/silent.wav";
import { useIOSAudioUnlock } from "../../../../../hooks/useIOSAudioUnlock";
import styles from "../onlineCrypto.module.css";

type Props = {
  view: CryptoView;
  emit: (event: string, payload?: unknown) => void;
};

export function OnlineInfiltrationAction({ view, emit }: Props) {
  const currentTeam = view.teams[view.currentTeamIndex];
  const running = view.roundEndTime != null;
  const isController = view.controls.canControl;
  const isMemberOfCurrentTeam = view.myTeamIndex === view.currentTeamIndex;
  const [timeLeft, setTimeLeft] = useState(view.config.roundTime);
  const [isRevealing, setIsRevealing] = useState(false);
  const [hasViewedWord, setHasViewedWord] = useState(false);
  const [feedback, setFeedback] = useState<"none" | "success" | "skip">("none");
  const alertFired = useRef(false);
  const endFired = useRef(false);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { initAudio, playSound } = useIOSAudioUnlock(
    {
      success: successSfx,
      skip: skipSfx,
      alert: alertSfx,
      end: endSfx,
    },
    silentWav,
  );

  // O servidor encerra o turno. Este contador só reproduz os mesmos
  // avisos sonoros do modo offline no dispositivo do operador da vez.
  useEffect(() => {
    if (!view.roundEndTime) {
      setTimeLeft(view.config.roundTime);
      alertFired.current = false;
      endFired.current = false;
      return;
    }

    const endTime = view.roundEndTime;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setTimeLeft(remaining);

      if (remaining === 10 && !alertFired.current) {
        alertFired.current = true;
        if (isController) playSound("alert");
      }

      if (remaining <= 0 && !endFired.current) {
        endFired.current = true;
        clearInterval(interval);
        if (isController) playSound("end");
      }
    }, 250);

    return () => clearInterval(interval);
  }, [view.roundEndTime, view.config.roundTime, isController, playSound]);

  // Cada palavra e cada grupo iniciam uma nova visualização segura.
  useEffect(() => {
    setHasViewedWord(false);
    setIsRevealing(false);
  }, [view.currentWord, view.currentTeamIndex]);

  const flash = useCallback(
    (type: "success" | "skip") => {
      setFeedback(type);
      if (type === "success") {
        playSound("success");
        if ("vibrate" in navigator) navigator.vibrate(200);
      } else {
        playSound("skip");
        if ("vibrate" in navigator) navigator.vibrate([100, 50, 100]);
      }
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
      feedbackTimer.current = setTimeout(() => setFeedback("none"), 300);
    },
    [playSound],
  );

  const handlePointerDown = useCallback(() => {
    initAudio();
    setHasViewedWord(true);
    setIsRevealing(true);
  }, [initAudio]);

  const handlePointerUp = useCallback(() => {
    setIsRevealing(false);
  }, []);

  const handleWordAction = (success: boolean) => {
    if (success && !hasViewedWord) return;
    flash(success ? "success" : "skip");
    emit("crypto:word-action", { roomCode: view.roomCode, success });
  };

  const handleStartTimer = () => {
    if (!hasViewedWord) return;
    initAudio();
    playSound("alert");
    emit("crypto:start-timer", { roomCode: view.roomCode });
  };

  const operator = currentTeam.players.find(
    (p) => p.id === currentTeam.operatorId,
  );
  const waitingWord = view.currentWordVisible ? view.currentWord : null;

  return (
    <div className={styles.container}>
      <CryptoHud
        label="JOGANDO AGORA"
        teamName={currentTeam.name}
        teamColor={currentTeam.color}
        operatorName={operator?.name ?? "---"}
        stats={[
          { text: "✅", value: currentTeam.roundScore, tone: "success" },
          ...(isController || isMemberOfCurrentTeam
            ? [
                {
                  text: "PULOS:",
                  value: view.skipsLeft === 999 ? "∞" : view.skipsLeft,
                  tone: "warning" as const,
                },
              ]
            : []),
        ]}
        countdown={running ? timeLeft : null}
        totalTime={view.config.roundTime}
      />

      {isController ? (
        /* ================= OPERADOR DA VEZ ================= */
        <div className={styles.actionArea}>
          <WordRevealBox
            word={view.currentWord}
            hasStarted={running}
            isRevealing={isRevealing}
            feedback={feedback}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
          />

          {!running ? (
            <button
              className={styles.bigCyanBtn}
              onClick={handleStartTimer}
              disabled={!hasViewedWord}
            >
              ⏱️ INICIAR CRONÔMETRO ({view.config.roundTime}s)
            </button>
          ) : (
            <div className={styles.actionRow}>
              <button
                className={styles.dangerBtn}
                disabled={view.skipsLeft === 0}
                onClick={() => handleWordAction(false)}
              >
                ⏭ PULAR
              </button>
              <button
                className={styles.successBtn}
                disabled={!hasViewedWord}
                onClick={() => handleWordAction(true)}
              >
                ✅ ACERTOU!
              </button>
            </div>
          )}

          {running && (
            <button
              className={styles.ghostBtn}
              onClick={() =>
                emit("crypto:finish-turn", { roomCode: view.roomCode })
              }
            >
              ENCERRAR TURNO DO GRUPO
            </button>
          )}
        </div>
      ) : isMemberOfCurrentTeam ? (
        /* ================= MEMBRO DO GRUPO DA VEZ ================= */
        <div className={styles.waitingPanel}>
          <span className={styles.waitingIcon}>🔍</span>
          <h2>SEU ESQUADRÃO ESTÁ JOGANDO!</h2>
          <p>
            O operador está dando as dicas — tente adivinhar a palavra com seu
            time. A palavra fica oculta para vocês.
          </p>
          <TeamMembers team={currentTeam} />
        </div>
      ) : (
        /* ================= OUTROS GRUPOS / ESPECTADORES ================= */
        <div className={styles.waitingPanel}>
          <span className={styles.waitingIcon}>⏳</span>
          <h2>AGUARDE SUA VEZ</h2>
          <p className={styles.waitingSub}>
            Grupo{" "}
            <strong style={{ color: currentTeam.color }}>
              {currentTeam.name}
            </strong>{" "}
            está jogando
          </p>

          <div className={styles.wordPeek}>
            {waitingWord ? (
              <>
                <span className={styles.wordPeekLabel}>PALAVRA ATUAL</span>
                <span className={styles.wordPeekValue}>{waitingWord}</span>
              </>
            ) : (
              <span className={styles.wordPeekHidden}>🔒 Palavra oculta</span>
            )}
          </div>

          <TeamMembers team={currentTeam} />
          <Scoreboard teams={view.teams} />
        </div>
      )}
    </div>
  );
}
