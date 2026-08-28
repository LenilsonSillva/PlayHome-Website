import { useCallback, useRef, useState } from "react";
import type { CryptoView } from "../../../../../types/cryptoOnline";
import { OperatorWordPanel, Scoreboard, TeamHud, TeamMembers } from "./shared";
import styles from "../onlineCrypto.module.css";

type Props = {
  view: CryptoView;
  emit: (event: string, payload?: unknown) => void;
};

export function OnlineInterceptionAction({ view, emit }: Props) {
  const currentTeam = view.teams[view.currentTeamIndex];
  const running = view.roundEndTime != null;
  const isController = view.controls.canControl;
  const [feedback, setFeedback] = useState<"none" | "success" | "skip">("none");
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flash = useCallback((type: "success" | "skip") => {
    setFeedback(type);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback("none"), 350);
  }, []);

  const progress = Math.min(
    (view.currentMatchIndex / Math.max(view.config.wordLimit, 1)) * 100,
    100,
  );

  const waitingWord = view.currentWordVisible ? view.currentWord : null;

  return (
    <div className={styles.container}>
      {/* PROGRESSO DA PARTIDA */}
      <div className={styles.matchProgress}>
        <span>
          PALAVRA {view.currentMatchIndex + 1} DE {view.config.wordLimit}
        </span>
        <div className={styles.progressBg}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }} />
        </div>
      </div>

      <TeamHud view={view} />

      {isController ? (
        /* ================= OPERADOR DA VEZ (OU HOST) ================= */
        <div className={styles.actionArea}>
          <OperatorWordPanel
            word={view.currentWord}
            timerRunning={running}
            feedback={feedback}
          />

          {!running ? (
            <div className={styles.actionRow}>
              <button
                className={styles.ghostBtn}
                onClick={() => emit("crypto:reroll-word", { roomCode: view.roomCode })}
              >
                🔄 TROCAR PALAVRA
              </button>
              <button
                className={styles.bigCyanBtn}
                onClick={() => emit("crypto:start-timer", { roomCode: view.roomCode })}
              >
                ⏱️ DICA DADA! INICIAR RESPOSTA
              </button>
            </div>
          ) : (
            <div className={styles.actionRow}>
              <button
                className={styles.dangerBtn}
                onClick={() => {
                  flash("skip");
                  emit("crypto:pass-turn", { roomCode: view.roomCode });
                }}
              >
                ❌ ERROU / PASSAR
              </button>
              <button
                className={styles.successBtn}
                onClick={() => {
                  flash("success");
                  emit("crypto:interception-result", {
                    roomCode: view.roomCode,
                    winnerTeamIndex: view.currentTeamIndex,
                  });
                }}
              >
                ✅ ACERTOU!
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ================= QUEM ESPERA ================= */
        <div className={styles.waitingPanel}>
          <span className={styles.waitingIcon}>⚠️</span>
          <h2>FIQUE ATENTO</h2>
          <p className={styles.waitingSub}>
            Grupo <strong style={{ color: currentTeam.color }}>{currentTeam.name}</strong>{" "}
            tenta interceptar a palavra
          </p>

          <div className={styles.wordPeek}>
            {waitingWord ? (
              <>
                <span className={styles.wordPeekLabel}>PALAVRA EM DISPUTA</span>
                <span className={styles.wordPeekValue}>{waitingWord}</span>
              </>
            ) : (
              <span className={styles.wordPeekHidden}>
                🔒 Só o operador da vez vê a palavra agora
              </span>
            )}
          </div>

          <TeamMembers team={currentTeam} />
          <Scoreboard teams={view.teams} />
        </div>
      )}
    </div>
  );
}
