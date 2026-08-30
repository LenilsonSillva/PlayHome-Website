import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSocket } from "../../../../contexts/socketContext";
import type { CryptoView } from "../../../../types/cryptoOnline";
import resultSfx from "../../../../assets/sounds/win.mp3";
import { OnlineTeamReveal } from "./components/OnlineTeamReveal";
import { OnlineInfiltrationAction } from "./components/OnlineInfiltrationAction";
import { OnlineInterceptionAction } from "./components/OnlineInterceptionAction";
import { OnlineRoundResult } from "./components/OnlineRoundResult";
import styles from "./onlineCrypto.module.css";
import { useI18n } from "../../../../i18n";
import { translateCryptoError } from "../../../../i18n/translateCryptoError";

const PHASE_LABEL_KEYS: Record<CryptoView["phase"], string> = {
  "team-reveal": "games.cryptography_phase_team_reveal",
  "infiltration-action": "games.cryptography_phase_infiltration_action",
  "interception-action": "games.cryptography_phase_interception_action",
  "round-result": "games.cryptography_phase_round_result",
};

export function OnlineCryptoGame() {
  const socket = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();

  const rawState = (location.state as { data?: CryptoView } | null) ?? null;
  const [view, setView] = useState<CryptoView | null>(rawState?.data ?? null);
  const resultSound = useRef(new Audio(resultSfx));

  // Mantém o som de resultado usado no modo offline.
  useEffect(() => {
    if (view?.phase !== "round-result") return;
    resultSound.current.currentTime = 0;
    resultSound.current.play().catch(() => {});
  }, [view?.phase]);

  // ---------------- ações (com alerta de erro do servidor) ----------------
  const emit = useCallback(
    (event: string, payload?: unknown) => {
      socket.emit(
        event,
        payload ?? {},
        (res: { error?: string } | undefined) => {
          if (res?.error) alert(translateCryptoError(res.error, t));
        },
      );
    },
    [socket, t],
  );

  // ---------------- eventos da partida ----------------
  useEffect(() => {
    function onGameUpdate(data: CryptoView) {
      setView(data);
    }

    function onPlayerLeft({ name, reason }: { name: string; reason: string }) {
      alert(
        reason === "kicked"
          ? `${name} ${t("rooms.removedFromRoom", "was removed from the room")}`
          : `${name} ${t("rooms.leftTheGame", "left the game")}`,
      );
    }

    function onHostChanged({ newHostId }: { newHostId: string }) {
      if (newHostId === socket.id) {
        alert(t("rooms.newHost", "The host left. You are now the HOST!"));
      }
    }

    function onForceLobby() {
      alert(t("rooms.gameEndedNoTeams", "The match ended because there are not enough valid groups."));
      navigate("/games/secretWord/lobby");
    }

    socket.on("crypto:game-update", onGameUpdate);
    socket.on("crypto:player-left", onPlayerLeft);
    socket.on("crypto:host-changed", onHostChanged);
    socket.on("crypto:force-lobby", onForceLobby);

    return () => {
      socket.off("crypto:game-update", onGameUpdate);
      socket.off("crypto:player-left", onPlayerLeft);
      socket.off("crypto:host-changed", onHostChanged);
      socket.off("crypto:force-lobby", onForceLobby);
    };
  }, [socket, navigate, t]);

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
    if (view && window.confirm(t("alerts.cryptography_leaveGame", "Leave the match?"))) {
      socket.emit("crypto:leave-room", { roomCode: view.roomCode });
      navigate("/games/secretWord/lobby");
    }
  };

  if (!view) {
    return (
      <div className={styles.container}>
        <p className={styles.waitingNote}>{t("home.loading", "Loading...")}</p>
      </div>
    );
  }

  const actingPlayerId = view.actingPlayerId ?? view.myPlayerId;
  const isOperator = view.teams.some(
    (team) => team.operatorId === actingPlayerId,
  );
  const myTeam =
    view.myTeamIndex >= 0 ? (view.teams[view.myTeamIndex] ?? null) : null;
  const myTeamOperator = myTeam?.players.find(
    (player) => player.id === myTeam.operatorId,
  );
  const showMyTeamHeader = !view.controls.canControl && myTeam != null;

  const roomHeader = (
    <div
      className={styles.gameTopBar}
      style={showMyTeamHeader ? { borderBottomColor: myTeam.color } : undefined}
    >
      <button className={styles.exitBtn} onClick={handleExit}>
        ← {t("alerts.quit", "EXIT")}
      </button>
      <span className={styles.gameRoomCode}>
        {t("games.cryptography_result_round", "ROUND")} {view.roundNumber} · {t(PHASE_LABEL_KEYS[view.phase], view.phase)} · {t("rooms.room", "ROOM")} {view.roomCode}
      </span>
      {showMyTeamHeader ? (
        <span
          className={styles.gameViewerTeam}
          style={{ color: myTeam.color }}
          title={t("rooms.yourTeam", "Your team")}
        >
          <strong>{myTeam.name}</strong>
          <small>
            {view.isHost ? `👑 ${t("rooms.host", "HOST")} · ` : "👀 "}{t("rooms.yourTeam", "YOUR TEAM")} · {t("games.cryptography_action_operator", "OPERATOR:")}{" "}
            {myTeamOperator?.name ?? "---"} · {myTeam.score} {t("site.points", "PTS")}
          </small>
        </span>
      ) : (
        <span className={styles.gameRole}>
          {isOperator
            ? `📡 ${t("games.cryptography_action_operator", "OPERATOR")}`
            : view.isHost
              ? `👑 ${t("rooms.host", "HOST")}`
              : view.isSpectator
                ? `👀 ${t("rooms.spectator", "SPECTATOR")}`
                : `👤 ${t("rooms.player", "PLAYER")}`}
        </span>
      )}
    </div>
  );

  return (
    <div className={styles.gameShell}>
      {roomHeader}

      {view.phase === "team-reveal" && (
        <OnlineTeamReveal
          view={view}
          onSelectOperator={(teamId, playerId) =>
            emit("crypto:set-operator", {
              roomCode: view.roomCode,
              teamId,
              playerId,
            })
          }
          onRandomizeOperators={() =>
            emit("crypto:set-random-operators", { roomCode: view.roomCode })
          }
          onSetStartingTeam={(teamIndex) =>
            emit("crypto:set-starting-team", {
              roomCode: view.roomCode,
              teamIndex,
            })
          }
          onBeginAction={() =>
            emit("crypto:begin-action", { roomCode: view.roomCode })
          }
        />
      )}

      {view.phase === "infiltration-action" && (
        <OnlineInfiltrationAction view={view} emit={emit} />
      )}

      {view.phase === "interception-action" && (
        <OnlineInterceptionAction view={view} emit={emit} />
      )}

      {view.phase === "round-result" && (
        <OnlineRoundResult view={view} emit={emit} />
      )}
    </div>
  );
}
