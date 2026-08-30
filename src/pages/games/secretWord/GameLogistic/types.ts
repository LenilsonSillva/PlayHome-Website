import type { GlobalPlayer } from "../../../../types/player";

// Tipos do Criptografia offline — espelham o PlayHome-RN
// (src/games/cryptography/types/game.ts) para manter paridade de regras.

export type CryptoMode = "infiltration" | "interception";

export type CryptoPhase =
  | "team-reveal"
  | "infiltration-action"
  | "interception-action"
  | "round-result";

export interface CryptoPlayer extends GlobalPlayer {
  teamId?: string;
  color?: string;
}

export interface CryptoTeam {
  id: string;
  name: string;
  color: string;
  operatorId: string | null; // Null até ser escolhido no TeamReveal
  players: CryptoPlayer[];
  score: number;
  roundScore: number;
  wordsGuessed: string[];
  roundErrors: number;
  totalErrors: number; // Soma de pulos e erros
  roundTimeSpent: number; // Milissegundos
  totalTimeSpent: number; // Milissegundos
  operatorStats: Record<string, number>; // Ex: { "id_do_lucas": 14 }
  manualAdjustmentCount: number;
  manualAdjustmentAddCount: number;
  manualAdjustmentRemoveCount: number;
}

export interface CryptoConfig {
  mode: CryptoMode;
  teamCount: number;
  distributionType: "random" | "manual";
  roundTime: number; // Infiltration (60, 90, 120) ou Interception (15, 30, 60)
  wordLimit: number; // Interception (5, 10, 20)
  skipLimit: number; // Infiltration (3, 5, 999)
  categories: string[];
  /** Locale frozen when the offline match starts, matching the online backend contract. */
  language?: string;
}

export interface CryptoRoundHistoryItem {
  word: string;
  winnerTeamIndex: number | null;
  ownerTeamIndex?: number | null;
}

export interface CryptoGameState {
  config: CryptoConfig;
  phase: CryptoPhase;
  teams: CryptoTeam[];
  currentTeamIndex: number;
  startingTeamIndex: number;
  currentWord: string | null;
  usedWords: string[];
  roundNumber: number;
  currentMatchIndex: number; // Contagem de palavras do modo Interception
  skipsLeft: number; // Controle de pulos do modo Infiltration
  roundEndTime?: number; // Timestamp de fim do turno (timer seguro)
  lastActionTime?: number; // Hora em que a palavra apareceu na tela
  roundHistory: CryptoRoundHistoryItem[];
  /** Frozen word bank for the whole match, just like the RN app. */
  wordDatabase: import("../../../../data/words").WordData[];
}

// Para o State do React Router
export interface CryptoRouteState {
  config: CryptoConfig;
  manualAssignments?: Record<string, number>;
  globalUsedWords?: string[];
}
