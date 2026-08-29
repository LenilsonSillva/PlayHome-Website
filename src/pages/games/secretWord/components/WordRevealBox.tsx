import { memo, useRef, useCallback } from "react";
import styles from "./revealBox.module.css";

type WordRevealBoxProps = {
  word: string | null;
  hasStarted: boolean;
  isRevealing: boolean;
  feedback: "none" | "success" | "skip" | "fail";
  onPointerDown: () => void;
  onPointerUp: () => void;
};

export const WordRevealBox = memo(
  ({
    word,
    hasStarted,
    isRevealing,
    feedback,
    onPointerDown,
    onPointerUp,
  }: WordRevealBoxProps) => {
    // Ref para evitar disparos duplos de eventos no iOS
    const lastTouchTime = useRef(0);

    const handlePress = useCallback(() => {
      const now = Date.now();
      if (now - lastTouchTime.current < 150) return; // Ignora toques com menos de 50ms (spam)
      lastTouchTime.current = now;

      if (!isRevealing) {
        onPointerDown();
      }
    }, [isRevealing, onPointerDown]);

    const handleRelease = useCallback(() => {
      if (isRevealing) {
        onPointerUp();
      }
    }, [isRevealing, onPointerUp]);

    return (
      <div
        className={`
        ${styles.wordDisplay} 
        ${isRevealing ? styles.active : ""} 
        ${!hasStarted ? styles.waiting : ""}
        ${feedback !== "none" ? styles[feedback + "Flash"] : ""}
      `}
        onPointerDown={handlePress}
        onPointerUp={handleRelease}
        onPointerLeave={handleRelease}
        onContextMenu={(e) => e.preventDefault()}
      >
        {!isRevealing ? (
          <div className={styles.hiddenContent}>
            <div className={styles.pressIcon}>{hasStarted ? "👆" : "📡"}</div>
            <p>{hasStarted ? "SEGURE PARA VER" : "TOQUE PARA INICIAR"}</p>
          </div>
        ) : (
          <div className={styles.revealedContent}>
            <span className={styles.label}>TRANSMISSÃO ATIVA:</span>
            <h1 className={styles.word}>{word}</h1>
          </div>
        )}
      </div>
    );
  },
);
