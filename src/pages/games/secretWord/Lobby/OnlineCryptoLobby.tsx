import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../../../../contexts/socketContext";
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

export function OnlineCryptoLobby() {
  const socket = useSocket();
  const navigate = useNavigate();

  // ---------------- fluxo ----------------
  const [name, setName] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [lastRoomCode, setLastRoomCode] = useState<string | null>(null);
  const [inRoom, setInRoom] = useState(false);
  const [room, setRoom] = useState<CryptoRoomView | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---------------- config (host) ----------------
  const [mode, setMode] = useState<CryptoMode>("infiltration");
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
    socket.emit("crypto:get-categories", { language: "pt-BR" }, (res: { categories?: string[] }) => {
      if (res?.categories?.length) {
        setAllCategories(res.categories);
        setSelectedCategories(res.categories);
      }
    });
  }, [socket]);

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
          ? `${leftName} foi removido da sala`
          : `${leftName} saiu da sala`;
      alert(msg);
    }

    function onHostChanged({ newHostId }: { newHostId: string }) {
      if (newHostId === socket.id) {
        alert("O host saiu. Você agora é o novo HOST da sala!");
      }
    }

    function onForceLobby() {
      setRoom(null);
      setInRoom(false);
      alert("A partida foi encerrada porque não há grupos válidos suficientes.");
    }

    function onDisconnect() {
      setInRoom((currently) => {
        if (currently) {
          setRoom(null);
          setError("Conexão perdida com o servidor.");
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
  }, [socket, navigate]);

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
      setError(res.error);
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
    if (!name.trim()) return setError("Digite seu nome");
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
      return setError("Preencha nome e código da sala");
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
    if (!room || !window.confirm("Apagar este grupo? Os jogadores voltarão a ficar sem grupo.")) {
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
      language: "pt-BR",
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
          <div className={styles.badge}>PROTOCOLO CRIPTOGRAFIA — REDE</div>
          <h1 className={styles.title}>
            CRIPTOGRAFIA<span className={styles.cyan}> ONLINE</span>
          </h1>

          <label className={styles.field}>
            <span>SEU NOME</span>
            <input
              className={styles.input}
              value={name}
              maxLength={15}
              placeholder="Nome do tripulante"
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className={styles.field}>
            <span>CÓDIGO DA SALA</span>
            <input
              className={styles.input}
              value={roomCodeInput}
              maxLength={5}
              placeholder={lastRoomCode ?? "EX: CR7K2"}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
            />
          </label>

          {error && <div className={styles.errorBox}>{error}</div>}

          <div className={styles.joinActions}>
            <button className={styles.createBtn} onClick={handleCreate} disabled={busy}>
              {busy ? "..." : "CRIAR SALA"}
            </button>
            <button className={styles.joinBtn} onClick={handleJoin} disabled={busy}>
              {busy ? "..." : "ENTRAR NA SALA"}
            </button>
          </div>

          <p className={styles.hint}>
            Cada grupo pode ter todos online, só o operador com celular ou um
            time misto (jogadores presenciais sem celular).
          </p>
        </div>
      </div>
    );
  }

  if (!room) return <div className={styles.container}>Carregando sala...</div>;

  const waitingSelf = room.waitingPlayers.find(
    (player) => player.socketId === socket.id,
  );

  if (room.phase === "playing" && waitingSelf) {
    return (
      <div className={styles.container}>
        <div className={`glass-panel ${styles.roomHeader}`}>
          <div>
            <span className={styles.roomLabel}>SALA</span>
            <span className={styles.roomCode}>{room.code}</span>
          </div>
          <button className={styles.leaveBtn} onClick={handleLeave}>
            SAIR
          </button>
        </div>

        {error && <div className={styles.errorBox}>{error}</div>}

        <div className={`glass-panel ${styles.waitingJoinPanel}`}>
          <span className={styles.badge}>PARTIDA EM ANDAMENTO</span>
          <h1>ESCOLHA SEU GRUPO</h1>
          <p className={styles.hint}>
            Veja os grupos e escolha onde você vai jogar. Você assiste à rodada
            atual e entra no grupo escolhido quando começar a próxima rodada.
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
                      {members.length} integrantes
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
                    {selected ? "ENTRANDO..." : "ENTRAR NESTE GRUPO"}
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
          <span className={styles.roomLabel}>SALA</span>
          <span className={styles.roomCode}>{room.code}</span>
        </div>
        <div className={styles.roomHeaderRight}>
          {isHost && <span className={styles.hostBadge}>👑 HOST</span>}
          <button className={styles.leaveBtn} onClick={handleLeave}>
            SAIR
          </button>
        </div>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}

      <div className={styles.columns}>
        {/* ============ GRUPOS ============ */}
        <div className={styles.mainColumn}>
          <div className={styles.sectionHeader}>
            <h2>GRUPOS ({room.groups.length}/{room.config?.teamCount ?? 10})</h2>
            <button
              className={styles.createGroupBtn}
              onClick={handleCreateGroup}
              disabled={
                !canCreateGroup ||
                room.groups.length >= (room.config?.teamCount ?? 10)
              }
            >
              ＋ {isHost ? "CRIAR GRUPO" : "CRIAR GRUPO (VIRA LÍDER)"}
            </button>
          </div>

          {room.groups.length === 0 && (
            <div className={`glass-panel ${styles.emptyGroups}`}>
              Nenhum grupo ainda. Qualquer jogador online pode criar o primeiro
              grupo e virar seu líder.
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
                    <span className={styles.noLeaderBadge}>SEM LÍDER</span>
                  )}
                  <span className={styles.memberCount}>{members.length} integrantes</span>
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
                          {m.name} {isMe && <em>(você)</em>}
                        </span>
                        {isSub && <span className={styles.subBadge}>🎖️ LÍDER</span>}
                        <span
                          className={`${styles.connBadge} ${
                            conn === "online" ? styles.connOnline : conn === "present" ? styles.connPresent : styles.connOffline
                          }`}
                        >
                          {conn === "online" ? "ONLINE" : conn === "present" ? "PRESENCIAL" : "DESCONECTADO"}
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
                      SAIR DO GRUPO
                    </button>
                  ) : myGroupId == null ? (
                    <button className={styles.joinGroupBtn} onClick={() => handleJoinGroup(group.id)}>
                      ENTRAR NO GRUPO
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
                        <option value="">＋ mover jogador para cá</option>
                        {ungroupedOnline.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} · ONLINE
                          </option>
                        ))}
                        {ungroupedPresent.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} · PRESENCIAL
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
                        placeholder="Nome do presencial (sem celular)"
                        onChange={(e) => setPresentName(e.target.value)}
                      />
                      <button
                        className={styles.presentBtn}
                        onClick={() => handleAddPresent(group.id)}
                        disabled={!presentName.trim()}
                      >
                        ＋ PRESENCIAL
                      </button>
                    </div>
                  )}

                  {canManageGroup(group.id) && (
                    <button
                      className={styles.deleteGroupBtn}
                      onClick={() => handleDeleteGroup(group.id)}
                    >
                      🗑️ APAGAR GRUPO
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
            <h2>JOGADORES ({room.players.length})</h2>
            {room.players.map((p) => (
              <div key={p.id} className={styles.memberRow}>
                <span className={styles.memberEmoji}>{p.emoji ?? "👤"}</span>
                <span className={styles.memberName}>{p.name}</span>
                <span className={styles.connBadge + " " + styles.connOnline}>ONLINE</span>
                {isHost && p.id !== myId && (
                  <button className={styles.miniBtnDanger} onClick={() => handleRemovePlayer(p.id)}>
                    ✕
                  </button>
                )}
              </div>
            ))}
            {ungroupedPresent.length > 0 && (
              <>
                <h3 className={styles.unassignedTitle}>PRESENCIAIS SEM GRUPO</h3>
                {ungroupedPresent.map((p) => (
                  <div key={p.id} className={styles.memberRow}>
                    <span className={styles.memberEmoji}>{p.emoji ?? "🏠"}</span>
                    <span className={styles.memberName}>{p.name}</span>
                    <span className={styles.connBadge + " " + styles.connPresent}>
                      PRESENCIAL
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
              <h2>CONFIGURAÇÃO DA MISSÃO</h2>

              <div className={styles.configSection}>
                <label>MODO</label>
                <div className={styles.segmented}>
                  <button
                    className={mode === "infiltration" ? styles.segActive : ""}
                    onClick={() => setMode("infiltration")}
                  >
                    ⚡ INFILTRAÇÃO
                  </button>
                  <button
                    className={mode === "interception" ? styles.segActive : ""}
                    onClick={() => setMode("interception")}
                  >
                    ⚔️ INTERCEPTAÇÃO
                  </button>
                </div>
              </div>

              <div className={styles.configSection}>
                <label>NÚMERO DE GRUPOS</label>
                <div className={styles.counter}>
                  <button onClick={() => setTeamCount((t) => Math.max(2, t - 1))}>−</button>
                  <span>{teamCount}</span>
                  <button onClick={() => setTeamCount((t) => Math.min(10, t + 1))}>＋</button>
                </div>
              </div>

              <div className={styles.configSection}>
                <label>DISTRIBUIÇÃO</label>
                <div className={styles.segmented}>
                  <button
                    className={distributionType === "random" ? styles.segActive : ""}
                    onClick={() => setDistributionType("random")}
                  >
                    ALEATÓRIO
                  </button>
                  <button
                    className={distributionType === "manual" ? styles.segActive : ""}
                    onClick={() => setDistributionType("manual")}
                  >
                    MANUAL
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
                <label>CRONÔMETRO</label>
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
                  <label>PALAVRAS POR RODADA</label>
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
                  <label>PULOS POR TURNO</label>
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
                <label>BANCO DE PALAVRAS</label>
                <div className={styles.catGrid}>
                  {allCategories.map((cat) => (
                    <button
                      key={cat}
                      className={selectedCategories.includes(cat) ? styles.catActive : ""}
                      onClick={() =>
                        setSelectedCategories((prev) =>
                          prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
                        )
                      }
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.configSection}>
                <label className={styles.checkRow}>
                  <input
                    type="checkbox"
                    checked={othersSeeWord}
                    onChange={(e) => setOthersSeeWord(e.target.checked)}
                  />
                  Infiltração: outros grupos veem a palavra do grupo da vez
                </label>
                <label className={styles.checkRow}>
                  <input
                    type="checkbox"
                    checked={operatorsSeeWordOnStandby}
                    onChange={(e) => setOperatorsSeeWordOnStandby(e.target.checked)}
                  />
                  Interceptação: operadores veem a palavra com o tempo parado
                </label>
              </div>

              <div className={styles.configActions}>
                <button className={styles.saveConfigBtn} onClick={handleUpdateConfig}>
                  SALVAR CONFIGURAÇÃO
                </button>
                <button className={styles.startBtn} onClick={handleStart} disabled={busy || !canStart}>
                  {busy ? "..." : "🚀 INICIAR MISSÃO"}
                </button>
              </div>
              {!canStart && (
                <p className={styles.hint}>
                  {room.groups.length < 2
                    ? "São necessários pelo menos 2 grupos para começar."
                    : "Cada grupo precisa de pelo menos um jogador online."}
                </p>
              )}
            </div>
          ) : (
            <div className={`glass-panel ${styles.playersPanel}`}>
              <h2>AGUARDANDO O HOST</h2>
              <p className={styles.hint}>
                O host está configurando a missão. Monte seu grupo e aguarde o
                início!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
