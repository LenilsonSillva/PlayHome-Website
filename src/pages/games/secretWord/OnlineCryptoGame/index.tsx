import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSocket } from "../../../../contexts/socketContext";
import type { CryptoView } from "../../../../types/cryptoOnline";
import { OnlineTeamReveal } from "./components/OnlineTeamReveal";
import { OnlineInfiltrationAction } from "./components/OnlineInfiltrationAction";
import { OnlineInterceptionAction } from "./components/OnlineInterceptionAction";
import { OnlineRoundResult } from "./components/OnlineRoundResult";
import styles from "./onlineCrypto.module.css";

export function OnlineCryptoGame() {
  const socket = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  const rawState = (location.state as { data?: CryptoView } | null) ?? null;
  const [view, setView] = useState<CryptoView | null>(rawState?.data ?? null);

  // ---------------- ações (com alerta de erro do servidor) ----------------
  const emit = useCallback(
    (event: string, payload?: unknown) => {
      socket.emit(event, payload ?? {}, (res: { error?: string } | undefined) => {
        if (res?.error) alert(res.error);
      });
    },
    [socket],
  );

  // ---------------- eventos da partida ----------------
  useEffect(() => {
    function onGameUpdate(data: CryptoView) {
      setView(data);
    }

    function onPlayerLeft({ name, reason }: { name: string; reason: string }) {
      alert(reason === "kicked" ? `${name} foi removido da sala` : `${name} saiu do jogo`);
    }

    function onHostChanged({ newHostId }: { newHostId: string }) {
      if (newHostId === socket.id) {
        alert("O host saiu. Você agora é o novo HOST!");
      }
    }

    socket.on("crypto:game-update", onGameUpdate);
    socket.on("crypto:player-left", onPlayerLeft);
    socket.on("crypto:host-changed", onHostChanged);

    return () => {
      socket.off("crypto:game-update", onGameUpdate);
      socket.off("crypto:player-left", onPlayerLeft);
      socket.off("crypto:host-changed", onHostChanged);
    };
  }, [socket]);

  // ---------------- aviso ao sair/atualizar ----------------
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (view) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [view]);

  // ---------------- sair da partida ----------------
  const handleExit = () => {
    if (view && window.confirm("Sair da partida?")) {
      socket.emit("crypto:leave-room", { roomCode: view.roomCode });
      navigate("/games/secretWord/lobby");
    }
  };

  if (!view) {
    return (
      <div className={styles.container}>
        <p className={styles.waitingNote}>Carregando partida...</p>
      </div>
    );
  }

  const roomHeader = (
    <div className={styles.gameTopBar}>
      <button className={styles.exitBtn} onClick={handleExit}>
        ← SAIR
      </button>
      <span className={styles.gameRoomCode}>
        SALA {view.roomCode} · RODADA {view.roundNumber}
      </span>
      <span className={styles.gameRole}>
        {view.isHost ? "👑 HOST" : view.myRole === "operator" ? "📡 OPERADOR" : view.isSpectator ? "👀 ESPECTADOR" : "👤 JOGADOR"}
      </span>
    </div>
  );

  return (
    <div className={styles.gameShell}>
      {roomHeader}

      {view.phase === "team-reveal" && (
        <OnlineTeamReveal
          view={view}
          onSelectOperator={(teamId, playerId) =>
            emit("crypto:set-operator", { roomCode: view.roomCode, teamId, playerId })
          }
          onRandomizeOperators={() => emit("crypto:set-random-operators", { roomCode: view.roomCode })}
          onSetStartingTeam={(teamIndex) =>
            emit("crypto:set-starting-team", { roomCode: view.roomCode, teamIndex })
          }
          onBeginAction={() => emit("crypto:begin-action", { roomCode: view.roomCode })}
        />
      )}

      {view.phase === "infiltration-action" && <OnlineInfiltrationAction view={view} emit={emit} />}

      {view.phase === "interception-action" && <OnlineInterceptionAction view={view} emit={emit} />}

      {view.phase === "round-result" && <OnlineRoundResult view={view} emit={emit} />}
    </div>
  );
}
