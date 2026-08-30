import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SecretWordLobby } from "./secreteWordLobby";
import { OnlineCryptoLobby } from "./OnlineCryptoLobby";
import { SecretWordHeader } from "../../../../components/SecretWordHeader/SecretWordHeader";
import type { CryptoMode } from "../GameLogistic/types";
import styles from "./cryptoLobbyIndex.module.css";

type ConnectionMode = "local" | "online";

export default function CriptographyLobby() {
  const [searchParams] = useSearchParams();
  const [gameMode, setGameMode] = useState<ConnectionMode>(() =>
    searchParams.get("mode") === "online" ? "online" : "local",
  );
  const [cryptoMode, setCryptoMode] = useState<CryptoMode>("infiltration");

  return (
    <div className={styles.gameContent}>
      <SecretWordHeader
        mode={setCryptoMode}
        currentMode={cryptoMode}
        connectionMode={gameMode}
        onConnectionMode={setGameMode}
      />
      <div className={styles.lobbyStage}>
        {gameMode === "local" ? (
          <SecretWordLobby mode={cryptoMode} />
        ) : (
          <OnlineCryptoLobby mode={cryptoMode} onModeChange={setCryptoMode} />
        )}
      </div>
    </div>
  );
}
