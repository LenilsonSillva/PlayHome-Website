import { useNavigate } from "react-router-dom";
import { useSocket } from "../../../../../contexts/socketContext";
import type {
  GameRouteState,
  ImpostorGameState,
} from "../../GameLogistic/types";
import { PlayerAvatar } from "../../../../../components/PlayerAvatar/PlayerAvatar";
import "./resultPhase.css";
import winSd from "./../../../../../assets/sounds/win.mp3";
import loseSd from "./../../../../../assets/sounds/end.wav";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "../../../../../i18n";

type ResultPhaseProps = {
  data: GameRouteState["data"];
  onNextPhase: (phase: ImpostorGameState["phase"]) => void;
  onNextRound?: () => void;
  isOnline?: boolean;
};

export function ResultPhase({
  data,
  onNextPhase,
  onNextRound,
  isOnline,
}: ResultPhaseProps) {
  const navigate = useNavigate();
  // The provider is mounted for both local and online games; keeping this hook
  // unconditional preserves the Rules of Hooks while local games simply do not emit events.
  const connectedSocket = useSocket();
  const socket = isOnline ? connectedSocket : null;
  const { t } = useI18n();

  const alivePlayers = data.players.filter((p) => p.isAlive);
  const aliveImpostors = alivePlayers.filter((p) => p.isImpostor).length;
  const aliveCrew = alivePlayers.length - aliveImpostors;
  const crewWon = aliveImpostors === 0;
  const impostorsWon = aliveImpostors >= aliveCrew && aliveImpostors > 0;
  const gameOver = crewWon || impostorsWon;

  const [, setFeedback] = useState<"none" | "win" | "lose">("none");
  const winSound = useRef(new Audio(winSd));
  const loseSound = useRef(new Audio(loseSd));

  const playSound = (audioRef: React.RefObject<HTMLAudioElement>) => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
    setTimeout(() => setFeedback("none"), 300);
  };

  const triggerFeedback = (type: "win" | "lose") => {
    if (type === "win") {
      playSound(winSound);
      if ("vibrate" in navigator) navigator.vibrate(200);
    } else {
      playSound(loseSound);
      if ("vibrate" in navigator) navigator.vibrate([100, 50, 100]);
    }
    setTimeout(() => setFeedback("none"), 100);
  };

  useEffect(() => {
    triggerFeedback(crewWon ? "win" : "lose");
  }, [crewWon]);

  const getRoundPoints = (p: any) => {
    if (p.isImpostor) return p.isAlive ? 2 : -1.5;
    return p.isAlive ? 1 : 0;
  };

  const playersWithTotalScore = data.players
    .map((p) => ({
      ...p,
      roundPoints: getRoundPoints(p),
      totalScore: isOnline
        ? (p.globalScore ?? 0)
        : (p.score || 0) + getRoundPoints(p),
    }))
    .sort((a, b) => b.totalScore - a.totalScore);

  const podium = playersWithTotalScore.slice(0, 3);
  const others = playersWithTotalScore.slice(3);

  const leaveOnlineGame = () => {
    if (isOnline && socket) {
      socket.emit(
        "leave-room",
        { roomCode: data.roomCode },
        () => {
          socket.off("room-updated");
          socket.off("game-update");
          socket.off("player-left");
          socket.off("host-changed");
          socket.off("force-lobby");
          setTimeout(() => navigate("/games/impostor/lobby"), 100);
        },
      );
    } else {
      navigate("/games/impostor/lobby");
    }
  };

  return (
    <div className="main-bg result-screen">
      <div className="glass-panel result-container">
        {gameOver ? (
          <div
            className={`victory-banner ${crewWon ? "crew-bg" : "impostor-bg"}`}
          >
            <h1 className="victory-title">
              {crewWon
                ? t("games.impostor_result_crewVictory", "PLAYERS WIN")
                : t("games.impostor_result_impostorVictory", "IMPOSTORS WIN")}
            </h1>
            <p className="victory-subtitle">
              {crewWon
                ? t(
                    "games.impostor_result_crewSubtitle",
                    "All impostors have been eliminated.",
                  )
                : `${t(
                    "games.impostor_result_impostorSubtitle",
                    "The impostors outnumber the players.",
                  )} ${aliveCrew} ${t(
                    "games.impostor_result_crewRemaining",
                    "players remain",
                  )}.`}
            </p>
            {isOnline && data.roomCode && (
              <div
                style={{
                  marginTop: "12px",
                  fontSize: "13px",
                  fontFamily: "monospace",
                  color: "rgba(255, 255, 255, 0.7)",
                }}
              >
                {t("site.roomCode", "ROOM")}: <strong>{data.roomCode}</strong>
              </div>
            )}
          </div>
        ) : (
          <div className="round-report-header">
            <h2 className="tech-title">
              {t("games.impostor_result_statusTitle", "MISSION STATUS")}
            </h2>
            <p className="status-text">
              {t("games.impostor_result_missionContinues", "The mission continues.")} {" "}
              {t("games.impostor_result_crewCount", "Players")}: {aliveCrew} | {" "}
              {t("games.impostor_result_impostorCount", "Impostors")}: {aliveImpostors}
            </p>
          </div>
        )}

        <div className="podium-section">
          <h3 className="section-label">
            {t("games.impostor_result_missionLeaders", "MISSION LEADERS")}
          </h3>
          <div className="podium-grid">
            {podium.map((p, index) => (
              <div key={p.id} className={`podium-item rank-${index + 1}`}>
                <div className="rank-badge">{index + 1}</div>
                <PlayerAvatar
                  emoji={(p as any).emoji}
                  color={p.color}
                  size={index === 0 ? 85 : 65}
                />
                <span className="p-name">{p.name}</span>
                <span className="p-score">
                  {p.totalScore} {t("games.impostor_result_points", "pts")}
                </span>
                {p.isImpostor && (
                  <span className="p-role">
                    {t("games.impostor_result_impostorTitle", "IMPOSTOR")}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {others.length > 0 && (
          <div className="others-section">
            <h3 className="section-label">
              {t("games.impostor_result_additionalRecords", "ADDITIONAL RECORDS")}
            </h3>
            <div className="others-list">
              {others.map((p) => (
                <div key={p.id} className="other-item">
                  <span className="other-emoji">{(p as any).emoji}</span>
                  <span className="other-name">{p.name}</span>
                  <div className="other-info-main">
                    {p.isImpostor && (
                      <span className="p-role-small">
                        {t("games.impostor_result_impostorTitle", "IMPOSTOR")}
                      </span>
                    )}
                  </div>
                  <div className="other-stats">
                    <span
                      className="round-pts"
                      style={{
                        color:
                          p.roundPoints > 0
                            ? "var(--success)"
                            : "var(--danger-neon)",
                      }}
                    >
                      {p.roundPoints > 0 ? `+${p.roundPoints}` : p.roundPoints}
                    </span>
                    <span className="total-pts">
                      {p.totalScore} {t("games.impostor_result_points", "pts")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="result-actions">
          {gameOver ? (
            !isOnline || (isOnline && data.isHost) ? (
              <>
                <button className="primary-btn pulse" onClick={onNextRound}>
                  {t("games.impostor_result_nextMission", "NEXT ROUND")}
                </button>
                <button className="secondary-btn" onClick={leaveOnlineGame}>
                  {t("games.impostor_result_leaveGame", "LEAVE GAME")}
                </button>
              </>
            ) : (
              <>
                <button className="primary-btn pulse" disabled>
                  {t("games.impostor_result_waitHost", "Wait for the host...")}
                </button>
                <button className="secondary-btn" onClick={leaveOnlineGame}>
                  {t("games.impostor_result_leaveGame", "LEAVE GAME")}
                </button>
              </>
            )
          ) : (
            <button
              className="primary-btn"
              onClick={() => onNextPhase("discussion")}
            >
              {t("games.impostor_result_continueDiscussion", "RETURN TO DISCUSSION")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
