import type { CryptoView } from "../../../../../types/cryptoOnline";
import { TeamMembers } from "./shared";
import styles from "../onlineCrypto.module.css";
import { useI18n } from "../../../../../i18n";

type Props = {
  view: CryptoView;
  onSelectOperator: (teamId: string, playerId: string) => void;
  onRandomizeOperators: () => void;
  onSetStartingTeam: (teamIndex: number) => void;
  onBeginAction: () => void;
};

export function OnlineTeamReveal({
  view,
  onSelectOperator,
  onRandomizeOperators,
  onSetStartingTeam,
  onBeginAction,
}: Props) {
  const { t } = useI18n();
  const allOperatorsSet = view.teams.every((t) => t.operatorId != null);
  const isHost = view.controls.canBeginAction;
  const canChooseStartingTeam = view.controls.canSetStartingTeam;

  return (
    <div className={styles.container}>
      <header className={styles.phaseHeader}>
        <span className={styles.badge}>{t("games.cryptography_reveal_badge", "UNIT RECOGNITION")}</span>
        <h1>
          {t("games.cryptography_reveal_title", "FORMED GROUPS")}{" "}
          <span className={styles.cyan}>— {t("games.cryptography_reveal_roundLabel", "ROUND")} {view.roundNumber}</span>
        </h1>
      </header>

      <div className={styles.teamsGrid}>
        {view.teams.map((team, idx) => (
          <div
            key={team.id}
            className={`glass-panel ${styles.teamCard}`}
            style={{ borderTopColor: team.color } as React.CSSProperties}
          >
            <div className={styles.teamCardHeader}>
              <span className={styles.teamIndex}>0{idx + 1}</span>
              <h3>{team.name}</h3>
              {idx === view.startingTeamIndex && (
                <span className={styles.startingBadge}>🚀 {t("games.cryptography_reveal_starts", "STARTS THE ROUND")}</span>
              )}
              <span className={styles.teamScore}>{team.score} {t("site.points", "PTS")}</span>
            </div>

            <TeamMembers team={team} />

            <label className={styles.operatorLabel}>
              {t("games.cryptography_reveal_selectOperator", "OPERATOR (WHO GIVES HINTS):")}
              <select
                className={styles.operatorSelect}
                value={team.operatorId ?? ""}
                disabled={!team.canSetOperator}
                onChange={(e) => onSelectOperator(team.id, e.target.value)}
              >
                <option value="" disabled>
                  {team.canSetOperator
                    ? t("games.cryptography_reveal_select", "Select...")
                    : t("games.cryptography_reveal_selectedByHost", "Selected by the leader/host")}
                </option>
                {team.players
                  .filter(
                    (p) =>
                      p.connection === "online" || p.connection === "present",
                  )
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {p.connection === "present"
                        ? " 🏠"
                        : p.isSubHost
                          ? " 🎖️"
                          : ""}
                    </option>
                  ))}
              </select>
            </label>
          </div>
        ))}
      </div>

      {view.roundNumber > 1 && (
        <div
          className={styles.startingAutoNotice}
          style={{ borderColor: view.teams[view.startingTeamIndex]?.color }}
        >
          <span className={styles.startingAutoLabel}>{t("games.cryptography_reveal_starts", "AUTOMATIC START")}</span>
          <strong>
            {view.teams[view.startingTeamIndex]?.name ?? t("games.cryptography_result_teamWin", "Winning team")} {t("games.cryptography_reveal_starts", "starts")}
          </strong>
          <small>{t("site.previousWinner", "Winner of the previous round")}</small>
        </div>
      )}

      <footer className={styles.phaseFooter}>
        {isHost ? (
          <>
            {view.roundNumber === 1 && canChooseStartingTeam && (
              <div className={styles.startingPicker}>
                <span>{t("games.cryptography_reveal_whoStartsFirst", "WHO STARTS THE FIRST ROUND:")}</span>
                {view.teams.map((t, idx) => (
                  <button
                    key={t.id}
                    className={
                      view.startingTeamIndex === idx ? styles.startingActive : ""
                    }
                    style={{ borderColor: t.color }}
                    onClick={() => onSetStartingTeam(idx)}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            )}

            <div className={styles.footerButtons}>
              <button
                className={styles.secondaryBtn}
                onClick={onRandomizeOperators}
              >
                🎲 {t("games.cryptography_reveal_randomOperators", "RANDOM OPERATORS")}
              </button>
              <button
                className={styles.primaryBtn}
                onClick={onBeginAction}
                disabled={!allOperatorsSet}
              >
                {allOperatorsSet
                  ? t("games.cryptography_reveal_confirmBtn", "START ACTION 🚀")
                  : t("games.cryptography_reveal_missingOperators", "OPERATORS MISSING")}
              </button>
            </div>
          </>
        ) : (
          <p className={styles.waitingNote}>
            ⏳ {t("games.cryptography_reveal_waitingHost", "Waiting for the host to define operators and start the action...")}
          </p>
        )}
      </footer>
    </div>
  );
}
