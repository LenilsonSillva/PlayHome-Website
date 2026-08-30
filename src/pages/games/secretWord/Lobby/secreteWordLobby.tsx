import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePlayers } from "../../../../contexts/contextHook";
import { getCategories, getWordDatabase } from "../../../../data/words";
import { useI18n } from "../../../../i18n";
import { CategoryGrid } from "../../../../components/CategoryGrid/CategoryGrid";
import type { CryptoConfig, CryptoMode } from "../GameLogistic/types";
import { loadGlobalUsedWords } from "../GameLogistic/wordStorage";
import styles from "./secreteLobby.module.css";

type Props = {
  mode: CryptoMode;
};

export function SecretWordLobby({ mode }: Props) {
  const navigate = useNavigate();
  const { players, addPlayer, removePlayer } = usePlayers();
  const { language, t } = useI18n();
  const categories = useMemo(() => getCategories(getWordDatabase(language)), [language]);

  const [teamCount, setTeamCount] = useState(2);
  const [assignmentMode, setAssignmentMode] = useState<"random" | "manual">("random");
  const [name, setName] = useState("");
  const [selectedTime, setSelectedTime] = useState(60);
  const [skipLimit, setSkipLimit] = useState(3);
  const [matchLimit, setMatchLimit] = useState(5);
  const [showCategories, setShowCategories] = useState(false);
  const [selectedCats, setSelectedCats] = useState<string[]>(categories);
  const [manualAssignments, setManualAssignments] = useState<Record<string, number>>({});

  const infiltrationTimes = [60, 90, 120];
  const interceptionTimes = [15, 30, 60];

  useEffect(() => {
    setSelectedTime(mode === "infiltration" ? 60 : 15);
  }, [mode]);

  useEffect(() => {
    setSelectedCats(categories);
  }, [categories]);

  useEffect(() => {
    const newAssignments = { ...manualAssignments };
    players.forEach((player) => {
      if (newAssignments[player.id] === undefined || newAssignments[player.id] >= teamCount) {
        newAssignments[player.id] = 0;
      }
    });
    setManualAssignments(newAssignments);
    // The assignment map intentionally follows the roster as players join/leave.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players, teamCount]);

  const handleAddPlayer = (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!name.trim() || players.length >= 20) return;
    addPlayer(name.trim());
    setName("");
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  };

  const maxPossibleTeams = Math.max(2, Math.floor(players.length / 2));
  const canStart = players.length >= 4 && players.length >= teamCount * 2;

  const handleStart = () => {
    if (selectedCats.length === 0) {
      alert(t("alerts.fillIn", "Select at least one category from the word bank."));
      return;
    }

    if (assignmentMode === "manual") {
      const teamCounts = new Array(teamCount).fill(0) as number[];
      players.forEach((player) => teamCounts[manualAssignments[player.id] ?? 0]++);
      if (teamCounts.some((count) => count < 2)) {
        alert(t("games.cryptography_alert_minPlayers", "Each group needs at least two players."));
        return;
      }
    }

    const config: CryptoConfig = {
      mode,
      teamCount,
      distributionType: assignmentMode,
      roundTime: selectedTime,
      wordLimit: matchLimit,
      skipLimit,
      categories: selectedCats,
      language,
    };

    navigate("/games/secretWord/game", {
      state: { config, manualAssignments, globalUsedWords: loadGlobalUsedWords() },
    });
  };

  return (
    <div className={styles.lobbyWrapper}>
      <div className={styles.lobbyHeader}>
        <div>
          <p className={styles.kicker}>{t("games.cryptography_phase_team_reveal", "MISSION SETUP")}</p>
          <h2>{t("games.cryptography_title", "CRYPTOGRAPHY")}</h2>
          <p className={styles.subcopy}>
            {mode === "infiltration"
              ? t("games.cryptography_infiltration_desc", "One operator receives a word and the team tries to guess it.")
              : t("games.cryptography_interception_desc", "Operators receive the same word and race to guess it first.")}
          </p>
        </div>
        <span className={styles.modeChip}>{mode === "infiltration" ? "⚡" : "⚔️"} {mode === "infiltration" ? t("games.cryptography_mode_infiltration", "INFILTRATION") : t("games.cryptography_mode_interception", "INTERCEPTION")}</span>
      </div>

      <div className={styles.lobbyGrid}>
        <section className={`${styles.section} ${styles.playersSection}`}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.sectionIndex}>01 / {t("games.cryptography_lobby_roster", "PLAYERS")}</p>
              <h3>{t("games.cryptography_lobby_crewmates", "PLAYERS")} <span>({players.length}/20)</span></h3>
            </div>
            <span className={styles.sectionIcon}>+</span>
          </div>
          <form className={styles.inputGroup} onSubmit={handleAddPlayer}>
            <input
              type="text"
              placeholder={t("games.cryptography_lobby_playerName", "Player name")}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={styles.textInput}
              maxLength={156}
            />
            <button type="submit" className={styles.addButton} disabled={players.length >= 20}>
              {t("games.cryptography_lobby_add", "ADD")}
            </button>
          </form>

          <div className={styles.playersList}>
            {players.length === 0 && <p className={styles.emptyState}>{t("games.cryptography_lobby_crewmates", "Add players to begin.")}</p>}
            {players.map((player, index) => (
              <div key={player.id} className={styles.playerTag}>
                <div className={styles.playerTagContent}>
                  <span className={styles.playerNumber}>{String(index + 1).padStart(2, "0")}</span>
                  <span className={styles.dotIndicator} />
                  <span className={styles.pName}>{player.name}</span>
                </div>
                <div className={styles.playerTagActions}>
                  {assignmentMode === "manual" && (
                    <select
                      className={styles.inlineSelect}
                      value={manualAssignments[player.id] ?? 0}
                      onChange={(event) => setManualAssignments({ ...manualAssignments, [player.id]: Number(event.target.value) })}
                      aria-label={`${t("games.cryptography_lobby_group", "Group")} ${player.name}`}
                    >
                      {Array.from({ length: teamCount }).map((_, groupIndex) => (
                        <option key={groupIndex} value={groupIndex}>{t("games.cryptography_lobby_group", "Group")} {groupIndex + 1}</option>
                      ))}
                    </select>
                  )}
                  <button type="button" onClick={() => removePlayer(player.id)} className={styles.removeBtn} aria-label={t("games.impostor_lobby_removeBtn", "Remove player")}>×</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={`${styles.section} ${styles.teamSection}`}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.sectionIndex}>02 / {t("games.cryptography_lobby_formation", "FORMATION")}</p>
              <h3>{t("games.cryptography_lobby_groupCount", "GROUPS")}</h3>
            </div>
            <div className={styles.counter}>
              <button type="button" className={styles.countBtn} onClick={() => setTeamCount(Math.max(2, teamCount - 1))}>−</button>
              <span>{teamCount}</span>
              <button type="button" className={styles.countBtn} onClick={() => setTeamCount(Math.min(maxPossibleTeams, teamCount + 1))} disabled={teamCount >= maxPossibleTeams}>＋</button>
            </div>
          </div>
          <div className={styles.segmentedControl}>
            <button type="button" className={assignmentMode === "random" ? styles.segActive : ""} onClick={() => setAssignmentMode("random")}>{t("games.cryptography_lobby_random", "RANDOM")}</button>
            <button type="button" className={assignmentMode === "manual" ? styles.segActive : ""} onClick={() => setAssignmentMode("manual")}>{t("games.cryptography_lobby_manual", "MANUAL")}</button>
          </div>
          <p className={styles.helper}>{t("games.cryptography_alert_minPlayers", "At least two players are needed per group.")}</p>
        </section>

        <section className={`${styles.section} ${styles.rulesSection}`}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.sectionIndex}>03 / {t("games.cryptography_lobby_rules", "RULES")}</p>
              <h3>{t("games.cryptography_lobby_timer", "MAX TIME")} &amp; {mode === "infiltration" ? t("games.cryptography_lobby_skipLimit", "SKIPS") : t("games.cryptography_lobby_wordLimit", "WORDS")}</h3>
            </div>
            <span className={styles.sectionIcon}>◷</span>
          </div>
          <div className={styles.ruleRows}>
            <div className={styles.ruleRow}>
              <span>{t("games.cryptography_lobby_timer", "MAX TIME")}</span>
              <div className={styles.timeOptions}>
                {(mode === "infiltration" ? infiltrationTimes : interceptionTimes).map((time) => (
                  <button type="button" key={time} className={selectedTime === time ? styles.timeActive : ""} onClick={() => setSelectedTime(time)}>{time}s</button>
                ))}
              </div>
            </div>
            <div className={styles.ruleRow}>
              <span>{mode === "infiltration" ? t("games.cryptography_lobby_skipLimit", "SKIPS") : t("games.cryptography_lobby_wordLimit", "WORDS")}</span>
              <div className={styles.timeOptions}>
                {(mode === "infiltration" ? [3, 5, 999] : [5, 10, 20]).map((value) => (
                  <button type="button" key={value} className={(mode === "infiltration" ? skipLimit : matchLimit) === value ? styles.timeActive : ""} onClick={() => mode === "infiltration" ? setSkipLimit(value) : setMatchLimit(value)}>{value === 999 ? "∞" : value}</button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.databaseSection}`}>
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.sectionIndex}>04 / {t("games.cryptography_lobby_wordBank", "WORD BANK")}</p>
              <h3>{t("games.cryptography_lobby_db", "DATABASE")} <span>{selectedCats.length}/{categories.length}</span></h3>
            </div>
            <button type="button" className={styles.databaseToggle} onClick={() => setShowCategories((open) => !open)}>{showCategories ? "-" : "＋"}</button>
          </div>
          <p className={styles.helper}>{t("site.officialBank", "Official PlayHome word bank")}</p>
          {showCategories && <CategoryGrid categories={categories} selectedCategories={selectedCats} onToggle={(category) => setSelectedCats((previous) => previous.includes(category) ? previous.filter((item) => item !== category) : [...previous, category])} />}
        </section>
      </div>

      <button type="button" className={styles.startBtn} disabled={!canStart} onClick={handleStart}>
        <span>{canStart ? t("games.cryptography_lobby_start", "START MISSION") : t("games.cryptography_alert_minPlayers", "MINIMUM 4 PLAYERS")}</span>
        <span aria-hidden="true">↗</span>
      </button>
    </div>
  );
}
