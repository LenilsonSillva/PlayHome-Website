import { useState, type ReactNode } from "react";
import { getTeamStats, getTeamMvp, type RankableTeam } from "./ranking";
import styles from "./resultCard.module.css";

// Card de relatório do esquadrão — compartilhado entre o resultado offline
// e o online. Porta o TeamReportCard do PlayHome-RN (stats da rodada + MVP).

type ResultCardProps = {
  team: RankableTeam;
  rank: number;
  isWinner: boolean;
  members?: ReactNode; // nomes/integrantes (offline: texto; online: chips)
};

export function ResultCard({
  team,
  rank,
  isWinner,
  members,
}: ResultCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  const round = getTeamStats(team, "round");
  const mvp = getTeamMvp(team);

  // Palavras da rodada atual (as últimas N = acertos da rodada)
  const roundHits = team.roundScore || 0;
  const splitIndex = Math.max(0, team.wordsGuessed.length - roundHits);
  const currentRoundWords = team.wordsGuessed.slice(splitIndex);

  return (
    <div
      className={`glass-panel ${styles.resultCard} ${isWinner ? styles.winnerCard : ""}`}
      style={{ borderLeftColor: team.color } as React.CSSProperties}
    >
      <span className={styles.rankBadge}>{rank}º</span>

      <div className={styles.cardHeader}>
        <div style={{ minWidth: 0 }}>
          <h3 className={styles.teamName} style={{ color: team.color }}>
            {team.name}
          </h3>
          {members ?? (
            <p className={styles.members}>
              {team.players.map((p) => p.name).join(", ")}
            </p>
          )}
        </div>
        <div className={styles.totalBox} style={{ borderColor: team.color }}>
          <span className={styles.totalLabel}>TOTAL</span>
          <span className={styles.totalValue}>{team.score}</span>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>ACERTOS</span>
          <span className={styles.statValue} style={{ color: "var(--success)" }}>
            {round.hits}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>ERROS</span>
          <span
            className={styles.statValue}
            style={{ color: "var(--danger-neon)" }}
          >
            {round.errors}
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>EFICIÊNCIA</span>
          <span
            className={styles.statValue}
            style={{ color: "var(--tech-cyan)" }}
          >
            {round.efficiency}%
          </span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>TEMPO MÉDIO</span>
          <span className={styles.statValue} style={{ color: "var(--gray-200)" }}>
            {round.avgTime}s
          </span>
        </div>
      </div>

      {mvp && (
        <p className={styles.mvpLine}>
          ⭐ MELHOR OPERADOR DA RODADA: {mvp.player.name} ({mvp.words}{" "}
          {mvp.words === 1 ? "acerto" : "acertos"})
        </p>
      )}

      <button
        className={styles.wordsToggle}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {isOpen
          ? "OCULTAR ACERTOS"
          : `VER ${currentRoundWords.length} ACERTOS DA RODADA`}
      </button>

      {isOpen && (
        <div className={styles.wordsLog}>
          {currentRoundWords.length > 0 ? (
            currentRoundWords.map((word, i) => (
              <span key={i} className={styles.wordTag}>
                {word}
              </span>
            ))
          ) : (
            <span className={styles.noWords}>Nenhum sinal interceptado.</span>
          )}
        </div>
      )}
    </div>
  );
}
