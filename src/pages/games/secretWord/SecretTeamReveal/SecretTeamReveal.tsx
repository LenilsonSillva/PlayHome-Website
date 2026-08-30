import type { CryptoGameState } from "../GameLogistic/types";
import { useI18n } from "../../../../i18n";
import styles from "./teamReveal.module.css";

type Props = {
  data: CryptoGameState;
  onSelectOperator: (teamId: string, playerId: string) => void;
  onSetStartingTeam: (teamIndex: number) => void;
  onRandomizeOperators: () => void;
  onConfirm: () => void;
  onEdit: () => void;
};

// RECONHECIMENTO DE UNIDADES — mesmo fluxo do PlayHome-RN:
// escolha do operador por group, sorteio geral, definição de quem
// inicia a rodada (1ª rodada) e validação antes de começar.
export function SecretTeamReveal({
  data,
  onSelectOperator,
  onSetStartingTeam,
  onRandomizeOperators,
  onConfirm,
  onEdit,
}: Props) {
  const { t } = useI18n();

  const handleConfirm = () => {
    const missingOperators = data.teams.some((t) => !t.operatorId);
    if (missingOperators) {
      alert(
        t("games.cryptography_alert_emptyTeam", "Every group needs an operator before continuing."),
      );
      return;
    }
    onConfirm();
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.badge}>{t("games.cryptography_reveal_badge", "UNIT RECOGNITION")}</div>
        <h2 className={styles.title}>{t("games.cryptography_reveal_title", "FORMED GROUPS")}</h2>
        <p className={styles.roundTag}>{t("games.cryptography_reveal_roundLabel", "ROUND")} {data.roundNumber}</p>
      </header>

      {/* 🎲 GENERAL OPERATOR DRAW */}
      <button className={styles.randomAllBtn} onClick={onRandomizeOperators}>
        🎲 {t("games.cryptography_reveal_randomBtn", "RANDOM OPERATORS")}
      </button>

      {data.roundNumber > 1 && (
        <div
          className={styles.startingAutoNotice}
          style={{
            "--team-color": data.teams[data.currentTeamIndex]?.color,
          } as React.CSSProperties}
        >
          <span className={styles.startingAutoLabel}>{t("games.cryptography_reveal_starts", "AUTOMATIC START")}</span>
          <strong>
            {data.teams[data.currentTeamIndex]?.name ?? t("games.cryptography_result_teamWin", "Winning team")} {t("games.cryptography_reveal_starts", "starts")}
          </strong>
          <small>{t("site.previousWinner", "Winner of the previous round")}</small>
        </div>
      )}

      <div className={styles.teamsGrid}>
        {data.teams.map((team, idx) => (
          <div
            key={team.id}
            className={`glass-panel ${styles.teamCard}`}
            style={{ "--team-color": team.color } as React.CSSProperties}
          >
            <div className={styles.teamHeader}>
              <span className={styles.teamIndex}>0{idx + 1}</span>
              <h3 className={styles.teamName}>{team.name}</h3>

              {/* ⭐ QUEM INICIA A RODADA (apenas na 1ª rodada) */}
              {data.roundNumber === 1 && (
                <button
                  className={`${styles.startTeamBtn} ${
                    data.currentTeamIndex === idx ? styles.startTeamActive : ""
                  }`}
                  onClick={() => onSetStartingTeam(idx)}
                >
                  {data.currentTeamIndex === idx
                    ? `⭐ ${t("games.cryptography_reveal_starts", "STARTS THE ROUND")}`
                    : t("games.cryptography_reveal_setFirst", "SET AS FIRST")}
                </button>
              )}
            </div>

            <div className={styles.membersList}>
              <p className={styles.roleLabel}>
                {t("games.cryptography_reveal_selectOperator", "SELECT OPERATOR (WHO GIVES HINTS):")}
              </p>
              {team.players.map((player) => {
                const isOperator = team.operatorId === player.id;
                return (
                  <button
                    key={player.id}
                    className={`${styles.memberBtn} ${isOperator ? styles.activeOperator : ""}`}
                    onClick={() => onSelectOperator(team.id, player.id)}
                  >
                    <div className={styles.memberInfo}>
                      <span
                        className={styles.statusDot}
                        style={{ background: player.color }}
                      />
                      {player.name}
                    </div>
                    {isOperator && (
                      <span className={styles.operatorBadge}>{t("games.cryptography_reveal_operator", "OPERATOR")}</span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              className={styles.randomSubBtn}
              onClick={() => {
                const randomPlayer =
                  team.players[
                    Math.floor(Math.random() * team.players.length)
                  ];
                if (randomPlayer) onSelectOperator(team.id, randomPlayer.id);
              }}
            >
              🎲 {t("games.cryptography_reveal_randomBtn", "RANDOM PLAYER")}
            </button>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <p className={styles.instruction}>
          {t("games.cryptography_reveal_instruction", "Define each group's operator before continuing.")}
        </p>

        <div className={styles.buttonGroup}>
          <button className={styles.editBtn} onClick={onEdit}>
            ⚙️ {t("games.cryptography_reveal_editBtn", "EDIT GROUPS")}
          </button>
          <button className={styles.confirmBtn} onClick={handleConfirm}>
            {t("games.cryptography_reveal_confirmBtn", "START ACTION 🚀")}
          </button>
        </div>
      </div>
    </div>
  );
}
