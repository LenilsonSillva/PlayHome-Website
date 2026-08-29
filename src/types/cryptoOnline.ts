// ============================================================
// Tipos do modo online do Criptografia (contrato crypto:* do backend)
// Espelho do SOCKET_CONTRACT_CRIPTOGRAFIA.md do PlayHome-Backend.
// ============================================================

export type CryptoMode = "infiltration" | "interception";

export type CryptoPhase =
  | "team-reveal"
  | "infiltration-action"
  | "interception-action"
  | "round-result";

export type ConnectionStatus = "online" | "disconnected" | "present";

// ---------------- LOBBY ----------------

export interface CryptoLobbyPlayer {
  socketId: string;
  id: string;
  name: string;
  emoji?: string;
  color?: string;
  groupId: string | null;
  connection: ConnectionStatus;
  isSubHost: boolean;
}

export interface CryptoPresentPlayer {
  id: string;
  name: string;
  emoji?: string;
  color?: string;
  groupId: string | null;
  connection: "present";
}

export interface CryptoWaitingPlayer {
  socketId: string;
  id: string;
  name: string;
  emoji?: string;
  color?: string;
  groupId: string | null;
  connection: "online" | "disconnected";
}

export interface CryptoGroupView {
  id: string;
  name: string;
  color: string;
  subHostId: string | null;
  playerIds: string[];
}

export interface CryptoConfigInput {
  mode: CryptoMode;
  teamCount: number;
  distributionType: "random" | "manual";
  roundTime: number;
  wordLimit: number;
  skipLimit: number;
  categories: string[];
  manualAssignments?: Record<string, number>;
  othersSeeWord?: boolean;
  operatorsSeeWordOnStandby?: boolean;
}

export interface CryptoRoomView {
  gameType: "cryptography";
  code: string;
  hostId: string;
  phase: "lobby" | "playing";
  config: CryptoConfigInput | null;
  isHost: boolean;
  players: CryptoLobbyPlayer[];
  presentPlayers: CryptoPresentPlayer[];
  groups: CryptoGroupView[];
  waitingPlayers: CryptoWaitingPlayer[];
}

// ---------------- JOGO ----------------

export interface CryptoTeamPlayer {
  id: string;
  socketId: string | null;
  name: string;
  emoji?: string;
  color?: string;
  connection: ConnectionStatus;
  isSubHost: boolean;
}

export interface CryptoTeamView {
  id: string;
  name: string;
  color: string;
  operatorId: string | null;
  score: number;
  roundScore: number;
  wordsGuessed: string[];
  roundErrors: number;
  totalErrors: number;
  roundTimeSpent: number;
  totalTimeSpent: number;
  operatorStats: Record<string, number>;
  canSetOperator: boolean;
  players: CryptoTeamPlayer[];
}

export interface CryptoControls {
  canControl: boolean;
  canStartTimer: boolean;
  canBeginAction: boolean;
  canSetStartingTeam: boolean;
  canNextRound: boolean;
  canReassign: boolean;
  /** Solicita a troca; o servidor só aplica após o consenso. */
  canReroll: boolean;
  canRequestWordChange: boolean;
  canApproveWordChange: boolean;
  /** Cancela a solicitação e mantém a palavra atual. */
  canRejectWordChange: boolean;
  canPassTurn: boolean;
}

export interface CryptoWordChangeRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  operatorIds: string[];
  approvedBy: string[];
}

export interface CryptoRoundHistoryItem {
  word: string;
  winnerTeamIndex: number | null;
  ownerTeamIndex?: number | null;
}

export interface CryptoView {
  gameType: "cryptography";
  phase: CryptoPhase;
  roomCode: string;
  serverTime: number;
  isHost: boolean;
  isSpectator: boolean;
  mySocketId: string;
  myPlayerId: string | null;
  /** ID do operador lógico quando o dispositivo está sendo delegado. */
  actingPlayerId: string | null;
  myName: string;
  myEmoji: string;
  myColor: string;
  myRole: "host" | "subHost" | "operator" | "player" | "spectator";
  myTeamIndex: number;
  config: {
    mode: CryptoMode;
    teamCount: number;
    distributionType: "random" | "manual";
    roundTime: number;
    wordLimit: number;
    skipLimit: number;
    categories: string[];
    othersSeeWord: boolean;
    operatorsSeeWordOnStandby: boolean;
    language: string;
  };
  teams: CryptoTeamView[];
  currentTeamIndex: number;
  startingTeamIndex: number;
  currentWord: string | null;
  currentWordVisible: boolean;
  currentMatchIndex: number;
  roundNumber: number;
  skipsLeft: number;
  roundEndTime: number | null;
  lastActionTime: number | null;
  roundHistory: CryptoRoundHistoryItem[];
  wordChangeRequest: CryptoWordChangeRequest | null;
  controls: CryptoControls;
}
