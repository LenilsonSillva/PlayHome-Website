import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../../../../contexts/socketContext";
import { useI18n } from "../../../../i18n";
import { translateCryptoError } from "../../../../i18n/translateCryptoError";
import { CategoryGrid } from "../../../../components/CategoryGrid/CategoryGrid";
import type {
  CryptoConfigInput,
  CryptoMode,
  CryptoRoomView,
} from "../../../../types/cryptoOnline";
import styles from "./OnlineCryptoLobby.module.css";

const PLAYER_ICONS = ["🤫", "😁", "👾", "🧑🏻‍🚀", "👩🏽‍🚀", "👽", "🤖", "😎", "🫥", "🤔", "🤐", "😶‍🌫️", "😶", "🫠", "🥸", "🤥", "🫣", "🧐", "👹", "🫢", "🤓", "😈", "👿", "💀", "👻", "👺", "🧞‍♀️", "🧞‍♂️", "🧟", "🧌", "👨🏻", "👨🏽", "👩🏽", "👩🏻", "🤴🏻", "👸🏻", "🧑🏻‍🎄", "🕵🏻‍♀️", "🦹🏻", "🦸🏻", "🧙🏻", "🧛🏻"];
const ICON_COLORS = ["#ff003c", "#3b82f6", "#facc15", "#51890c", "#6d28d9", "#19a5ac", "#ff7b00", "#ff00fb", "#00ff40", "#69166b", "#7f1d1d", "#075985", "#a16207", "#065f46", "#4c1d95", "#13697f", "#b91c1c", "#1d4ed8", "#ba8d07", "#777777"];

function generateId() {
  return Math.random().toString(36).substring(2, 9) + new Date().getTime().toString(36);
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

type Props = {
  mode: CryptoMode;
  onModeChange: (mode: CryptoMode) => void;
};

export function OnlineCryptoLobby({ mode, onModeChange }: Props) {
  const socket = useSocket();
  const navigate = useNavigate();
  const { language, t } = useI18n();

  // ---------------- fluxo ----------------
  const [name, setName] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [lastRoomCode, setLastRoomCode] = useState<string | null>(null);
  const [inRoom, setInRoom] = useState(false);
  const [room, setRoom] = useState<CryptoRoomView | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------------- config (host) ----------------
  const [teamCount, setTeamCount] = useState(2);
  const [distributionType, setDistributionType] = useState<"random" | "manual">("random");
  const [roundTime, setRoundTime] = useState(60);
  const [wordLimit, setWordLimit] = useState(5);
  const [skipLimit, setSkipLimit] = useState<number>(3);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [othersSeeWord, setOthersSeeWord] = useState(true);
  const [operatorsSeeWordOnStandby, setOperatorsSeeWordOnStandby] = useState(true);
  const [manualAssignments, setManualAssignments] = useState<Record<string, number>>({});

  // ---------------- formulários de presencial ----------------
  const [presentName, setPresentName] = useState<string>("");

  const myPlayer = useMemo(() => {
    if (!room) return null;
    return (
      room.players.find((p) => p.socketId === socket.id) ??
      room.waitingPlayers.find((p) => p.socketId === socket.id) ??
      null
    );
  }, [room, socket.id]);
  const myId = myPlayer?.id ?? null;

  const isHost = !!room?.isHost;
  const myGroups = useMemo(() => {
    if (!room) return [];
    return room.groups.filter((g) => g.subHostId === myId);
  }, [room, myId]);

  const canManageGroup = useCallback(
    (groupId: string) =>
      isHost || myGroups.some((g) => g.id === groupId),
    [isHost, myGroups],
  );

  // ---------------- categorias do banco do servidor ----------------
  useEffect(() => {
    socket.emit("crypto:get-categories", { language }, (res: { categories?: string[] }) => {
      if (res?.categories?.length) {
        setAllCategories(res.categories);
        setSelectedCategories(res.categories);
      }
    });
  }, [language, socket]);

  useEffect(() => {
    setRoundTime(mode === "infiltration" ? 60 : 15);
  }, [mode]);

  // ---------------- eventos da sala ----------------
  useEffect(() => {
    const saved = localStorage.getItem("lastCryptoRoomCode");
    if (saved) setLastRoomCode(saved);

    function onRoomUpdated(data: CryptoRoomView) {
      const stillInRoom =
        data.players.some((p) => p.socketId === socket.id) ||
        (data.waitingPlayers ?? []).some((p) => p.socketId === socket.id);
      if (!stillInRoom) return;
      setRoom(data);
      setInRoom(true);
    }

    function onGameUpdate(data: unknown) {
      navigate("/games/secretWord/online", { state: { data } });
    }

    function onPlayerLeft({ name: leftName, reason }: { name: string; reason: string }) {
      const msg =
        reason === "kicked"
          ? `${leftName} ${t("alerts.impostor_leftGame", "was removed from the room")}`
          : `${leftName} ${t("alerts.impostor_leftGame", "left the room")}`;
      alert(msg);
    }

    function onHostChanged({ newHostId }: { newHostId: string }) {
      if (newHostId === socket.id) {
        alert(t("rooms.newHost", "The host left. You are now the new host of the room!"));
      }
    }

    function onForceLobby() {
      setRoom(null);
      setInRoom(false);
      alert(t("rooms.gameEndedNoTeams", "The match ended because there are not enough valid groups."));
    }

    function onDisconnect() {
      setInRoom((currently) => {
        if (currently) {
          setRoom(null);
          setError(t("alerts.lostConnection", "Connection to the server was lost."));
        }
        return false;
      });
    }

    socket.on("crypto:room-updated", onRoomUpdated);
    socket.on("crypto:game-update", onGameUpdate);
    socket.on("crypto:player-left", onPlayerLeft);
    socket.on("crypto:host-changed", onHostChanged);
    socket.on("crypto:force-lobby", onForceLobby);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("crypto:room-updated", onRoomUpdated);
      socket.off("crypto:game-update", onGameUpdate);
      socket.off("crypto:player-left", onPlayerLeft);
      socket.off("crypto:host-changed", onHostChanged);
      socket.off("crypto:force-lobby", onForceLobby);
      socket.off("disconnect", onDisconnect);
    };
  }, [socket, navigate, t]);

  // ---------------- helpers ----------------
  function emitAck(event: string, payload: unknown): Promise<{ ok?: boolean; error?: string } & Record<string, unknown>> {
    return new Promise((resolve) => {
      socket.emit(event, payload, (res: { ok?: boolean; error?: string } & Record<string, unknown>) => {
        resolve(res ?? {});
      });
    });
  }

  function fail(res: { error?: string } | null) {
    if (res?.error) {
      setError(translateCryptoError(res.error, t));
      return true;
    }
    return false;
  }

  const buildConfig = (): CryptoConfigInput => ({
    mode,
    teamCount,
    distributionType,
    roundTime,
    wordLimit,
    skipLimit,
    categories: selectedCategories,
    manualAssignments: distributionType === "manual" ? manualAssignments : undefined,
    othersSeeWord,
    operatorsSeeWordOnStandby,
  });

  // ---------------- ações ----------------
  const handleCreate = async () => {
    if (!name.trim()) return setError(t("alerts.impostor_crewmateName", "Enter your name."));
    setBusy(true);
    setError(null);
    const res = await emitAck("crypto:create-room", {
      name: name.trim(),
      id: generateId(),
      emoji: pickRandom(PLAYER_ICONS),
      color: pickRandom(ICON_COLORS),
    });
    setBusy(false);
    if (fail(res)) return;
    if (typeof res.roomCode === "string") {
      localStorage.setItem("lastCryptoRoomCode", res.roomCode);
      setLastRoomCode(res.roomCode);
      setInRoom(true);
    }
  };

  const handleJoin = async () => {
    if (!name.trim() || !roomCodeInput.trim()) {
      return setError(t("alerts.fillIn", "Fill in your name and room code."));
    }
    setBusy(true);
    setError(null);
    const res = await emitAck("crypto:join-room", {
      name: name.trim(),
      id: generateId(),
      emoji: pickRandom(PLAYER_ICONS),
      color: pickRandom(ICON_COLORS),
      roomCode: roomCodeInput.trim().toUpperCase(),
    });
    setBusy(false);
    if (fail(res)) return;
    localStorage.setItem("lastCryptoRoomCode", roomCodeInput.trim().toUpperCase());
    setLastRoomCode(roomCodeInput.trim().toUpperCase());
    setInRoom(true);
  };

  const handleLeave = () => {
    if (room) socket.emit("crypto:leave-room", { roomCode: room.code });
    setInRoom(false);
    setRoom(null);
  };

  const handleChooseWaitingGroup = async (groupId: string) => {
    if (!room || busy) return;
    setBusy(true);
    setError(null);
    const res = await emitAck("crypto:choose-waiting-group", {
      roomCode: room.code,
      groupId,
    });
    setBusy(false);
    if (fail(res)) return;
  };

  const handleCreateGroup = async () => {
    if (!room) return;
    const res = await emitAck("crypto:create-group", { roomCode: room.code });
    if (fail(res)) return;
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!room || !window.confirm(t("rooms.deleteGroup", "Delete this group? Its players will become unassigned."))) {
      return;
    }
    const res = await emitAck("crypto:delete-group", {
      roomCode: room.code,
      groupId,
    });
    if (fail(res)) return;
  };

  const handleJoinGroup = async (groupId: string) => {
    if (!room) return;
    const res = await emitAck("crypto:join-group", { roomCode: room.code, groupId });
    if (fail(res)) return;
  };

  const handleLeaveGroup = async () => {
    if (!room) return;
    const res = await emitAck("crypto:leave-group", { roomCode: room.code });
    if (fail(res)) return;
  };

  const handleAssignToGroup = async (playerId: string, groupId: string) => {
    if (!room) return;
    const res = await emitAck("crypto:assign-to-group", { roomCode: room.code, playerId, groupId });
    if (fail(res)) return;
  };

  const handleAddPresent = async (groupId: string) => {
    if (!room || !presentName.trim()) return;
    const res = await emitAck("crypto:add-present-player", {
      roomCode: room.code,
      name: presentName.trim(),
      groupId,
    });
    setPresentName("");
    if (fail(res)) return;
  };

  const handleRemovePlayer = async (playerId: string) => {
    if (!room) return;
    const res = await emitAck("crypto:remove-player", { roomCode: room.code, playerId });
    if (fail(res)) return;
  };

  const handleSetSubHost = async (groupId: string, playerId: string) => {
    if (!room) return;
    const res = await emitAck("crypto:set-subhost", { roomCode: room.code, groupId, playerId });
    if (fail(res)) return;
  };

  const handleUpdateConfig = async () => {
    if (!room) return;
    const res = await emitAck("crypto:update-config", { roomCode: room.code, config: buildConfig() });
    if (fail(res)) return;
  };

  const handleStart = async () => {
    if (!room) return;
    setBusy(true);
    setError(null);
    const res = await emitAck("crypto:start-game", {
      roomCode: room.code,
      config: buildConfig(),
      language,
    });
    setBusy(false);
    if (fail(res)) return;
    // a navegação acontece pelo crypto:game-update
  };

  // ---------------- VIEWS ----------------
  if (!inRoom) {
    return (
      <div className={styles.container}>
        <div className={`glass-panel ${styles.joinPanel}`}>
          <div className={styles.badge}>{t("games.cryptography_online_networkBadge", "CRYPTOGRAPHY SYSTEM — NETWORK")}</div>
          <h1 className={styles.title}>
            {t("games.cryptography_title", "CRYPTOGRAPHY")}<span className={styles.cyan}> {t("games.impostor_lobby_online", "ONLINE")}</span>
          </h1>

          <label className={styles.field}>
            <span>{t("games.cryptography_online_nameLabel", "YOUR NAME")}</span>
            <input
              className={styles.input}
              value={name}
              maxLength={15}
              placeholder={t("games.cryptography_online_namePlaceholder", "Player name")}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className={styles.field}>
            <span>{t("games.cryptography_online_roomCodeLabel", "ROOM CODE")}</span>
            <input
              className={styles.input}
              value={roomCodeInput}
              maxLength={5}
              placeholder={lastRoomCode ?? t("games.cryptography_online_roomCodePlaceholder", "E.G. CR7K2")}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
            />
          </label>

          {error && <div className={styles.errorBox}>{error}</div>}

          <div className={styles.joinActions}>
            <button className={styles.createBtn} onClick={handleCreate} disabled={busy}>
              {busy ? "..." : t("games.cryptography_online_createRoom", "CREATE ROOM")}
            </button>
            <button className={styles.joinBtn} onClick={handleJoin} disabled={busy}>
              {busy ? "..." : t("games.cryptography_online_joinRoom", "JOIN ROOM")}
            </button>
          </div>

          <p className={styles.hint}>
            {t("games.cryptography_online_joinHint", "Each group can be fully online, have only an operator with a phone, or be mixed with in-person players without a phone.")}
          </p>
        </div>
      </div>
    );
  }

  if (!room) return <div className={styles.container}>{t("home.loading", "Loading room...")}</div>;

  const waitingSelf = room.waitingPlayers.find(
    (player) => player.socketId === socket.id,
  );

  if (room.phase === "playing" && waitingSelf) {
    return (
      <div className={styles.container}>
        <div className={`glass-panel ${styles.roomHeader}`}>
          <div>
            <span className={styles.roomLabel}>{t("rooms.room", "ROOM")}</span>
            <span className={styles.roomCode}>{room.code}</span>
          </div>
          <button className={styles.leaveBtn} onClick={handleLeave}>
            {t("alerts.quit", "LEAVE")}
          </button>
        </div>

        {error && <div className={styles.errorBox}>{error}</div>}

        <div className={`glass-panel ${styles.waitingJoinPanel}`}>
          <span className={styles.badge}>{t("games.cryptography_online_matchInProgress", "MATCH IN PROGRESS")}</span>
          <h1>{t("games.cryptography_online_chooseGroup", "CHOOSE YOUR GROUP")}</h1>
          <p className={styles.hint}>
            {t("games.cryptography_online_waitingHint", "Review the groups and choose where you will play. You can watch the current round and join your chosen group in the next round.")}
          </p>

          <div className={styles.waitingJoinGroups}>
            {room.groups.map((group) => {
              const members = [
                ...room.players,
                ...room.presentPlayers,
              ].filter((player) => group.playerIds.includes(player.id));
              const selected = waitingSelf.groupId === group.id;

              return (
                <article
                  key={group.id}
                  className={`${styles.waitingJoinGroup} ${
                    selected ? styles.waitingJoinGroupSelected : ""
                  }`}
                  style={{ borderColor: group.color }}
                >
                  <div className={styles.groupHeader}>
                    <span
                      className={styles.groupDot}
                      style={{ background: group.color }}
                    />
                    <h2>{group.name}</h2>
                    <span className={styles.memberCount}>
                      {members.length} {t("games.cryptography_online_members", "members")}
                    </span>
                  </div>

                  <div className={styles.waitingJoinMembers}>
                    {members.map((member) => (
                      <span key={member.id} className={styles.waitingJoinMember}>
                        {member.emoji ?? "👤"} {member.name}
                      </span>
                    ))}
                  </div>

                  <button
                    className={styles.waitingJoinBtn}
                    style={{ borderColor: group.color }}
                    onClick={() => handleChooseWaitingGroup(group.id)}
                    disabled={busy}
                  >
                    {selected ? t("games.cryptography_online_joining", "JOINING...") : t("games.cryptography_online_joinThisGroup", "JOIN THIS GROUP")}
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const ungroupedOnline = room.players.filter((p) => p.groupId == null);
  const ungroupedPresent = room.presentPlayers.filter((p) => p.groupId == null);
  const myGroupId = room.players.find((p) => p.socketId === socket.id)?.groupId ?? null;
  const canCreateGroup =
    myPlayer?.connection === "online" && (isHost || myGroups.length === 0);
  const groupsWithoutOnline = room.groups.filter(
    (group) =>
      !room.players.some(
        (player) =>
          player.groupId === group.id && player.connection === "online",
      ),
  );
  // Jogadores online sem grupo ainda podem ser distribuídos no início;
  // o backend continua sendo a autoridade sobre o resultado final.
  const canStart =
    room.groups.length >= 2 &&
    ungroupedOnline.length >= groupsWithoutOnline.length;

  return (
    <div className={styles.container}>
      {/* CABEÇALHO DA SALA */}
      <div className={`glass-panel ${styles.roomHeader}`}>
        <div>
          <span className={styles.roomLabel}>{t("rooms.room", "ROOM")}</span>
          <span className={styles.roomCode}>{room.code}</span>
        </div>
        <div className={styles.roomHeaderRight}>
          {isHost && <span className={styles.hostBadge}>👑 {t("rooms.host", "HOST")}</span>}
          <button className={styles.leaveBtn} onClick={handleLeave}>
            {t("alerts.quit", "LEAVE")}
          </button>
        </div>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}

      <div className={styles.columns}>
        {/* ============ GRUPOS ============ */}
        <div className={styles.mainColumn}>
          <div className={styles.sectionHeader}>
            <h2>{t("games.cryptography_lobby_group", "GROUPS")} ({room.groups.length}/{room.config?.teamCount ?? 10})</h2>
            <button
              className={styles.createGroupBtn}
              onClick={handleCreateGroup}
              disabled={
                !canCreateGroup ||
                room.groups.length >= (room.config?.teamCount ?? 10)
              }
            >
              ＋ {isHost ? t("games.cryptography_online_createGroup", "CREATE GROUP") : t("games.cryptography_online_createGroupBecomeLeader", "CREATE GROUP (BECOME LEADER)")}
            </button>
          </div>

          {room.groups.length === 0 && (
            <div className={`glass-panel ${styles.emptyGroups}`}>
              {t("games.cryptography_online_noGroups", "No groups yet. Any online player can create the first group and become its leader.")}
            </div>
          )}

          {room.groups.map((group) => {
            const members = [
              ...room.players.filter((p) => p.groupId === group.id),
              ...room.presentPlayers.filter((p) => p.groupId === group.id),
            ];
            const iAmLeader = group.subHostId === myId;
            return (
              <div key={group.id} className={`glass-panel ${styles.groupCard}`} style={{ borderLeftColor: group.color }}>
                <div className={styles.groupHeader}>
                  <span className={styles.groupDot} style={{ background: group.color }} />
                  <h3>{group.name}</h3>
                  {!group.subHostId && (
                    <span className={styles.noLeaderBadge}>{t("games.cryptography_online_noLeader", "NO LEADER")}</span>
                  )}
                  <span className={styles.memberCount}>{members.length} {t("games.cryptography_online_members", "members")}</span>
                </div>

                <div className={styles.membersList}>
                  {members.map((m) => {
                    const isSub = group.subHostId === m.id;
                    const isLeaderElsewhere = room.groups.some(
                      (otherGroup) =>
                        otherGroup.id !== group.id &&
                        otherGroup.subHostId === m.id,
                    );
                    const conn = m.connection;
                    const isMe = m.id === myId;
                    return (
                      <div key={m.id} className={styles.memberRow}>
                        <span className={styles.memberEmoji}>{m.emoji ?? "👤"}</span>
                        <span className={styles.memberName}>
                          {m.name} {isMe && <em>({t("games.impostor_lobby_you", "you")})</em>}
                        </span>
                        {isSub && <span className={styles.subBadge}>🎖️ {t("games.cryptography_online_leader", "LEADER")}</span>}
                        <span
                          className={`${styles.connBadge} ${
                            conn === "online" ? styles.connOnline : conn === "present" ? styles.connPresent : styles.connOffline
                          }`}
                        >
                          {conn === "online" ? t("games.cryptography_online_online", "ONLINE") : conn === "present" ? t("games.cryptography_online_present", "IN PERSON") : t("games.cryptography_online_disconnected", "DISCONNECTED")}
                        </span>
                        {isHost &&
                          !isSub &&
                          !isLeaderElsewhere &&
                          conn !== "present" && (
                            <button
                              className={styles.miniBtn}
                              onClick={() => handleSetSubHost(group.id, m.id)}
                            >
                              👑
                            </button>
                          )}
                        {(isHost || (iAmLeader && conn === "present")) && (
                          <button className={styles.miniBtnDanger} onClick={() => handleRemovePlayer(m.id)}>
                            ✕
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* ações do grupo */}
                <div className={styles.groupActions}>
                  {myGroupId === group.id ? (
                    <button className={styles.leaveGroupBtn} onClick={handleLeaveGroup}>
                      {t("games.cryptography_online_leaveGroup", "LEAVE GROUP")}
                    </button>
                  ) : myGroupId == null ? (
                    <button className={styles.joinGroupBtn} onClick={() => handleJoinGroup(group.id)}>
                      {t("games.cryptography_online_joinGroup", "JOIN GROUP")}
                    </button>
                  ) : null}

                  {canManageGroup(group.id) &&
                    (ungroupedOnline.length > 0 || ungroupedPresent.length > 0) && (
                      <select
                        className={styles.assignSelect}
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) handleAssignToGroup(e.target.value, group.id);
                          e.target.value = "";
                        }}
                      >
                        <option value="">＋ {t("games.cryptography_online_movePlayer", "move player here")}</option>
                        {ungroupedOnline.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} · {t("games.cryptography_online_online", "ONLINE")}
                          </option>
                        ))}
                        {ungroupedPresent.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} · {t("games.cryptography_online_present", "IN PERSON")}
                          </option>
                        ))}
                      </select>
                    )}

                  {canManageGroup(group.id) && (
                    <div className={styles.presentForm}>
                      <input
                        className={styles.presentInput}
                        value={presentName}
                        maxLength={15}
                        placeholder={t("games.cryptography_online_presentPlaceholder", "In-person player name (no phone)")}
                        onChange={(e) => setPresentName(e.target.value)}
                      />
                      <button
                        className={styles.presentBtn}
                        onClick={() => handleAddPresent(group.id)}
                        disabled={!presentName.trim()}
                      >
                        ＋ {t("games.cryptography_online_addPresent", "IN-PERSON")}
                      </button>
                    </div>
                  )}

                  {canManageGroup(group.id) && (
                    <button
                      className={styles.deleteGroupBtn}
                      onClick={() => handleDeleteGroup(group.id)}
                    >
                      🗑️ {t("games.cryptography_online_deleteGroup", "DELETE GROUP")}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ============ JOGADORES + CONFIG ============ */}
        <div className={styles.sideColumn}>
          <div className={`glass-panel ${styles.playersPanel}`}>
            <h2>{t("games.cryptography_action_players", "PLAYERS")} ({room.players.length})</h2>
            {room.players.map((p) => (
              <div key={p.id} className={styles.memberRow}>
                <span className={styles.memberEmoji}>{p.emoji ?? "👤"}</span>
                <span className={styles.memberName}>{p.name}</span>
                <span className={styles.connBadge + " " + styles.connOnline}>{t("games.cryptography_online_online", "ONLINE")}</span>
                {isHost && p.id !== myId && (
                  <button className={styles.miniBtnDanger} onClick={() => handleRemovePlayer(p.id)}>
                    ✕
                  </button>
                )}
              </div>
            ))}
            {ungroupedPresent.length > 0 && (
              <>
                <h3 className={styles.unassignedTitle}>{t("games.cryptography_online_unassignedPresent", "IN-PERSON PLAYERS WITHOUT A GROUP")}</h3>
                {ungroupedPresent.map((p) => (
                  <div key={p.id} className={styles.memberRow}>
                    <span className={styles.memberEmoji}>{p.emoji ?? "🏠"}</span>
                    <span className={styles.memberName}>{p.name}</span>
                    <span className={styles.connBadge + " " + styles.connPresent}>
                      {t("games.cryptography_online_present", "IN PERSON")}
                    </span>
                    {isHost && (
                      <button className={styles.miniBtnDanger} onClick={() => handleRemovePlayer(p.id)}>
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>

          {isHost ? (
            <div className={`glass-panel ${styles.configPanel}`}>
              <h2>{t("games.cryptography_online_missionConfig", "MISSION CONFIGURATION")}</h2>

              <div className={styles.configSection}>
                <label>{t("games.cryptography_online_mode", "MODE")}</label>
                <div className={styles.segmented}>
                  <button
                    className={mode === "infiltration" ? styles.segActive : ""}
                    onClick={() => onModeChange("infiltration")}
                  >
                    ⚡ {t("games.cryptography_mode_infiltration", "INFILTRATION")}
                  </button>
                  <button
                    className={mode === "interception" ? styles.segActive : ""}
                    onClick={() => onModeChange("interception")}
                  >
                    ⚔️ {t("games.cryptography_mode_interception", "INTERCEPTION")}
                  </button>
                </div>
              </div>

              <div className={styles.configSection}>
                <label>{t("games.cryptography_lobby_groupCount", "NUMBER OF GROUPS")}</label>
                <div className={styles.counter}>
                  <button onClick={() => setTeamCount((t) => Math.max(2, t - 1))}>−</button>
                  <span>{teamCount}</span>
                  <button onClick={() => setTeamCount((t) => Math.min(10, t + 1))}>＋</button>
                </div>
              </div>

              <div className={styles.configSection}>
                <label>{t("games.cryptography_lobby_distribution", "DISTRIBUTION")}</label>
                <div className={styles.segmented}>
                  <button
                    className={distributionType === "random" ? styles.segActive : ""}
                    onClick={() => setDistributionType("random")}
                  >
                    {t("games.cryptography_lobby_random", "RANDOM")}
                  </button>
                  <button
                    className={distributionType === "manual" ? styles.segActive : ""}
                    onClick={() => setDistributionType("manual")}
                  >
                    {t("games.cryptography_lobby_manual", "MANUAL")}
                  </button>
                </div>
                {distributionType === "manual" && ungroupedOnline.length > 0 && (
                  <div className={styles.manualList}>
                    {ungroupedOnline.map((p) => (
                      <div key={p.id} className={styles.manualRow}>
                        <span>{p.name}</span>
                        <select
                          value={manualAssignments[p.id] ?? 0}
                          onChange={(e) =>
                            setManualAssignments((prev) => ({
                              ...prev,
                              [p.id]: Number(e.target.value),
                            }))
                          }
                        >
                          {room.groups.map((g, idx) => (
                            <option key={g.id} value={idx}>
                              {g.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.configSection}>
                <label>{t("games.cryptography_lobby_timer", "TIMER")}</label>
                <div className={styles.timeOptions}>
                  {(mode === "infiltration" ? [60, 90, 120] : [15, 30, 60]).map((t) => (
                    <button
                      key={t}
                      className={roundTime === t ? styles.timeActive : ""}
                      onClick={() => setRoundTime(t)}
                    >
                      {t}s
                    </button>
                  ))}
                </div>
              </div>

              {mode === "interception" && (
                <div className={styles.configSection}>
                  <label>{t("games.cryptography_lobby_wordLimit", "WORDS PER ROUND")}</label>
                  <div className={styles.timeOptions}>
                    {[5, 10, 20].map((n) => (
                      <button
                        key={n}
                        className={wordLimit === n ? styles.timeActive : ""}
                        onClick={() => setWordLimit(n)}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {mode === "infiltration" && (
                <div className={styles.configSection}>
                  <label>{t("games.cryptography_lobby_skipLimit", "SKIPS PER TURN")}</label>
                  <div className={styles.timeOptions}>
                    {[3, 5, 10, 999].map((n) => (
                      <button
                        key={n}
                        className={skipLimit === n ? styles.timeActive : ""}
                        onClick={() => setSkipLimit(n)}
                      >
                        {n === 999 ? "∞" : n}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className={styles.configSection}>
                <label>{t("games.cryptography_lobby_db", "WORD BANK")}</label>
                <CategoryGrid
                  categories={allCategories}
                  selectedCategories={selectedCategories}
                  onToggle={(category) =>
                    setSelectedCategories((prev) =>
                      prev.includes(category) ? prev.filter((item) => item !== category) : [...prev, category],
                    )
                  }
                />
              </div>

              <div className={styles.configSection}>
                <label className={styles.checkRow}>
                  <input
                    type="checkbox"
                    checked={othersSeeWord}
                    onChange={(e) => setOthersSeeWord(e.target.checked)}
                  />
                  {t("games.cryptography_online_othersSeeWord", "Infiltration: other groups see the current group’s word")}
                </label>
                <label className={styles.checkRow}>
                  <input
                    type="checkbox"
                    checked={operatorsSeeWordOnStandby}
                    onChange={(e) => setOperatorsSeeWordOnStandby(e.target.checked)}
                  />
                  {t("games.cryptography_online_operatorsSeeWord", "Interception: operators see the word while the timer is stopped")}
                </label>
              </div>

              <div className={styles.configActions}>
                <button className={styles.saveConfigBtn} onClick={handleUpdateConfig}>
                  {t("games.cryptography_online_saveConfig", "SAVE CONFIGURATION")}
                </button>
                <button className={styles.startBtn} onClick={handleStart} disabled={busy || !canStart}>
                  {busy ? "..." : `🚀 ${t("games.cryptography_lobby_start", "START MISSION")}`}
                </button>
              </div>
              {!canStart && (
                <p className={styles.hint}>
                  {room.groups.length < 2
                    ? t("games.cryptography_online_needGroups", "At least 2 groups are needed to start.")
                    : t("games.cryptography_online_needOnline", "Each group needs at least one online player.")}
                </p>
              )}
            </div>
          ) : (
            <div className={`glass-panel ${styles.playersPanel}`}>
              <h2>{t("games.cryptography_online_waitingHost", "WAITING FOR THE HOST")}</h2>
              <p className={styles.hint}>
                {t("games.cryptography_online_waitingHostHint", "The host is configuring the mission. Build your group and wait for the start!")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
