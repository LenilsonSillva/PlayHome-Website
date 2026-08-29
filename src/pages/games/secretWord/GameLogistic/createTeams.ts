import { TEAM_NAMES, TEAM_COLORS, PLAYER_COLORS } from "./constants";
import type { CryptoPlayer, CryptoTeam } from "./types";

function shuffleArray<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Porta do createTeams do PlayHome-RN: distribuição aleatória (cartas de
// baralho) ou manual, com cores únicas de jogador.
export function createTeams(
  players: CryptoPlayer[],
  numberOfTeams: number,
  distributionType: "random" | "manual",
  manualAssignments?: Record<string, number>, // { "idDoJogador": 0 (index do time) }
): CryptoTeam[] {
  // 1. Inicializa os esquadrões vazios
  const teams: CryptoTeam[] = Array.from({ length: numberOfTeams }).map(
    (_, i) => ({
      id: `team-${i}`,
      name: TEAM_NAMES[i],
      color: TEAM_COLORS[i],
      operatorId: null,
      players: [],
      score: 0,
      roundScore: 0,
      wordsGuessed: [],
      roundErrors: 0,
      totalErrors: 0,
      roundTimeSpent: 0,
      totalTimeSpent: 0,
      operatorStats: {},
      manualAdjustmentCount: 0,
      manualAdjustmentAddCount: 0,
      manualAdjustmentRemoveCount: 0,
    }),
  );

  // 2. Atribui cores únicas e aleatórias aos jogadores
  const shuffledColors = shuffleArray([...PLAYER_COLORS]);
  const coloredPlayers = players.map((p, index) => ({
    ...p,
    color: shuffledColors[index % shuffledColors.length],
  }));

  // 3. Distribui os jogadores (já com suas cores)
  if (distributionType === "random") {
    const shuffled = shuffleArray([...coloredPlayers]);
    shuffled.forEach((player, index) => {
      const teamIndex = index % numberOfTeams; // Distribuição igualitária
      teams[teamIndex].players.push({ ...player, teamId: teams[teamIndex].id });
    });
  } else if (manualAssignments) {
    coloredPlayers.forEach((player) => {
      const teamIndex = manualAssignments[player.id] || 0; // Fallback pro time 0
      teams[teamIndex].players.push({ ...player, teamId: teams[teamIndex].id });
    });
  }

  return teams;
}
