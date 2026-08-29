// Ranking oficial do Criptografia (porta do PlayHome-RN):
// desempate matemático Acertos -> Eficiência -> Tempo médio.
// Usado pelo resultado offline E pelo resultado online.

export interface RankingStats {
  hits: number;
  errors: number;
  efficiency: number; // %
  avgTime: number; // segundos com 1 casa decimal
}

export interface RankableTeam {
  id: string;
  name: string;
  color: string;
  score: number;
  roundScore: number;
  wordsGuessed: string[];
  roundErrors: number;
  totalErrors: number;
  roundTimeSpent: number;
  totalTimeSpent: number;
  operatorStats: Record<string, number>;
  players: { id: string; name: string; emoji?: string }[];
}

export function getTeamStats(
  team: RankableTeam,
  type: "round" | "global",
): RankingStats {
  const hits = type === "round" ? team.roundScore || 0 : team.score || 0;
  const errors = type === "round" ? team.roundErrors || 0 : team.totalErrors || 0;
  const timeSpent =
    type === "round" ? team.roundTimeSpent || 0 : team.totalTimeSpent || 0;

  const totalAttempts = hits + errors;
  const efficiency =
    totalAttempts > 0 ? Math.round((hits / totalAttempts) * 100) : 0;

  // O segredo do empate: ms viram segundos com 1 casa decimal.
  const rawAvgTime = hits > 0 ? timeSpent / hits : 0;
  const avgTime = Number((rawAvgTime / 1000).toFixed(1));

  return { hits, errors, efficiency, avgTime };
}

export function compareTeams(
  a: RankableTeam,
  b: RankableTeam,
  type: "round" | "global",
): number {
  const statsA = getTeamStats(a, type);
  const statsB = getTeamStats(b, type);

  // 1. Mais acertos ganha
  if (statsA.hits !== statsB.hits) return statsB.hits - statsA.hits;
  // 2. Maior eficiência ganha
  if (statsA.efficiency !== statsB.efficiency)
    return statsB.efficiency - statsA.efficiency;
  // 3. Menor tempo médio ganha
  if (statsA.avgTime !== statsB.avgTime) return statsA.avgTime - statsB.avgTime;

  return 0; // Empate absoluto
}

export function sortTeamsByRanking<T extends RankableTeam>(
  teams: T[],
  type: "round" | "global",
): T[] {
  return [...teams].sort((a, b) => compareTeams(a, b, type));
}

// Vencedor(es) da rodada (empates têm exatamente os mesmos stats)
export function getRoundWinners<T extends RankableTeam>(teams: T[]): T[] {
  const sorted = sortTeamsByRanking(teams, "round");
  if (sorted.length === 0) return [];
  const topStats = getTeamStats(sorted[0], "round");
  return sorted.filter((t) => {
    const stats = getTeamStats(t, "round");
    return (
      stats.hits === topStats.hits &&
      stats.efficiency === topStats.efficiency &&
      stats.avgTime === topStats.avgTime
    );
  });
}

// MVP do time (operador com mais palavras na rodada)
export function getTeamMvp(team: RankableTeam) {
  if (!team.operatorStats) return null;
  let bestOpId: string | null = null;
  let maxWords = 0;

  Object.entries(team.operatorStats).forEach(([playerId, words]) => {
    if (words > maxWords) {
      maxWords = words;
      bestOpId = playerId;
    }
  });

  if (!bestOpId || maxWords === 0) return null;
  const player = team.players.find((p) => p.id === bestOpId);
  return player ? { player, words: maxWords } : null;
}
