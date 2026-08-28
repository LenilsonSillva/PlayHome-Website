import type { CryptoView } from "../../../../../types/cryptoOnline";
import { TeamMembers } from "./shared";
import styles from "../onlineCrypto.module.css";

type Props = {
  view: CryptoView;
  onSelectOperator: (teamId: string, playerId: string) => void;
  onRandomizeOperators: () => void;
  onSetStartingTeam: (teamIndex: number) => void;
  onBeginAction: () => void;
};

export function OnlineTeamReveal({
  view,
  onSelectOperator,
  onRandomizeOperators,
  onSetStartingTeam,
  onBeginAction,
}: Props) {
  const allOperatorsSet = view.teams.every((t) => t.operatorId != null);
  const isHost = view.controls.canBeginAction;

  return (
    <div className={styles.container}>
      <header className={styles.phaseHeader}>
        <span className={styles.badge}>RECONHECIMENTO DE UNIDADES</span>
        <h1>
          ESQUADRÕES FORMADOS <span className={styles.cyan}>— RODADA {view.roundNumber}</span>
        </h1>
      </header>

      <div className={styles.teamsGrid}>
        {view.teams.map((team, idx) => (
          <div
            key={team.id}
            className={`glass-panel ${styles.teamCard}`}
            style={{ borderTopColor: team.color } as React.CSSProperties}
          >
            <div className={styles.teamCardHeader}>
              <span className={styles.teamIndex}>0{idx + 1}</span>
              <h3>{team.name}</h3>
              {idx === view.startingTeamIndex && (
                <span className={styles.startingBadge}>🚀 COMEÇA A RODADA</span>
              )}
              <span className={styles.teamScore}>{team.score} PTS</span>
            </div>

            <TeamMembers team={team} />

            <label className={styles.operatorLabel}>
              OPERADOR (QUEM DÁ AS DICAS):
              <select
                className={styles.operatorSelect}
                value={team.operatorId ?? ""}
                disabled={!team.canSetOperator}
                onChange={(e) => onSelectOperator(team.id, e.target.value)}
              >
                <option value="" disabled>
                  {team.canSetOperator ? "Selecione..." : "Escolhido pelo líder/host"}
                </option>
                {team.players
                  .filter((p) => p.connection === "online")
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {p.isSubHost ? " 🎖️" : ""}
                    </option>
                  ))}
              </select>
            </label>
          </div>
        ))}
      </div>

      <footer className={styles.phaseFooter}>
        {isHost ? (
          <>
            <div className={styles.startingPicker}>
              <span>QUEM COMEÇA A RODADA:</span>
              {view.teams.map((t, idx) => (
                <button
                  key={t.id}
                  className={view.startingTeamIndex === idx ? styles.startingActive : ""}
                  style={{ borderColor: t.color }}
                  onClick={() => onSetStartingTeam(idx)}
                >
                  {t.name}
                </button>
              ))}
            </div>

            <div className={styles.footerButtons}>
              <button className={styles.secondaryBtn} onClick={onRandomizeOperators}>
                🎲 SORTEAR OPERADORES
              </button>
              <button
                className={styles.primaryBtn}
                onClick={onBeginAction}
                disabled={!allOperatorsSet}
              >
                {allOperatorsSet ? "INICIAR AÇÃO 🚀" : "FALTAM OPERADORES"}
              </button>
            </div>
          </>
        ) : (
          <p className={styles.waitingNote}>
            ⏳ Aguardando o host definir operadores e iniciar a ação...
          </p>
        )}
      </footer>
    </div>
  );
}
