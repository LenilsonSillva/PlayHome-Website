import { useCallback, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./index-secret.module.css";
import type { CryptoRouteState } from "./GameLogistic/types";
import { usePlayers } from "../../../contexts/contextHook";
import { useOfflineCryptography } from "./GameLogistic/useOfflineCryptography";
import { SecretTeamReveal } from "./SecretTeamReveal/SecretTeamReveal";
import { InfiltrationAction } from "./InfiltrationAction/InfiltrationAction";
import { InterceptionAction } from "./InterceptionAction/InterceptionAction";
import { ResultPhase } from "./ResultPhase/ResultPhase";
import resultSd from "./../../../assets/sounds/win.mp3";

// Fase da partida (porta do fluxo do OfflineCryptographyGameScreen do RN)
const PHASE_LABELS: Record<string, string> = {
  "team-reveal": "RECONHECIMENTO",
  "infiltration-action": "INFILTRAÇÃO",
  "interception-action": "INTERCEPTAÇÃO",
  "round-result": "RESULTADO",
};

export function SecretWordGame() {
  const location = useLocation();
  const navigate = useNavigate();
  const resultSound = useRef(new Audio(resultSd));

  const {
    gameState,
    startGame,
    setOperator,
    setStartingTeam,
    setRandomOperators,
    beginActionPhase,
    startTimer,
    handleInfiltrationWord,
    finishInfiltrationTurn,
    handleInterceptionResult,
    passInterceptionTurn,
    rerollWord,
    reassignWord,
    nextRound,
    persistWords,
    quitGame,
  } = useOfflineCryptography();

  const routeState = (location.state as CryptoRouteState | null) ?? null;
  const { players } = usePlayers();

  // Inicia o jogo apenas 1x, com os dados do lobby
  useEffect(() => {
    if (!routeState?.config) {
      navigate("/games/secretWord/lobby");
      return;
    }

    if (!gameState && players.length > 0) {
      startGame(
        players,
        routeState.config,
        routeState.manualAssignments,
        routeState.globalUsedWords,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players.length]);

  // Aviso ao sair/atualizar (proteção contra saída acidental — RN)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (gameState) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [gameState]);

  // Salva as palavras usadas ao sair da tela (paridade com o RN)
  const persistRef = useRef(persistWords);
  persistRef.current = persistWords;
  useEffect(() => {
    return () => {
      if (gameState?.usedWords && gameState.usedWords.length > 0) {
        persistRef.current();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playSound = useCallback((audioRef: React.RefObject<HTMLAudioElement>) => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  }, []);

  const handleExit = useCallback(() => {
    if (window.confirm("Sair da partida? O jogo será encerrado.")) {
      quitGame();
      navigate("/games/secretWord/lobby");
    }
  }, [quitGame, navigate]);

  // Som de vitória na tela de resultado
  useEffect(() => {
    if (gameState?.phase === "round-result") {
      playSound(resultSound);
    }
  }, [gameState?.phase, playSound]);

  const renderPhase = () => {
    if (!gameState) return null;

    switch (gameState.phase) {
      case "team-reveal":
        return (
          <SecretTeamReveal
            data={gameState}
            onSelectOperator={setOperator}
            onSetStartingTeam={setStartingTeam}
            onRandomizeOperators={setRandomOperators}
            onConfirm={beginActionPhase}
            onEdit={handleExit}
          />
        );

      case "infiltration-action":
        return (
          <InfiltrationAction
            data={gameState}
            onAction={(type) =>
              handleInfiltrationWord(type === "correct")
            }
            onTimeUp={finishInfiltrationTurn}
            onStartTimer={startTimer}
          />
        );

      case "interception-action":
        return (
          <InterceptionAction
            data={gameState}
            onFinishMatch={handleInterceptionResult}
            onPassTurn={passInterceptionTurn}
            onStartTimer={startTimer}
            onReroll={rerollWord}
          />
        );

      case "round-result":
        return (
          <ResultPhase
            data={gameState}
            onNextRound={nextRound}
            onReassign={reassignWord}
          />
        );

      default:
        return <div>Carregando sistemas...</div>;
    }
  };

  return (
    <div className={styles.mainContainer}>
      <div className={styles.ambientLight} />
      <div className={styles.contentWrapper}>
        {gameState && (
          <div className={styles.gameTopBar}>
            <button className={styles.exitBtn} onClick={handleExit}>
              ← SAIR
            </button>
            <span className={styles.gameInfo}>
              RODADA {gameState.roundNumber} ·{" "}
              {PHASE_LABELS[gameState.phase] ?? gameState.phase}
            </span>
            <span className={styles.gameMode}>
              {gameState.config.mode === "infiltration"
                ? "⚡ INFILTRAÇÃO"
                : "⚔️ INTERCEPTAÇÃO"}
            </span>
          </div>
        )}
        {renderPhase()}
      </div>
    </div>
  );
}
