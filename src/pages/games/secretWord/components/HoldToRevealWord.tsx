import { memo, useCallback, useRef, useState } from "react";
import styles from "./holdReveal.module.css";
import { useI18n } from "../../../../i18n";

type HoldToRevealWordProps = {
  /** null quando as regras da partida escondem a palavra deste jogador */
  word: string | null;
  /** Texto exibido quando não há palavra para revelar */
  hiddenText: string;
  /** Rótulo acima da palavra enquanto o usuário segura */
  revealedLabel: string;
};

// 🔒 A palavra SÓ é exibida enquanto o usuário estiver pressionando
// a caixa (mesma segurança do WordRevealBox do operador). Assim a
// palavra não "vaza" se o aparelho for virado para os outros
// jogadores. Soltar o dedo (ou sair da caixa) volta a ocultar.
export const HoldToRevealWord = memo(
  ({ word, hiddenText, revealedLabel }: HoldToRevealWordProps) => {
    const { t } = useI18n();
    const [isRevealing, setIsRevealing] = useState(false);
    // Ref para evitar disparos duplos de eventos no iOS
    const lastTouchTime = useRef(0);

    const handleDown = useCallback(() => {
      if (!word) return;
      const now = Date.now();
      if (now - lastTouchTime.current < 150) return; // ignora toques em spam
      lastTouchTime.current = now;
      setIsRevealing(true);
    }, [word]);

    const handleUp = useCallback(() => setIsRevealing(false), []);

    return (
      <div
        className={`${styles.holdBox} ${word ? "" : styles.noWord} ${isRevealing ? styles.active : ""}`}
        onPointerDown={handleDown}
        onPointerUp={handleUp}
        onPointerLeave={handleUp}
        onContextMenu={(e) => e.preventDefault()}
        role={word ? "button" : undefined}
        tabIndex={word ? 0 : undefined}
        aria-pressed={word ? isRevealing : undefined}
        aria-label={word ? t("games.cryptography_action_holdToView", "HOLD TO SEE") : hiddenText}
        onKeyDown={(e) => {
          if (word && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            setIsRevealing(true);
          }
        }}
        onKeyUp={(e) => {
          if (e.key === "Enter" || e.key === " ") setIsRevealing(false);
        }}
      >
        {word ? (
          isRevealing ? (
            <div className={styles.revealed}>
              <span className={styles.label}>{revealedLabel}</span>
              <h2 className={styles.word}>{word}</h2>
            </div>
          ) : (
            <div className={styles.locked}>
              <span className={styles.lockIcon}>👆</span>
              <span className={styles.lockText}>
                {t("games.cryptography_action_holdToView", "HOLD TO SEE")}
              </span>
            </div>
          )
        ) : (
          <span className={styles.hidden}>🔒 {hiddenText}</span>
        )}
      </div>
    );
  },
);
