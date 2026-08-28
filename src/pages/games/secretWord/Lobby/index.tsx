import { useState } from "react";
import { SecretWordLobby } from "./secreteWordLobby";
import { OnlineCryptoLobby } from "./OnlineCryptoLobby";
import styles from "./cryptoLobbyIndex.module.css";

export default function CriptographyLobby() {
  const [gameMode, setGameMode] = useState<"local" | "online">("local");

  return (
    <div className={styles["game-content"]}>
      {/* SELETOR LOCAL / ONLINE (padrão do Impostor) */}
      <div className={styles.toggleWrapper}>
        <div className={styles.segmentedControl}>
          <button
            className={`${styles.segBtn} ${gameMode === "local" ? styles.activeSeg : ""}`}
            onClick={() => setGameMode("local")}
          >
            🏠 Jogo Local
          </button>
          <button
            className={`${styles.segBtn} ${gameMode === "online" ? styles.activeSeg : ""}`}
            onClick={() => setGameMode("online")}
          >
            🌏 Jogo Online
          </button>
        </div>
      </div>

      {gameMode === "local" ? <SecretWordLobby /> : <OnlineCryptoLobby />}
    </div>
  );
}
