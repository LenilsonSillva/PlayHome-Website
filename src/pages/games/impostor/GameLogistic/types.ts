import type { GlobalPlayer } from "../../../../types/player";

export type ImpostorPlayer = GlobalPlayer & {
  isImpostor: boolean;
  isAlive: boolean;
  word: string | null;
  vote?: string;
  hint?: string;
  score: number;
  emoji: string;
  color: string;
  globalScore: number;
};

export type ImpostorGameState = {
  players: ImpostorPlayer[];
  phase: "reveal" | "discussion" | "voting" | "elimination" | "result";
};

export type GameData = {
  allPlayers: ImpostorPlayer[];
  howManyImpostors: number;
  twoWordsMode: boolean;
  impostorHasHint: boolean;
  impostorTrap: boolean;
  impostorCat: boolean;
  impostorsUnited: boolean;
  selectedCategories: string[];
  whoStart?: string;
  impostorCanStart: boolean;
};

export type GameRouteState = {
  data: {
    players: ImpostorPlayer[];
    howManyImpostors: number;
    impostorCanStart: boolean;
    impostorHint: boolean;
    impostorTrap: boolean;
    impostorCat: boolean;
    impostorsUnited: boolean;
    selectedCategories: string[];
    twoWordsMode: boolean;
    whoStart: string | undefined;
    phase: ImpostorGameState["phase"];
    isHost?: boolean;
    roomCode?: string;
    language?: string;
  };
};
