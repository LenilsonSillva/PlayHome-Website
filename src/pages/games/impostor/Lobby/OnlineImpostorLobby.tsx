import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCategories, getWordDatabase } from "../../../../data/words";
import { useI18n } from "../../../../i18n";
import { CategoryGrid } from "../../../../components/CategoryGrid/CategoryGrid";
import styles from "./OnlineLobby.module.css";
import { useSocket } from "../../../../contexts/socketContext";

export function OnlineImpostorLobby() {
  const socket = useSocket();
  const navigate = useNavigate();
  const { language, t } = useI18n();
  const categories = useMemo(() => getCategories(getWordDatabase(language)), [language]);

  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [lastRoomCode, setLastRoomCode] = useState<string | null>(null);
  const [inRoom, setInRoom] = useState(false);

  const [players, setPlayers] = useState<any[]>([]);
  const [isHost, setIsHost] = useState(false);

  const [selectImpostorNumbers, setSelectImpostorNumbers] = useState(1);

  const [twoGroups, setTwoGroups] = useState(false);
  const [whoStart, setWhoStart] = useState(true);
  const [impostorCanStart, setImpostorCanStart] = useState(true);
  const [impostorHint, setImpostorHint] = useState(false);
  const [impostorTrap, setImpostorTrap] = useState(false);
  const [impostorCat, setImpostorCat] = useState(false);
  const [impostorsUnited, setImpostorsUnited] = useState(false);

  const [showCategories, setShowCategories] = useState(false);
  const [categorie, setCategorie] = useState<string[]>(categories);

  const PLAYER_ICONS = [
    "🤫",
    "😁",
    "👾",
    "🧑🏻‍🚀",
    "👩🏽‍🚀",
    "👽",
    "🤖",
    "😎",
    "🫥",
    "🤔",
    "🤐",
    "😶‍🌫️",
    "😶",
    "🫠",
    "🥸",
    "🤥",
    "🫣",
    "🧐",
    "👹",
    "🫢",
    "🤓",
    "😈",
    "👿",
    "💀",
    "👻",
    "👺",
    "🧞‍♀️",
    "🧞‍♂️",
    "🧟",
    "🧌",
    "👨🏻",
    "👨🏽",
    "👩🏽",
    "👩🏻",
    "🤴🏻",
    "👸🏻",
    "🧑🏻‍🎄",
    "🕵🏻‍♀️",
    "🦹🏻",
    "🦸🏻",
    "🧙🏻",
    "🧛🏻",
  ];

  const ICON_COLORS = [
    "#ff003c",
    "#3b82f6",
    "#facc15",
    "#51890c",
    "#6d28d9",
    "#19a5ac",
    "#ff7b00",
    "#ff00fb",
    "#00ff40",
    "#69166b",
    "#7f1d1d",
    "#075985",
    "#a16207",
    "#065f46",
    "#4c1d95",
    "#13697f",
    "#b91c1c",
    "#1d4ed8",
    "#ba8d07",
    "#777777",
  ];

  function generateId() {
    return (
      Math.random().toString(36).substring(2, 9) +
      new Date().getTime().toString(36)
    );
  }

  function getRandomFromArray(arr: any[]) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  const maxImpostors = useMemo(() => {
    if (players.length >= 7) return 3;
    if (players.length >= 5) return 2;
    return 1;
  }, [players.length]);

  useEffect(() => {
    setSelectImpostorNumbers((p) => Math.min(p, maxImpostors));
  }, [players.length, maxImpostors]);

  useEffect(() => {
    setCategorie(categories);
  }, [categories]);

  useEffect(() => {
    // carregar último código de sala conhecido (se houver)
    try {
      const stored = localStorage.getItem("lastRoomCode");
      if (stored) setLastRoomCode(stored);
    } catch (e) {
      // ignore
    }

    socket.on("room-updated", (room) => {
      setPlayers(room.players);
      setRoomCode(room.code);
      setIsHost(room.hostId === socket.id);
    });

    socket.on("game-update", (data) => {
      navigate("/games/impostor/online", { state: data });
    });

    return () => {
      socket.off("room-updated");
      socket.off("game-update");
    };
  }, [navigate, socket]);

  function handleCategorie(cat: string) {
    categorie.includes(cat)
      ? setCategorie((prev) => prev.filter((item) => item !== cat))
      : setCategorie((prev) => [...prev, cat]);
  }

  function handleCreate() {
    if (!name.trim()) return alert(t("alerts.impostor_crewmateName", "Enter your player name."));

    const id = generateId();
    const emoji = getRandomFromArray(PLAYER_ICONS);
    const color = getRandomFromArray(ICON_COLORS);

    socket.emit("create-room", { name, id, emoji, color }, (res: any) => {
      if (res.error) return alert(res.error);
      setInRoom(true);
      try {
        if (res.roomCode) {
          localStorage.setItem("lastRoomCode", res.roomCode);
          setLastRoomCode(res.roomCode);
        }
      } catch (e) {}
    });
  }

  function handleJoin() {
    if (!name.trim() || !roomCode.trim()) return alert(t("alerts.fillIn", "Fill in all fields."));

    const id = generateId();
    const emoji = getRandomFromArray(PLAYER_ICONS);
    const color = getRandomFromArray(ICON_COLORS);

    socket.emit(
      "join-room",
      { name, id, emoji, color, roomCode: roomCode.toUpperCase() },
      (res: any) => {
        if (res.error) return alert(res.error);
        setInRoom(true);
        try {
          localStorage.setItem("lastRoomCode", roomCode.toUpperCase());
          setLastRoomCode(roomCode.toUpperCase());
        } catch (e) {}
      },
    );
  }

  function startGame() {
    socket.emit("start-game", {
      roomCode,
      config: {
        howManyImpostors: selectImpostorNumbers,
        twoWordsMode: twoGroups,
        whoStart,
        impostorCanStart,
        impostorHasHint: impostorHint,
        impostorTrap,
        impostorCat,
        impostorsUnited,
        selectedCategories: categorie,
        language,
      },
      language,
    });
  }

  if (!inRoom) {
    return (
      <div className={styles.lobbyWrapper}>
        <div className={`glass-panel ${styles.joinPanel}`}>
          <div className={styles.badge}>{t("games.impostor_lobby_onlineBadge", "IMPOSTOR SYSTEM — NETWORK")}</div>
          <h1 className={styles.title}>
            {t("games.impostor_title", "IMPOSTOR")}<span className={styles.cyan}> {t("games.impostor_lobby_online", "ONLINE")}</span>
          </h1>

          <label className={styles.field}>
            <span>{t("games.impostor_lobby_nameLabel", "YOUR NAME")}</span>
            <input
              className={styles.textInput}
              placeholder={t("games.impostor_lobby_playerName", "Player name")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={15}
            />
          </label>

          <label className={styles.field}>
            <span>{t("games.impostor_lobby_roomCodeLabel", "ROOM CODE")}</span>
            <input
              className={styles.textInput}
              placeholder={lastRoomCode ?? t("site.roomCode", "ROOM CODE")}
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            />
          </label>

          {lastRoomCode && (
            <div className={styles.lastRoom}>
              <button
                className={styles.addButton}
                onClick={() => {
                  setRoomCode(lastRoomCode);
                  try {
                    navigator.clipboard?.writeText(lastRoomCode);
                  } catch (e) {}
                }}
              >
                {t("site.roomCode", "Last room")}: {lastRoomCode}
              </button>
            </div>
          )}

          <div className={styles.joinActions}>
            <button className={styles.startButton} onClick={handleCreate}>
              {t("games.impostor_lobby_createRoom", "CREATE ROOM")}
            </button>
            <button className={styles.addButton} onClick={handleJoin}>
              {t("games.impostor_lobby_joinRoom", "JOIN ROOM")}
            </button>
          </div>

          <p className={styles.hint}>
            {t("games.impostor_lobby_joinHint", "Create a room or enter a code to join your friends.")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.lobbyWrapper}>
      <div className={styles.headerArea}>
        <h1 className={styles.title}>{t("games.impostor_lobby_roomCode", "ROOM")}: {roomCode}</h1>
        <p className={styles.subtitle}>
          {isHost ? t("games.impostor_lobby_you", "You are the host") : t("games.impostor_lobby_waitingInit", "Waiting for the host...")}
        </p>
      </div>

      <div className={styles.roomGrid}>
        {/* JOGADORES */}
        <div className={`${styles.section} ${styles.playersRoomSection}`}>
          <h2 className={styles.sectionTitle}>{t("games.impostor_lobby_matesID", "PLAYER IDENTIFICATION")}</h2>
        <div className={styles.playersList}>
          {players.map((p) => (
            <div key={p.socketId} className={styles.playerTag}>
              <span className={styles.dotIndicator} />
              <span className={styles.pName}>
                {p.name} {p.socketId === socket.id ? t("games.impostor_lobby_you_", "(YOU)") : ""}
              </span>
            </div>
          ))}
        </div>
        </div>

        {/* SOMENTE HOST VÊ AS CONFIGS */}
        {isHost && (
          <div className={styles.hostColumn}>
          {/* IMPOSTORES */}
          <div className={styles.section}>
            <div className={styles.counterRow}>
              <h2 className={styles.sectionTitle}>{t("games.impostor_lobby_numberOfImpostors", "NUMBER OF IMPOSTORS")}</h2>
              <div className={styles.counterControls}>
                <button
                  className={styles.countBtn}
                  onClick={() =>
                    setSelectImpostorNumbers((p) => Math.max(p - 1, 1))
                  }
                >
                  -
                </button>
                <span className={styles.countDisplay}>
                  {selectImpostorNumbers}
                </span>
                <button
                  className={styles.countBtn}
                  onClick={() =>
                    setSelectImpostorNumbers((p) =>
                      Math.min(p + 1, maxImpostors),
                    )
                  }
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* GRADE DE CONFIG */}
          <div className={styles.gridSettings}>
            {[
              {
                label: t("games.impostor_lobby_twoWords", "Two word mode"),
                state: twoGroups,
                fn: (e: any) => setTwoGroups(e.target.checked),
              },
              {
                label: t("games.impostor_lobby_whoStart", "Random player starts"),
                state: whoStart,
                fn: (e: any) => setWhoStart(e.target.checked),
              },
              {
                label: t("games.impostor_lobby_impostorStarts", "Impostor can start"),
                state: impostorCanStart,
                fn: (e: any) => setImpostorCanStart(e.target.checked),
              },
              {
                label: t("games.impostor_lobby_impostorHint", "Impostor gets a hint"),
                state: impostorHint,
                fn: (e: any) => setImpostorHint(e.target.checked),
              },
              {
                label: t("games.impostor_lobby_impostorCat", "Show only category"),
                state: impostorCat,
                fn: (e: any) => setImpostorCat(e.target.checked),
              },
              {
                label: t("games.impostor_lobby_impostorTrap", "Deceive impostor"),
                state: impostorTrap,
                fn: (e: any) => setImpostorTrap(e.target.checked),
              },
              {
                label: t("games.impostor_lobby_impostorUnion", "Impostors know each other"),
                state: impostorsUnited,
                fn: (e: any) => setImpostorsUnited(e.target.checked),
              },
            ].map((item, i) => (
              <label key={i} className={styles.checkboxLabel}>
                <span className={styles.checkText}>{item.label}</span>
                <div className={styles.switchWrapper}>
                  <input
                    type="checkbox"
                    className={styles.checkboxInput}
                    checked={item.state}
                    onChange={item.fn}
                  />
                  <span className={styles.switchSlider}></span>
                </div>
              </label>
            ))}
          </div>

          {/* CATEGORIAS */}
          <div className={styles.categorySection}>
            <button
              type="button"
              className={`${styles.categoryToggle} ${showCategories ? styles.active : ""}`}
              onClick={() => setShowCategories(!showCategories)}
            >
              {showCategories ? "-" : t("games.impostor_lobby_DBSelect", "SELECT CATEGORIES")}
            </button>

            {showCategories && (
              <CategoryGrid
                categories={categories}
                selectedCategories={categorie}
                onToggle={handleCategorie}
              />
            )}
          </div>

          {/* INICIAR */}
          <button
            className={styles.startButton}
            disabled={players.length < 3}
            onClick={startGame}
          >
            {t("games.impostor_lobby_startMission", "START MISSION")}
          </button>
          </div>
        )}
      </div>
    </div>
  );
}
