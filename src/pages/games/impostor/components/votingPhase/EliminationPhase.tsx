import { useRef, useState } from "react";
import type { GameRouteState } from "../../GameLogistic/types";
import "./eliminationPhase.css";
import { PlayerAvatar } from "../../../../../components/PlayerAvatar/PlayerAvatar";
import impostorSd from "./../../../../../assets/sounds/impostor.mp3";
import { useI18n } from "../../../../../i18n";

type EliminationProps = {
  data: GameRouteState["data"];
  onEliminate: (id: string | null) => void;
};

export function EliminationPhase({ data, onEliminate }: EliminationProps) {
  const { t } = useI18n();
  const alivePlayers = data.players.filter((p) => p.isAlive);
  const [eliminatedId, setEliminatedId] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [, setFeedback] = useState<"none" | "isImpostor">("none");
  const impostorSound = useRef(new Audio(impostorSd));

  const playSound = (audioRef: React.RefObject<HTMLAudioElement>) => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
    setTimeout(() => setFeedback("none"), 300);
  };

  const triggerFeedback = (type: "isImpostor") => {
    if (type === "isImpostor") {
      playSound(impostorSound);
      if ("vibrate" in navigator) navigator.vibrate(200);
      setTimeout(() => setFeedback("none"), 10);
    }
  };

  function handleEliminate(id: string | null) {
    setEliminatedId(id);
    setConfirmed(true);
  }

  function handleAdvance() {
    if (eliminatedId) {
      const idx = data.players.findIndex((p) => p.id === eliminatedId);
      if (idx !== -1) data.players[idx].isAlive = false;
    }
    onEliminate(eliminatedId);
  }

  if (confirmed) {
    const eliminatedPlayer = alivePlayers.find((p) => p.id === eliminatedId);
    if (eliminatedPlayer?.isImpostor) triggerFeedback("isImpostor");

    const playerRole = [
      t("games.impostor_eliminated_function1", "Warp Engineer"),
      t("games.impostor_eliminated_function2", "Biological Researcher"),
      t("games.impostor_eliminated_function3", "Star Pilot"),
      t("games.impostor_eliminated_function4", "O2 Technician"),
      t("games.impostor_eliminated_function5", "Data Scientist"),
    ][(eliminatedPlayer?.name.length || 0) % 5];
    const serialNumber = `SN-${eliminatedId?.slice(0, 4).toUpperCase() || "NULL"}`;

    return (
      <div className="main-bg elimination-screen">
        <div className="glass-panel host-panel confirmation-view">
          <h2 className="tech-title">
            {t("games.impostor_elimination_protocolTitle", "ELIMINATION SYSTEM")}
          </h2>

          {eliminatedPlayer ? (
            <div className="id-card">
              <div
                className="id-card-header"
                style={{ backgroundColor: eliminatedPlayer.color }}
              >
                <span>{t("games.impostor_eliminated_status", "SECURITY RECORD")}</span>
                <span>{serialNumber}</span>
              </div>

              <div className="id-card-body">
                <div className="id-avatar-wrapper">
                  <PlayerAvatar
                    emoji={(eliminatedPlayer as any).emoji}
                    color={eliminatedPlayer.color}
                    size={80}
                  />
                </div>

                <div className="id-info">
                  <div className="info-group">
                    <label>{t("games.impostor_eliminated_name", "NAME")}</label>
                    <p className="info-value">
                      {eliminatedPlayer.name.toUpperCase()}
                    </p>
                  </div>

                  <div className="info-row">
                    <div className="info-group">
                      <label>{t("games.impostor_eliminated_function", "ROLE")}</label>
                      {eliminatedPlayer.isImpostor ? (
                        <p
                          style={{ color: "var(--danger-neon)" }}
                          className="info-value"
                        >
                          {t("games.impostor_eliminated_impostor", "IMPOSTOR")}
                        </p>
                      ) : (
                        <p className="info-value">{playerRole}</p>
                      )}
                    </div>
                    <div className="info-group">
                      <label>{t("games.impostor_eliminated_status", "STATUS")}</label>
                      <p
                        className="info-value"
                        style={{ color: "var(--danger-neon)" }}
                      >
                        {t("games.impostor_eliminated_terminated", "ELIMINATED")}
                      </p>
                    </div>
                  </div>

                  <div className="info-group">
                    <label>{t("games.impostor_eliminated_date", "RECORD DATE")}</label>
                    <p className="info-value">
                      {new Date().toLocaleDateString()} |{" "}
                      {new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="id-stamp">
                {t("games.impostor_eliminated_eliminated", "ELIMINATED")}
              </div>
            </div>
          ) : (
            <div className="neutral-card">
              <h3 className="no-elimination">
                {t("games.impostor_eliminated_tie", "TIE DETECTED")}
              </h3>
              <p>
                {t(
                  "games.impostor_eliminated_tieText",
                  "No player was ejected. The vote did not reach a majority.",
                )}
              </p>
            </div>
          )}

          <button className="primary-btn pulse" onClick={handleAdvance}>
            {t("games.impostor_eliminated_returnBtn", "CONTINUE MISSION")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="main-bg elimination-screen">
      <div className="glass-panel host-panel">
        <div className="host-header">
          <div className="host-icon">🛠️</div>
          <div>
            <h2 className="tech-title">
              {t("games.impostor_elimination_title", "HOST CONTROL")}
            </h2>
            <p className="instruction">
              {t(
                "games.impostor_elimination_subtitleLong",
                "Select the player the majority voted to eject:",
              )}
            </p>
          </div>
        </div>

        <div className="players-grid-manual">
          {alivePlayers.map((p) => (
            <button
              key={p.id}
              className="player-target-card"
              onClick={() => handleEliminate(p.id)}
            >
              <span className="player-emoji">{(p as any).emoji}</span>
              <span className="player-name">{p.name}</span>
              <div className="target-overlay">
                {t("games.impostor_elimination_selectBtn", "ELIMINATE")}
              </div>
            </button>
          ))}
        </div>

        <button className="skip-btn" onClick={() => handleEliminate(null)}>
          {t(
            "games.impostor_elimination_skipBtn",
            "SKIP EJECTION (TIE / BLANK VOTES)",
          )}
        </button>
      </div>
    </div>
  );
}
