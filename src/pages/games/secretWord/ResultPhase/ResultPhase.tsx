import { useNavigate } from "react-router-dom";
import type { CryptoGameState } from "../GameLogistic/types";
import { getTeamAdjustmentLimit } from "../GameLogistic/cryptoGameReducer";
import {
  getRoundWinners,
  getTeamStats,
  sortTeamsByRanking,
} from "../components/ranking";
import { ResultCard } from "../components/ResultCard";
import { RoundAudit } from "../components/RoundAudit";
import styles from "./resultPhase.module.css";
import { useI18n } from "../../../../i18n";

type Props = {
  data: CryptoGameState;
  onNextRound: () => void;
  onReassign: (wordIndex: number, newWinnerIndex: number | null) => void;
};

export function ResultPhase({ data, onNextRound, onReassign }: Props) {
  const navigate = useNavigate();
  const { t } = useI18n();

  // 🏆 Vencedor(es) da rodada (desempate: acertos -> eficiência -> tempo)
  const roundWinners = getRoundWinners(data.teams);

  // Ranking geral ordenado pelo desempate oficial
  const sortedTeams = sortTeamsByRanking(data.teams, "global");

  // Metadados de limite para a auditoria (regra do RN)
  const teamMeta = data.teams.map((t) => ({
    addUsed: t.manualAdjustmentAddCount ?? 0,
    removeUsed: t.manualAdjustmentRemoveCount ?? 0,
    limit: getTeamAdjustmentLimit(data.config, t),
  }));

  const winnerHits = roundWinners.length > 0
    ? getTeamStats(roundWinners[0], "round").hits
    : 0;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.badge}>{t("games.cryptography_result_badge", "DECRYPTED DATA")}</div>
        <h1 className={styles.title}>
          {t("games.cryptography_result_title", "MISSION RANKING")}
        </h1>
        <p className={styles.roundLabel}>{t("games.cryptography_result_round", "ROUND")} {data.roundNumber}</p>
      </header>

      {/* BANNER DE VITÓRIA DA RODADA */}
      <div className={`glass-panel ${styles.victoryBanner}`}>
        <h2 className={styles.victoryTitle}>
          {roundWinners.length > 1
            ? t("games.cryptography_result_tie", "ROUND TIE")
            : t("games.cryptography_result_teamWin", "FEATURED TEAM")}
        </h2>
        <div className={styles.victoryNames}>
          {roundWinners.map((w, idx) => (
            <span
              key={w.id}
              className={styles.victoryName}
              style={{ color: w.color }}
            >
              {w.name.toUpperCase()}
              {idx < roundWinners.length - 1 ? " & " : ""}
            </span>
          ))}
        </div>
        <p className={styles.victoryHits}>
          +{winnerHits} {winnerHits === 1 ? t("games.cryptography_result_hits", "HIT") : t("games.cryptography_result_hits", "HITS")}
        </p>
      </div>

      {/* RANKING GERAL */}
      <div className={styles.podium}>
        {sortedTeams.map((team, index) => (
          <ResultCard
            key={team.id}
            team={team}
            rank={index + 1}
            isWinner={index === 0}
          />
        ))}
      </div>

      {/* AUDITORIA DA RODADA */}
      <RoundAudit
        items={data.roundHistory}
        teams={data.teams}
        teamMeta={teamMeta}
        onReassign={onReassign}
      />

      <div className={styles.actions}>
        <button className={styles.nextBtn} onClick={onNextRound}>
          {t("games.cryptography_result_newRound", "NEW ROUND 🚀")}
        </button>
        <button
          className={styles.lobbyBtn}
          onClick={() => {
            if (window.confirm(t("alerts.cryptography_leaveToLobby", "Leave for the lobby? The match will end."))) {
              navigate("/games/secretWord/lobby");
            }
          }}
        >
          {t("games.cryptography_result_lobby", "BACK TO LOBBY ⚙️")}
        </button>
      </div>
    </div>
  );
}
