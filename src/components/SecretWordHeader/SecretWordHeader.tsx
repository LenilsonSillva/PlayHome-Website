import styles from "./secretWordHeader.module.css";
import "../../../src/styles/theme.css";
import { useNavigate } from "react-router-dom";
import type { CryptoMode } from "../../pages/games/secretWord/GameLogistic/types";

type ChildProps = {
  mode: (value: CryptoMode) => void;
  currentMode: string | null;
};

export function SecretWordHeader({ mode, currentMode }: ChildProps) {
  const navigate = useNavigate();
  return (
    <div className={styles.wrapper}>
      {/* Luz ambiente azul para combinar com o tema Tech/Ciano do jogo */}
      <div className={styles.ambientLight} />

      <header className={styles.topHeader}>
        <a className={styles.logoLink} onClick={() => navigate("/")}>
          <h1 className={styles.mainTitle}>
            PLAY<span>HOME</span>
          </h1>
        </a>
        <div className={styles.systemBadge}>PROTOCOLO CRIPTOGRAFIA</div>
      </header>

      <div className={styles.gameSection}>
        <h1 className={styles.gameTitle}>
          CRIPTOGRAFIA<span className={styles.shhEmoji}>🔑</span>
        </h1>

        <p className={styles.instruction}>SELECIONE O MODO DE OPERAÇÃO</p>

        <div className={styles.modeSelector}>
          <button
            className={`${styles.modeBtn} ${currentMode === "infiltration" ? styles.active : ""}`}
            onClick={() => mode("infiltration")}
          >
            <span className={styles.btnIcon}>⚡</span>
            <span className={styles.btnText}>Infiltração</span>
          </button>

          <button
            className={`${styles.modeBtn} ${currentMode === "interception" ? styles.active : ""}`}
            onClick={() => mode("interception")}
          >
            <span className={styles.btnIcon}>⚔️</span>
            <span className={styles.btnText}>INTERCEPTAÇÃO</span>
          </button>

          {/* O slider aqui usa a cor Ciano/Azul por padrão do jogo */}
          <div
            className={`${styles.slider} ${currentMode === "interception" ? styles.slideRight : ""}`}
          />
        </div>
      </div>
    </div>
  );
}
