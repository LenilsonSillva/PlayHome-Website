import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { OfflineImpostorLobby } from "./OfflineImpostorLobby";
import { OnlineImpostorLobby } from "./OnlineImpostorLobby";
import { ImpostorHeader } from "../../../../components/ImpostorHeader/ImpostorHeader";
import styles from "./index-Lobby.module.css";

type ConnectionMode = "local" | "online";

export default function LobbyImportor() {
  const [searchParams] = useSearchParams();
  const [gameMode, setGameMode] = useState<ConnectionMode>(() =>
    searchParams.get("mode") === "online" ? "online" : "local",
  );

  return (
    <div className={styles.gameContent}>
      <ImpostorHeader mode={setGameMode} currentMode={gameMode} />
      <div className={styles.lobbyStage}>
        {gameMode === "local" ? <OfflineImpostorLobby /> : <OnlineImpostorLobby />}
      </div>
    </div>
  );
}
