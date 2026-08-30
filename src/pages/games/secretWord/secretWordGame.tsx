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
import { useI18n } from "../../../i18n";

// Fase da partida (porta do fluxo do OfflineCryptographyGameScreen do RN)
const PHASE_LABEL_KEYS: Record<string, string> = {
  "team-reveal": "games.cryptography_phase_team_reveal",
  "infiltration-action": "games.cryptography_phase_infiltration_action",
  "interception-action": "games.cryptography_phase_interception_action",
  "round-result": "games.cryptography_phase_round_result",
};

export function SecretWordGame() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
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
    if (window.confirm(t("alerts.cryptography_leaveGameMessage", "Leave the match? The game will end."))) {
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
        return <div>{t("home.loading", "Loading...")}</div>;
    }
  };

  return (
    <div className={styles.mainContainer}>
      <div className={styles.ambientLight} />
      <div className={styles.contentWrapper}>
        {gameState && (
          <div className={styles.gameTopBar}>
            <button className={styles.exitBtn} onClick={handleExit}>
              ← {t("alerts.quit", "EXIT")}
            </button>
            <span className={styles.gameInfo}>
              {t("games.cryptography_result_round", "ROUND")} {gameState.roundNumber} ·{" "}
              {t(PHASE_LABEL_KEYS[gameState.phase] ?? "games.cryptography_phase_round_result", gameState.phase)}
            </span>
            <span className={styles.gameMode}>
              {gameState.config.mode === "infiltration"
                ? `⚡ ${t("games.cryptography_infiltration_action", "INFILTRATION")}`
                : `⚔️ ${t("games.cryptography_interception_action", "INTERCEPTION")}`}
            </span>
          </div>
        )}
        {renderPhase()}
      </div>
    </div>
  );
}
