import { createTeams } from "./createTeams";
import { getUniqueWord } from "./wordSelector";
import type { WordData } from "../../../../data/words";
import type {
  CryptoConfig,
  CryptoGameState,
  CryptoPlayer,
  CryptoTeam,
} from "./types";

// ============================================================
// Reducer do Criptografia offline — porta 1:1 dos reducers do
// PlayHome-RN (commonReducer + infiltrationReducer +
// interceptionReducer). O servidor online usa as mesmas regras.
// ============================================================

export type GameAction =
  // Ações comuns
  | {
      type: "START_GAME";
      players: CryptoPlayer[];
      config: CryptoConfig;
      manualAssignments?: Record<string, number>;
      globalUsedWords?: string[];
      wordDatabase?: WordData[];
    }
  | { type: "SET_OPERATOR"; teamId: string; playerId: string }
  | { type: "SET_STARTING_TEAM"; teamIndex: number }
  | { type: "SET_RANDOM_OPERATORS" }
  | { type: "BEGIN_ACTION_PHASE" }
  | { type: "START_TIMER" }
  | { type: "REROLL_WORD" }
  | { type: "REASSIGN_WORD"; wordIndex: number; newWinnerIndex: number | null }
  | { type: "NEXT_ROUND" }
  | { type: "QUIT_GAME" }
  // Ações Infiltração
  | { type: "INFILTRATION_WORD"; success: boolean }
  | { type: "FINISH_INFILTRATION_TURN" }
  // Ações Interceptação
  | { type: "INTERCEPTION_RESULT"; winnerTeamIndex: number | null }
  | { type: "PASS_INTERCEPTION_TURN" };

// Limite de ajustes manuais por equipe, baseado nas palavras usadas na rodada
export function getTeamAdjustmentLimit(
  config: CryptoConfig,
  team: CryptoTeam,
): number {
  const wordsUsed = Math.max(
    (team.roundScore || 0) + (team.roundErrors || 0),
    0,
  );

  if (config.mode === "infiltration") {
    if (wordsUsed <= 5) return 1;
    if (wordsUsed <= 10) return 2;
    return 3;
  }

  if (config.wordLimit <= 5) return 1;
  if (config.wordLimit <= 10) return 2;
  return 3;
}

// ============================================================
// AÇÕES COMUNS
// ============================================================
function commonReducer(
  state: CryptoGameState | null,
  action: GameAction,
): CryptoGameState | null {
  switch (action.type) {
    case "START_GAME": {
      const teams = createTeams(
        action.players,
        action.config.teamCount,
        action.config.distributionType,
        action.manualAssignments,
      );

      const initialTeamIndex = Math.floor(Math.random() * teams.length);

      return {
        config: action.config,
        phase: "team-reveal",
        teams,
        currentTeamIndex: initialTeamIndex, // Equipe ativa
        startingTeamIndex: initialTeamIndex, // Equipe que abriu a rodada
        currentWord: null,
        usedWords: action.globalUsedWords || [],
        roundNumber: 1,
        currentMatchIndex: 0,
        roundEndTime: undefined,
        skipsLeft: action.config.skipLimit,
        roundHistory: [],
      };
    }

    case "SET_OPERATOR": {
      if (!state) return state;
      const updatedTeams = state.teams.map((t) =>
        t.id === action.teamId ? { ...t, operatorId: action.playerId } : t,
      );
      return { ...state, teams: updatedTeams };
    }

    case "SET_STARTING_TEAM": {
      if (!state) return state;
      return {
        ...state,
        currentTeamIndex: action.teamIndex,
        startingTeamIndex: action.teamIndex,
        teams: [...state.teams],
      };
    }

    case "SET_RANDOM_OPERATORS": {
      if (!state) return state;
      const updatedTeams = state.teams.map((t) => {
        if (t.players.length === 0) return t;
        const randomPlayer =
          t.players[Math.floor(Math.random() * t.players.length)];
        return { ...t, operatorId: randomPlayer.id };
      });
      return { ...state, teams: updatedTeams };
    }

    case "BEGIN_ACTION_PHASE": {
      if (!state) return state;

      const hasMissingOperator = state.teams.some((t) => !t.operatorId);
      if (hasMissingOperator) return state;

      const firstWord = getUniqueWord(
        state.config.categories,
        state.usedWords,
      );

      return {
        ...state,
        phase:
          state.config.mode === "infiltration"
            ? "infiltration-action"
            : "interception-action",
        currentWord: firstWord.word,
        usedWords: firstWord.didReset
          ? firstWord.word
            ? [firstWord.word]
            : state.usedWords
          : firstWord.word
            ? [...state.usedWords, firstWord.word]
            : state.usedWords,
        skipsLeft: state.config.skipLimit,
        roundEndTime: undefined,
        // Limpa os scores apenas no primeiro turno da primeira rodada
        teams:
          state.roundNumber === 1 &&
          state.currentTeamIndex === state.startingTeamIndex
            ? state.teams.map((t) => ({ ...t, roundScore: 0 }))
            : state.teams,
      };
    }

    case "START_TIMER": {
      if (!state) return state;

      // Evita iniciar duas vezes
      if (state.roundEndTime !== undefined) return state;

      return {
        ...state,
        roundEndTime: Date.now() + state.config.roundTime * 1000,
        lastActionTime: Date.now(), // Começa a cronometrar a 1ª palavra aqui
      };
    }

    case "REROLL_WORD": {
      if (!state) return state;
      const nextWord = getUniqueWord(
        state.config.categories,
        state.usedWords,
      );
      if (!nextWord || !nextWord.word) {
        return { ...state, phase: "round-result" };
      }

      return {
        ...state,
        currentWord: nextWord.word,
        usedWords: nextWord.didReset
          ? [nextWord.word]
          : [...state.usedWords, nextWord.word],
      };
    }

    case "REASSIGN_WORD": {
      if (!state) return state;

      const { wordIndex, newWinnerIndex } = action;
      const item = state.roundHistory[wordIndex];
      if (!item) return state;

      const oldWinnerIndex = item.winnerTeamIndex;

      // Infiltração: palavra travada ao time dono
      if (
        state.config.mode === "infiltration" &&
        item.ownerTeamIndex !== null &&
        item.ownerTeamIndex !== undefined
      ) {
        if (newWinnerIndex !== null && newWinnerIndex !== item.ownerTeamIndex) {
          return state;
        }
      }

      if (newWinnerIndex !== null && oldWinnerIndex !== newWinnerIndex) {
        const newTeamLimit = getTeamAdjustmentLimit(
          state.config,
          state.teams[newWinnerIndex],
        );
        if (
          (state.teams[newWinnerIndex].manualAdjustmentAddCount ?? 0) >=
          newTeamLimit
        ) {
          return state;
        }
      }

      if (oldWinnerIndex !== null && oldWinnerIndex !== newWinnerIndex) {
        const oldTeamLimit = getTeamAdjustmentLimit(
          state.config,
          state.teams[oldWinnerIndex],
        );
        if (
          (state.teams[oldWinnerIndex].manualAdjustmentRemoveCount ?? 0) >=
          oldTeamLimit
        ) {
          return state;
        }
      }

      const newHistory = [...state.roundHistory];
      newHistory[wordIndex] = { ...item, winnerTeamIndex: newWinnerIndex };

      const updatedTeams = state.teams.map((team, idx) => {
        let scoreChange = 0;
        let errorChange = 0;
        let addChange = 0;
        let removeChange = 0;

        if (idx === oldWinnerIndex && idx !== newWinnerIndex) {
          scoreChange = -1;
          errorChange = 1;
          removeChange = 1;
        } else if (idx === newWinnerIndex && idx !== oldWinnerIndex) {
          scoreChange = 1;
          errorChange = -1;
          addChange = 1;
        } else {
          return team;
        }

        return {
          ...team,
          score: Math.max(0, team.score + scoreChange),
          roundScore: Math.max(0, team.roundScore + scoreChange),
          roundErrors: Math.max(0, team.roundErrors + errorChange),
          totalErrors: Math.max(0, team.totalErrors + errorChange),
          manualAdjustmentCount: (team.manualAdjustmentCount || 0) + 1,
          manualAdjustmentAddCount:
            (team.manualAdjustmentAddCount ?? 0) + addChange,
          manualAdjustmentRemoveCount:
            (team.manualAdjustmentRemoveCount ?? 0) + removeChange,
          wordsGuessed: newHistory
            .filter((h) => h.winnerTeamIndex === idx)
            .map((h) => h.word),
        };
      });

      return { ...state, roundHistory: newHistory, teams: updatedTeams };
    }

    case "NEXT_ROUND": {
      if (!state) return state;

      let nextStartingTeam = state.startingTeamIndex;

      if (state.config.mode === "infiltration") {
        // Infiltração: o próximo grupo na fila inicia a nova rodada
        nextStartingTeam = (state.startingTeamIndex + 1) % state.teams.length;
      } else {
        // Interceptação: o vencedor absoluto da rodada inicia.
        // Desempate oficial: Acertos -> Eficiência -> Tempo
        const sortedTeams = [...state.teams].sort((a, b) => {
          if (a.roundScore !== b.roundScore) return b.roundScore - a.roundScore;

          const attemptsA = a.roundScore + (a.roundErrors || 0);
          const effA =
            attemptsA > 0 ? Math.round((a.roundScore / attemptsA) * 100) : 0;

          const attemptsB = b.roundScore + (b.roundErrors || 0);
          const effB =
            attemptsB > 0 ? Math.round((b.roundScore / attemptsB) * 100) : 0;

          if (effA !== effB) return effB - effA;

          const rawTimeA =
            a.roundScore > 0 ? (a.roundTimeSpent || 0) / a.roundScore : 0;
          const timeA = Number((rawTimeA / 1000).toFixed(1));

          const rawTimeB =
            b.roundScore > 0 ? (b.roundTimeSpent || 0) / b.roundScore : 0;
          const timeB = Number((rawTimeB / 1000).toFixed(1));

          if (timeA !== timeB) return timeA - timeB; // Menor tempo = melhor rank

          return 0; // Empate absoluto
        });

        nextStartingTeam = state.teams.findIndex(
          (t) => t.id === sortedTeams[0].id,
        );
      }

      return {
        ...state,
        phase: "team-reveal",
        currentTeamIndex: nextStartingTeam,
        startingTeamIndex: nextStartingTeam,
        currentMatchIndex: 0,
        roundNumber: state.roundNumber + 1,
        roundHistory: [],
        roundEndTime: undefined,
        lastActionTime: undefined,
        teams: state.teams.map((t) => ({
          ...t,
          operatorId: null,
          roundScore: 0,
          roundErrors: 0, // Reseta pro relatório da nova rodada
          roundTimeSpent: 0,
          manualAdjustmentCount: 0,
          manualAdjustmentAddCount: 0,
          manualAdjustmentRemoveCount: 0,
        })),
      };
    }

    default:
      return state;
  }
}

// ============================================================
// AÇÕES DE INFILTRAÇÃO
// ============================================================
function infiltrationReducer(
  state: CryptoGameState,
  action: GameAction,
): CryptoGameState {
  switch (action.type) {
    case "INFILTRATION_WORD": {
      const now = Date.now();
      const timeSpentOnWord = now - (state.lastActionTime || now);

      let newScore = 0;
      let newErrors = 0;
      let newWords: string[] = [];
      let newSkips = state.skipsLeft;

      if (action.success) {
        newScore = 1;
        if (state.currentWord) newWords.push(state.currentWord);
      } else {
        if (state.config.skipLimit !== 999) {
          if (state.skipsLeft === 0) return state; // Bloqueia o pulo se acabou
          newSkips = state.skipsLeft - 1;
        }
        // Se for 999, o erro é contado sem consumir pulo
        newErrors = 1;
      }

      const updatedTeams = state.teams.map((t, i) => {
        if (i !== state.currentTeamIndex) return t;

        const opStats = { ...t.operatorStats };
        if (action.success && t.operatorId) {
          opStats[t.operatorId] = (opStats[t.operatorId] || 0) + 1;
        }

        return {
          ...t,
          score: t.score + newScore,
          roundScore: t.roundScore + newScore,
          wordsGuessed: [...t.wordsGuessed, ...newWords],
          roundErrors: t.roundErrors + newErrors,
          totalErrors: t.totalErrors + newErrors,
          roundTimeSpent: t.roundTimeSpent + timeSpentOnWord,
          totalTimeSpent: t.totalTimeSpent + timeSpentOnWord,
          operatorStats: opStats,
        };
      });

      const newHistoryItem = {
        word: state.currentWord!,
        winnerTeamIndex: action.success ? state.currentTeamIndex : null,
        ownerTeamIndex: state.currentTeamIndex,
      };

      const historyWithCurrentWord = [
        ...state.roundHistory,
        newHistoryItem,
      ];

      const result = getUniqueWord(
        state.config.categories,
        state.usedWords,
      );

      if (!result.word) {
        return {
          ...state,
          teams: updatedTeams,
          phase: "round-result",
          roundEndTime: undefined,
          lastActionTime: undefined,
          roundHistory: historyWithCurrentWord,
        };
      }

      return {
        ...state,
        teams: updatedTeams,
        currentWord: result.word,
        usedWords: result.didReset
          ? [result.word]
          : [...state.usedWords, result.word],
        skipsLeft: newSkips,
        lastActionTime: now,
        roundHistory: historyWithCurrentWord,
      };
    }

    case "FINISH_INFILTRATION_TURN": {
      const nextTeamIndex =
        (state.currentTeamIndex + 1) % state.teams.length;
      const isLastTeam = nextTeamIndex === state.startingTeamIndex;
      const currentHistoryItem = {
        word: state.currentWord!,
        winnerTeamIndex: null,
        ownerTeamIndex: state.currentTeamIndex,
      };

      if (isLastTeam) {
        return {
          ...state,
          phase: "round-result",
          roundEndTime: undefined,
          lastActionTime: undefined,
          roundHistory: [...state.roundHistory, currentHistoryItem],
        };
      }

      const result = getUniqueWord(
        state.config.categories,
        state.usedWords,
      );

      if (!result.word) {
        return {
          ...state,
          phase: "round-result",
          roundEndTime: undefined,
          lastActionTime: undefined,
          roundHistory: [...state.roundHistory, currentHistoryItem],
        };
      }

      return {
        ...state,
        currentTeamIndex: nextTeamIndex,
        currentWord: result.word,
        usedWords: result.didReset
          ? [result.word]
          : [...state.usedWords, result.word],
        skipsLeft: state.config.skipLimit,
        roundEndTime: undefined,
        lastActionTime: undefined,
        roundHistory: [...state.roundHistory, currentHistoryItem],
      };
    }

    default:
      return state;
  }
}

// ============================================================
// AÇÕES DE INTERCEPTAÇÃO
// ============================================================
function interceptionReducer(
  state: CryptoGameState,
  action: GameAction,
): CryptoGameState {
  switch (action.type) {
    case "INTERCEPTION_RESULT": {
      const now = Date.now();
      const timeSpentOnWord = now - (state.lastActionTime || now);

      let updatedTeams = state.teams;

      if (action.winnerTeamIndex !== null) {
        updatedTeams = state.teams.map((t, i) => {
          if (i !== action.winnerTeamIndex) return t;

          const opStats = { ...t.operatorStats };
          if (t.operatorId) {
            opStats[t.operatorId] = (opStats[t.operatorId] || 0) + 1;
          }

          return {
            ...t,
            score: t.score + 1,
            roundScore: t.roundScore + 1,
            wordsGuessed: state.currentWord
              ? [...t.wordsGuessed, state.currentWord]
              : t.wordsGuessed,
            roundTimeSpent: t.roundTimeSpent + timeSpentOnWord,
            totalTimeSpent: t.totalTimeSpent + timeSpentOnWord,
            operatorStats: opStats,
          };
        });
      }

      const nextMatchIndex = state.currentMatchIndex + 1;
      const isRoundOver = nextMatchIndex >= state.config.wordLimit;
      const newCurrentTeamIndex =
        action.winnerTeamIndex !== null
          ? action.winnerTeamIndex
          : state.currentTeamIndex;

      const newHistoryItem = {
        word: state.currentWord!,
        winnerTeamIndex: action.winnerTeamIndex,
      };

      if (isRoundOver) {
        return {
          ...state,
          teams: updatedTeams,
          phase: "round-result",
          currentTeamIndex: newCurrentTeamIndex,
          roundEndTime: undefined,
          lastActionTime: undefined,
          roundHistory: [...state.roundHistory, newHistoryItem],
        };
      }

      const result = getUniqueWord(
        state.config.categories,
        state.usedWords,
      );

      if (!result.word) {
        return {
          ...state,
          phase: "round-result",
          roundEndTime: undefined,
          lastActionTime: undefined,
          roundHistory: [...state.roundHistory, newHistoryItem],
        };
      }

      return {
        ...state,
        teams: updatedTeams,
        currentMatchIndex: nextMatchIndex,
        currentWord: result.word,
        usedWords: result.didReset
          ? [result.word]
          : [...state.usedWords, result.word],
        currentTeamIndex: newCurrentTeamIndex,
        roundEndTime: undefined,
        lastActionTime: undefined,
        roundHistory: [...state.roundHistory, newHistoryItem],
      };
    }

    case "PASS_INTERCEPTION_TURN": {
      const now = Date.now();
      const timeSpentOnTurn = now - (state.lastActionTime || now);

      const updatedTeams = state.teams.map((t, i) => {
        if (i !== state.currentTeamIndex) return t;

        return {
          ...t,
          roundErrors: t.roundErrors + 1,
          totalErrors: t.totalErrors + 1,
          roundTimeSpent: t.roundTimeSpent + timeSpentOnTurn,
          totalTimeSpent: t.totalTimeSpent + timeSpentOnTurn,
        };
      });

      return {
        ...state,
        teams: updatedTeams,
        currentTeamIndex: (state.currentTeamIndex + 1) % state.teams.length,
        roundEndTime: undefined,
        lastActionTime: undefined,
      };
    }

    default:
      return state;
  }
}

// ============================================================
// ENTRADA PRINCIPAL
// ============================================================
export function cryptoGameReducer(
  state: CryptoGameState | null,
  action: GameAction,
): CryptoGameState | null {
  if (action.type === "QUIT_GAME") return null;

  // START_GAME pode rodar sem state
  if (action.type === "START_GAME") {
    return commonReducer(state, action);
  }

  // Qualquer outra action precisa de state
  if (!state) return state;

  switch (action.type) {
    case "SET_OPERATOR":
    case "SET_STARTING_TEAM":
    case "SET_RANDOM_OPERATORS":
    case "BEGIN_ACTION_PHASE":
    case "START_TIMER":
    case "REROLL_WORD":
    case "REASSIGN_WORD":
    case "NEXT_ROUND":
      return commonReducer(state, action);

    case "INFILTRATION_WORD":
    case "FINISH_INFILTRATION_TURN":
      return state.config.mode === "infiltration"
        ? infiltrationReducer(state, action)
        : state;

    case "INTERCEPTION_RESULT":
    case "PASS_INTERCEPTION_TURN":
      return state.config.mode === "interception"
        ? interceptionReducer(state, action)
        : state;

    default:
      return state;
  }
}
