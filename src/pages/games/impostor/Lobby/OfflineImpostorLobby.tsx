import { useEffect, useMemo, useState } from "react";
import { usePlayers } from "../../../../contexts/contextHook";
import { getImpostorCount, initializeGame } from "../GameLogistic/gameLogistic";
import { useNavigate } from "react-router-dom";
import { getCategories, getWordDatabase } from "../../../../data/words";
import { useI18n } from "../../../../i18n";
import { CategoryGrid } from "../../../../components/CategoryGrid/CategoryGrid";
import styles from "./offlineLobbyStyle.module.css";
import type { GameRouteState } from "../GameLogistic/types";

export function OfflineImpostorLobby() {
  const navigate = useNavigate();
  const { players, addPlayer, removePlayer } = usePlayers();
  const { language, t } = useI18n();
  const categories = useMemo(() => getCategories(getWordDatabase(language)), [language]);
  const [name, setName] = useState("");
  const maxImpostors = getImpostorCount(players.length);
  const [selectImpostorNumbers, setSelectImpostorNumbers] = useState(1);
  const [twoGroups, setTwoGroups] = useState(false);
  const [categorie, setCategorie] = useState<string[]>(categories);
  const [impostorHint, setImpostorHint] = useState(false);
  const [impostorTrap, setImpostorTrap] = useState(false);
  const [impostorCat, setImpostorCat] = useState(false);
  const [impostorsUnited, setImpostorsUnited] = useState(false);
  const [whoStart, setWhoStart] = useState(true);
  const [impostorCanStart, setImpostorCanStart] = useState(true);
  const [showCategories, setShowCategories] = useState(false);

  useEffect(() => {
    setSelectImpostorNumbers((current) => Math.min(current, maxImpostors));
  }, [maxImpostors]);

  useEffect(() => {
    setCategorie(categories);
  }, [categories]);

  function handleAddNamePlayer() {
    if (!name.trim()) return;
    addPlayer(name.trim());
    setName("");
  }

  function startGame() {
    const allData = initializeGame(
      players,
      selectImpostorNumbers,
      twoGroups,
      impostorHint,
      categorie,
      whoStart,
      impostorCanStart,
      impostorTrap,
      impostorCat,
      impostorsUnited,
      [],
      [],
      getWordDatabase(language),
    );

    navigate("/games/impostor/offline", {
      state: {
        data: {
          players: allData.allPlayers,
          howManyImpostors: allData.howManyImpostors,
          impostorCanStart: allData.impostorCanStart,
          impostorHint: allData.impostorHasHint,
          impostorTrap: allData.impostorTrap,
          impostorCat: allData.impostorCat,
          impostorsUnited: allData.impostorsUnited,
          selectedCategories: allData.selectedCategories,
          twoWordsMode: allData.twoWordsMode,
          whoStart: allData.whoStart,
          phase: "reveal",
          language,
        },
      } satisfies GameRouteState,
    });
  }

  const settingItems = [
    { label: t("games.impostor_lobby_twoWords", "Two word mode"), state: twoGroups, set: setTwoGroups, detail: t("games.impostor_lobby_twoWordsSub", "Split the players into two word groups.") },
    { label: t("games.impostor_lobby_whoStart", "Random player starts"), state: whoStart, set: setWhoStart, detail: t("games.impostor_lobby_whoStartSub", "The system chooses who starts.") },
    { label: t("games.impostor_lobby_impostorStarts", "Impostor can start"), state: impostorCanStart, set: setImpostorCanStart, detail: t("games.impostor_lobby_impostorStartsSub", "Allow the impostor to start.") },
    { label: t("games.impostor_lobby_impostorHint", "Impostor gets a hint"), state: impostorHint, set: setImpostorHint, detail: t("games.impostor_lobby_impostorHintSub", "Show a hint to the impostor.") },
    { label: t("games.impostor_lobby_impostorCat", "Show only category"), state: impostorCat, set: setImpostorCat, detail: t("games.impostor_lobby_impostorCatSub", "Give the impostor the category only.") },
    { label: t("games.impostor_lobby_impostorTrap", "Deceive impostor"), state: impostorTrap, set: setImpostorTrap, detail: t("games.impostor_lobby_impostorTrapSub", "There is a 50% chance of a false hint.") },
    { label: t("games.impostor_lobby_impostorUnion", "Impostors know each other"), state: impostorsUnited, set: setImpostorsUnited, detail: t("games.impostor_lobby_unionSub", "Impostors recognize one another at the start.") },
  ];

  return (
    <div className={styles.lobbyWrapper}>
      <div className={styles.lobbyHeader}>
        <div>
          <p className={styles.kicker}>{t("games.impostor_lobby_settingsTitle", "MISSION SETUP")}</p>
          <h2>{t("games.impostor_title", "IMPOSTOR")}</h2>
          <p className={styles.subtitle}>{t("games.impostor_desc", "Find the hidden impostor before it is too late.")}</p>
        </div>
        <span className={styles.modeChip}>⌂ {t("site.localMode", "LOCAL GAME")}</span>
      </div>

      <div className={styles.lobbyGrid}>
        <section className={`${styles.section} ${styles.playersSection}`}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.sectionIndex}>01 / {t("games.impostor_lobby_rosterLabel", "ROSTER")}</p>
              <h3>{t("games.impostor_lobby_matesID", "PLAYER IDENTIFICATION")} <span>({players.length}/20)</span></h3>
            </div>
            <span className={styles.sectionIcon}>+</span>
          </div>
          <div className={styles.inputGroup}>
            <input
              type="text"
              placeholder={t("games.impostor_lobby_playerName", "Player name")}
              className={styles.textInput}
              value={name}
              maxLength={15}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter") handleAddNamePlayer(); }}
            />
            <button type="button" onClick={handleAddNamePlayer} className={styles.addButton}>{t("games.cryptography_lobby_add", "ADD")}</button>
          </div>
          <div className={styles.playersList}>
            {players.length === 0 && <p className={styles.emptyState}>{t("games.impostor_lobby_playerName", "Add players to begin.")}</p>}
            {players.map((player, index) => (
              <div key={player.id} className={styles.playerTag}>
                <span className={styles.playerNumber}>{String(index + 1).padStart(2, "0")}</span>
                <span className={styles.dotIndicator} />
                <span className={styles.pName}>{player.name}</span>
                <button type="button" className={styles.removeBtn} onClick={() => removePlayer(player.id)} aria-label={t("games.impostor_lobby_removeBtn", "Remove player")}>×</button>
              </div>
            ))}
          </div>
        </section>

        <section className={`${styles.section} ${styles.impostorSection}`}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.sectionIndex}>02 / {t("games.impostor_lobby_threatLabel", "THREAT LEVEL")}</p>
              <h3>{t("games.impostor_lobby_numberOfImpostors", "NUMBER OF IMPOSTORS")}</h3>
            </div>
            <span className={styles.sectionIcon}>!</span>
          </div>
          <div className={styles.counter}>
            <button type="button" className={styles.countBtn} onClick={() => setSelectImpostorNumbers((value) => Math.max(value - 1, 1))}>−</button>
            <strong>{selectImpostorNumbers}</strong>
            <button type="button" className={styles.countBtn} onClick={() => setSelectImpostorNumbers((value) => Math.min(value + 1, maxImpostors))} disabled={selectImpostorNumbers >= maxImpostors}>＋</button>
          </div>
          <p className={styles.helper}>{t("games.impostor_lobby_impostorsLimit", "Current limit: ")}{maxImpostors}</p>
        </section>

        <section className={`${styles.section} ${styles.rulesSection}`}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.sectionIndex}>03 / {t("games.impostor_lobby_rulesetLabel", "RULESET")}</p>
              <h3>{t("games.impostor_lobby_gameOpt", "GAME OPTIONS")}</h3>
            </div>
            <span className={styles.sectionIcon}>◷</span>
          </div>
          <div className={styles.settingsList}>
            {settingItems.map((item) => (
              <label key={item.label} className={styles.settingRow}>
                <span><strong>{item.label}</strong><small>{item.detail}</small></span>
                <input type="checkbox" checked={item.state} onChange={(event) => item.set(event.target.checked)} />
                <i aria-hidden="true" />
              </label>
            ))}
          </div>
        </section>

        <section className={`${styles.section} ${styles.databaseSection}`}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.sectionIndex}>04 / {t("games.impostor_lobby_wordBankLabel", "WORD BANK")}</p>
              <h3>{t("games.impostor_lobby_DBSelect", "SELECT CATEGORIES")} <span>{categorie.length}/{categories.length}</span></h3>
            </div>
            <button type="button" className={styles.databaseToggle} onClick={() => setShowCategories((open) => !open)}>{showCategories ? "-" : "＋"}</button>
          </div>
          <p className={styles.helper}>{t("site.officialBank", "Official PlayHome bank")}</p>
          {showCategories && <CategoryGrid categories={categories} selectedCategories={categorie} onToggle={(category) => setCategorie((previous) => previous.includes(category) ? previous.filter((item) => item !== category) : [...previous, category])} />}
        </section>
      </div>

      <button type="button" onClick={startGame} className={styles.startButton} disabled={players.length < 3}>
        <span>{t("games.impostor_lobby_startMission", "START MISSION")}</span>
        <span aria-hidden="true">↗</span>
      </button>
      {players.length < 3 && <p className={styles.minimumNote}>{t("games.impostor_lobby_startMinimum", "Minimum 3 players")}</p>}
    </div>
  );
}
