import { useLocation, useNavigate } from "react-router-dom";
import { RevealPhase } from "../components/revealPhase";
import { DiscussPhase } from "../components/discussPhase";
import type {
  GameRouteState,
  ImpostorGameState,
  ImpostorPlayer,
} from "../GameLogistic/types";
import { VotingPhase } from "../components/votingPhase/VotingPhase";
import { EliminationPhase } from "../components/votingPhase/EliminationPhase";
import { useState, useRef, useEffect } from "react";
import { ResultPhase } from "../components/resultPhase";
import { initializeGame } from "../GameLogistic/gameLogistic";
import { usePlayers } from "../../../../contexts/contextHook";
import { getWordDatabase } from "../../../../data/words";
import { useI18n } from "../../../../i18n";

export function OfflineImpostorGame() {
  const location = useLocation();
  const navigate = useNavigate();
  const { players: playersFromContext } = usePlayers();
  const { t } = useI18n();

  // 1. Captura o estado e inicializa o gameState
  const Initialstate = location.state as GameRouteState | null;
  const [gameState, setGameState] = useState<GameRouteState | null>(
    Initialstate,
  );

  const impostorHistoryRef = useRef<string[][]>([]);
  const wordHistoryRef = useRef<string[]>([]);

  // --- 2. REDIRECIONAMENTO IMEDIATO ---
  // Se não houver estado inicial, redirecionamos para o lobby/home
  useEffect(() => {
    if (
      !Initialstate ||
      !playersFromContext ||
      playersFromContext.length === 0
    ) {
      navigate("/games/impostor/lobby", { replace: true });
    }
  }, [Initialstate, playersFromContext, navigate]);

  // --- 3. ALERTA DE SAÍDA (BOTÃO VOLTAR E ATUALIZAR) ---
  useEffect(() => {
    // Adiciona trava no histórico para o botão voltar
    window.history.pushState(null, "", window.location.pathname);

    const handlePopState = () => {
      if (
        window.confirm(
          t("alerts.impostor_reallyLeave", "The match is in progress. Do you really want to leave?"),
        )
      ) {
        navigate("/games/impostor/lobby", { replace: true });
      } else {
        // Empurra de volta para manter o usuário na página
        window.history.pushState(null, "", window.location.pathname);
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [navigate]);

  // --- 4. PROTEÇÃO CRÍTICA (EARLY RETURN) ---
  // Esta parte DEVE vir antes de qualquer lógica que use 'Initialstate' ou 'gameState'
  if (!Initialstate || !gameState) {
    return (
      <div style={{ background: "var(--gray-900)", minHeight: "100vh" }} />
    );
  }

  // --- 5. INICIALIZAÇÃO DE HISTÓRICO (AGORA É SEGURO) ---
  if (impostorHistoryRef.current.length === 0) {
    const firstRoundImpostors = Initialstate.data.players
      .filter((p) => p.isImpostor)
      .map((p) => p.id);
    impostorHistoryRef.current = [firstRoundImpostors];
  }

  if (wordHistoryRef.current.length === 0) {
    const firstWord = Initialstate.data.players.find(
      (p) => !p.isImpostor,
    )?.word;
    if (firstWord) wordHistoryRef.current = [firstWord];
  }

  // --- FUNÇÕES DE LÓGICA ---
  function handleNextRound() {
    if (!gameState) return;
    const {
      players,
      howManyImpostors,
      twoWordsMode,
      impostorHint,
      selectedCategories,
      whoStart,
      impostorCanStart,
      impostorTrap,
      impostorCat,
      impostorsUnited,
    } = gameState.data;

    const roundScores: Record<string, number> = {};
    players.forEach((p) => {
      roundScores[p.id] = p.isImpostor
        ? p.isAlive
          ? 2
          : -1.5
        : p.isAlive
          ? 1
          : 0;
    });

    const playersForNewGame = players.map((p) => ({
      id: p.id,
      name: p.name,
      score: p.score,
      globalScore: p.globalScore,
      emoji: p.emoji,
      color: p.color,
    }));

    const newGame = initializeGame(
      playersForNewGame as any,
      howManyImpostors,
      twoWordsMode,
      impostorHint,
      selectedCategories,
      Boolean(whoStart),
      impostorCanStart,
      impostorTrap,
      impostorCat,
      impostorsUnited,
      impostorHistoryRef.current,
      wordHistoryRef.current,
      getWordDatabase(gameState.data.language ?? "pt"),
    );

    const wordsUsedThisRound = newGame.allPlayers
      .map((p) => p.word)
      .filter((w): w is string => w !== null);
    wordHistoryRef.current = [
      ...wordHistoryRef.current,
      ...Array.from(new Set(wordsUsedThisRound)),
    ];
    impostorHistoryRef.current = [
      ...impostorHistoryRef.current,
      newGame.allPlayers.filter((p) => p.isImpostor).map((p) => p.id),
    ];

    const updatedPlayers: ImpostorPlayer[] = newGame.allPlayers.map((newP) => {
      const oldP = players.find((p) => p.id === newP.id);
      return {
        ...newP,
        score: (oldP?.score ?? 0) + (roundScores[newP.id] ?? 0),
        globalScore: (oldP?.score ?? 0) + (roundScores[newP.id] ?? 0),
        emoji: oldP?.emoji ?? newP.emoji,
        color: oldP?.color ?? newP.color,
      };
    });

    setGameState({
      data: {
        players: updatedPlayers,
        howManyImpostors: newGame.howManyImpostors,
        impostorCanStart: newGame.impostorCanStart,
        impostorHint: newGame.impostorHasHint,
        impostorTrap: newGame.impostorTrap,
        impostorCat: newGame.impostorCat,
        impostorsUnited: newGame.impostorsUnited,
        selectedCategories: newGame.selectedCategories,
        twoWordsMode: newGame.twoWordsMode,
        whoStart: newGame.whoStart ?? undefined,
        phase: "reveal",
        language: gameState.data.language,
      },
    });
  }

  function handlePlayerElimination(eliminatedId: string | null) {
    if (!gameState) return;
    const updatedPlayers = gameState.data.players.map((p) =>
      p.id === eliminatedId ? { ...p, isAlive: false } : p,
    );

    const alive = updatedPlayers.filter((p) => p.isAlive);
    const impostorsAlive = alive.filter((p) => p.isImpostor).length;
    const crewAlive = alive.length - impostorsAlive;
    const isGameOver =
      impostorsAlive === 0 ||
      (impostorsAlive >= crewAlive && impostorsAlive > 0);

    setGameState((prev) => ({
      ...prev!,
      data: {
        ...prev!.data,
        players: updatedPlayers,
        phase: isGameOver ? "result" : "discussion",
      },
    }));
  }

  function changePhase(phase: ImpostorGameState["phase"]) {
    setGameState((prev) =>
      prev ? { ...prev, data: { ...prev.data, phase } } : null,
    );
  }

  function handleReroll() {
    if (!gameState) return;
    const {
      players,
      howManyImpostors,
      twoWordsMode,
      impostorHint,
      selectedCategories,
      whoStart,
      impostorCanStart,
      impostorTrap,
      impostorCat,
      impostorsUnited,
      language,
    } = gameState.data;
    const newGame = initializeGame(
      players as any,
      howManyImpostors,
      twoWordsMode,
      impostorHint,
      selectedCategories,
      Boolean(whoStart),
      impostorCanStart,
      impostorTrap,
      impostorCat,
      impostorsUnited,
      impostorHistoryRef.current,
      wordHistoryRef.current,
      getWordDatabase(language ?? "pt"),
    );
    const wordsUsedThisRound = newGame.allPlayers
      .map((p) => p.word)
      .filter((w): w is string => w !== null);
    wordHistoryRef.current = [
      ...wordHistoryRef.current,
      ...Array.from(new Set(wordsUsedThisRound)),
    ];
    setGameState((prevState) => ({
      ...prevState!,
      data: {
        ...prevState!.data,
        players: newGame.allPlayers,
        whoStart: newGame.whoStart ?? undefined,
        phase: "reveal",
      },
    }));
  }

  function goBackLobby() {
    if (window.confirm(t("alerts.impostor_leaveRoomTitle", "Leave the match and return to the lobby?"))) {
      navigate("/games/impostor/lobby");
    }
  }

  // --- RENDERIZAÇÃO DAS FASES ---
  switch (gameState.data.phase) {
    case "reveal":
      return (
        <RevealPhase
          data={gameState.data}
          onNextPhase={changePhase}
          onExit={goBackLobby}
          isOnline={false}
          onReroll={handleReroll}
        />
      );
    case "discussion":
      return <DiscussPhase data={gameState.data} onNextPhase={changePhase} />;
    case "voting":
      return (
        <VotingPhase
          data={gameState.data}
          onEliminate={handlePlayerElimination}
          isOnline={false}
        />
      );
    case "elimination":
      return (
        <EliminationPhase
          data={gameState.data}
          onEliminate={handlePlayerElimination}
        />
      );
    case "result":
      return (
        <ResultPhase
          data={gameState.data}
          onNextPhase={changePhase}
          onNextRound={handleNextRound}
        />
      );
    default:
      return null;
  }
}
