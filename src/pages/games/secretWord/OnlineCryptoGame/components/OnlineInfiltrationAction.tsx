import { useCallback, useRef, useState } from "react";
import type { CryptoView } from "../../../../../types/cryptoOnline";
import { OperatorWordPanel, Scoreboard, TeamHud, TeamMembers } from "./shared";
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
  const [feedback, setFeedback] = useState<"none" | "success" | "skip">("none");
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flash = useCallback((type: "success" | "skip") => {
    setFeedback(type);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback("none"), 350);
  }, []);

  const handleWordAction = (success: boolean) => {
    flash(success ? "success" : "skip");
    emit("crypto:word-action", { roomCode: view.roomCode, success });
  };

  const waitingWord = view.currentWordVisible ? view.currentWord : null;

  return (
    <div className={styles.container}>
      <TeamHud
        view={view}
        extraStats={
          isController || isMemberOfCurrentTeam
            ? [{ label: "PULOS:", value: view.skipsLeft === 999 ? "∞" : view.skipsLeft }]
            : undefined
        }
      />

      {isController ? (
        /* ================= OPERADOR DA VEZ (OU HOST) ================= */
        <div className={styles.actionArea}>
          <OperatorWordPanel
            word={view.currentWord}
            timerRunning={running}
            feedback={feedback}
          />

          {!running ? (
            <button
              className={styles.bigCyanBtn}
              onClick={() => emit("crypto:start-timer", { roomCode: view.roomCode })}
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
              <button className={styles.successBtn} onClick={() => handleWordAction(true)}>
                ✅ ACERTOU!
              </button>
            </div>
          )}

          {running && (
            <button
              className={styles.ghostBtn}
              onClick={() => emit("crypto:finish-turn", { roomCode: view.roomCode })}
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
            Grupo <strong style={{ color: currentTeam.color }}>{currentTeam.name}</strong>{" "}
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
