import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { RevealPhase } from "../components/revealPhase";
import { useSocket } from "../../../../contexts/socketContext";
import { DiscussPhase } from "../components/discussPhase";
import { VotingPhase } from "../components/votingPhase/VotingPhase";
import { ResultPhase } from "../components/resultPhase";
import { SpectatorView } from "./SpectatorView/SpectatorView";
import { NewHostModal } from "./NewHostAlert/NewHostModal";
import { useI18n } from "../../../../i18n";

export function OnlineImpostorGame() {
  const socket = useSocket();
  const { t } = useI18n();
  const location = useLocation();
  const [gameData, setGameData] = useState<any>(
    location.state?.data || location.state || null,
  );
  const [showNewHostAlert, setShowNewHostAlert] = useState(false);

  useEffect(() => {
    setGameData((prev: any) =>
      prev ? { ...prev, mySocketId: socket.id } : null,
    );
  }, [socket.id]);

  useEffect(() => {
    function onGameUpdate(data: any) {
      setGameData((prev: any) => {
        if (!data) return data;
        const isHostFromServer =
          typeof data.isHost === "boolean"
            ? data.isHost
            : data.hostId
              ? data.hostId === socket.id
              : false;

        return {
          ...data,
          isHost: isHostFromServer,
          mySocketId: prev?.mySocketId || socket.id,
        };
      });
    }

    function onPlayerLeft({ name, reason }: { name: string; reason: string }) {
      alert(`${name} ${t("alerts.impostor_leftGame", "left the game.")}`);
      console.log(`${name} left the game. Reason: ${reason}`);
    }

    function onForceLobby({ reason }: { reason: string }) {
      alert(t("alerts.impostor_closingRoom", "Not enough players. Returning to the lobby."));
      window.location.href = "/games/impostor/lobby";
      console.log(`Jogadores Insuficientes:${reason}`);
    }

    function onHostChanged({ newHostId }: { newHostId: string }) {
      const isNowHost = socket.id === newHostId;

      setGameData((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          isHost: isNowHost,
          mySocketId: prev.mySocketId || socket.id,
        };
      });

      // Mostra aviso se o jogador se tornou host
      if (isNowHost) {
        setShowNewHostAlert(true);
        setTimeout(() => setShowNewHostAlert(false), 10000); // desaparece após 10s
      }
    }

    socket.on("game-update", onGameUpdate);
    socket.on("player-left", onPlayerLeft);
    socket.on("force-lobby", onForceLobby);
    socket.on("host-changed", onHostChanged);

    return () => {
      socket.off("game-update", onGameUpdate);
      socket.off("player-left", onPlayerLeft);
      socket.off("force-lobby", onForceLobby);
      socket.off("host-changed", onHostChanged);
    };
  }, [socket]);

  // Aviso ao tentar sair/atualizar
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (gameData) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [gameData]);

  if (!gameData) return <div>{t("home.loading", "Loading the next round...")}</div>;

  // Card de aviso: novo host
  if (showNewHostAlert) {
    return <NewHostModal onConfirm={() => setShowNewHostAlert(false)} />;
  }

  // Espectador - apenas observa
  if (gameData.isSpectator) {
    return <SpectatorView gameData={gameData} />;
  }

  function handleExit() {
    // Você pode voltar pro lobby
    window.location.href = "/games/impostor/lobby";
  }

  function handleNextPhase(nextPhase: string) {
    // quando o RevealPhase chama onNextPhase("discussion")
    // o servidor deve trocar a fase e emitir game-update pra todo mundo
    socket.emit("next-phase", {
      roomCode: gameData.roomCode,
      phase: nextPhase,
    });
  }

  function handleReroll() {
    // Host só
    socket.emit("reroll-game", { roomCode: gameData.roomCode });
  }

  function handleToggleReady() {
    socket.emit("toggle-ready", { roomCode: gameData.roomCode });
  }

  function handleCastVote(votedId: string | null) {
    // Se a votação já terminou no servidor, o clique no botão (via onEliminate) confirma a ejetagem
    if (gameData.votingFinished) {
      socket.emit("confirm-elimination", { roomCode: gameData.roomCode });
    } else {
      // Caso contrário, é um voto normal
      socket.emit("cast-vote", {
        roomCode: gameData.roomCode,
        votedId: votedId,
      });
    }
  }

  function handleNextRound() {
    socket.emit("reroll-game", { roomCode: gameData.roomCode });
  }

  // FASES
  if (gameData.phase === "reveal") {
    return (
      <RevealPhase
        data={gameData}
        isOnline={true}
        onNextPhase={handleNextPhase}
        onExit={handleExit}
        onReroll={handleReroll}
        onToggleReadyOnline={handleToggleReady}
      />
    );
  }

  if (gameData.phase === "discussion") {
    return (
      <DiscussPhase
        data={gameData}
        isOnline={true}
        onNextPhase={handleNextPhase}
      />
    );
  }

  if (gameData.phase === "voting") {
    return (
      <VotingPhase
        data={gameData}
        onEliminate={handleCastVote}
        isOnline={true}
      />
    );
  }

  if (gameData.phase === "result") {
    return (
      <ResultPhase
        data={gameData}
        isOnline={true}
        onNextPhase={handleNextPhase}
        onNextRound={handleNextRound}
      />
    );
  }

  return <div>{t("games.impostor_invalidPhase", "Invalid game phase")}</div>;
}
