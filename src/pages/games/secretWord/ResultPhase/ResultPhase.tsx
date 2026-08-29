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

type Props = {
  data: CryptoGameState;
  onNextRound: () => void;
  onReassign: (wordIndex: number, newWinnerIndex: number | null) => void;
};

export function ResultPhase({ data, onNextRound, onReassign }: Props) {
  const navigate = useNavigate();

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
        <div className={styles.badge}>DADOS DESCRIPTOGRAFADOS</div>
        <h1 className={styles.title}>
          RANKING DE <span>MISSÃO</span>
        </h1>
        <p className={styles.roundLabel}>RODADA {data.roundNumber}</p>
      </header>

      {/* BANNER DE VITÓRIA DA RODADA */}
      <div className={`glass-panel ${styles.victoryBanner}`}>
        <h2 className={styles.victoryTitle}>
          {roundWinners.length > 1
            ? "EMPATE TÉCNICO DA RODADA"
            : "VENCEDOR DA RODADA"}
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
          +{winnerHits} {winnerHits === 1 ? "ACERTO" : "ACERTOS"}
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
          PRÓXIMA MISSÃO 🚀
        </button>
        <button
          className={styles.lobbyBtn}
          onClick={() => {
            if (window.confirm("Sair para o lobby? O jogo será encerrado.")) {
              navigate("/games/secretWord/lobby");
            }
          }}
        >
          LOBBY ⚙️
        </button>
      </div>
    </div>
  );
}
