import type { CryptoGameState } from "../GameLogistic/types";
import styles from "./teamReveal.module.css";

type Props = {
  data: CryptoGameState;
  onSelectOperator: (teamId: string, playerId: string) => void;
  onSetStartingTeam: (teamIndex: number) => void;
  onRandomizeOperators: () => void;
  onConfirm: () => void;
  onEdit: () => void;
};

// RECONHECIMENTO DE UNIDADES — mesmo fluxo do PlayHome-RN:
// escolha do operador por esquadrão, sorteio geral, definição de quem
// inicia a rodada (1ª rodada) e validação antes de começar.
export function SecretTeamReveal({
  data,
  onSelectOperator,
  onSetStartingTeam,
  onRandomizeOperators,
  onConfirm,
  onEdit,
}: Props) {
  const handleConfirm = () => {
    const missingOperators = data.teams.some((t) => !t.operatorId);
    if (missingOperators) {
      alert(
        "Atenção: cada esquadrão precisa de um Operador definido antes de prosseguir!",
      );
      return;
    }
    onConfirm();
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.badge}>RECONHECIMENTO DE UNIDADES</div>
        <h2 className={styles.title}>ESQUADRÕES FORMADOS</h2>
        <p className={styles.roundTag}>RODADA {data.roundNumber}</p>
      </header>

      {/* 🎲 SORTEIO GERAL DE OPERADORES */}
      <button className={styles.randomAllBtn} onClick={onRandomizeOperators}>
        🎲 SORTEAR TODOS OS OPERADORES
      </button>

      <div className={styles.teamsGrid}>
        {data.teams.map((team, idx) => (
          <div
            key={team.id}
            className={`glass-panel ${styles.teamCard}`}
            style={{ "--team-color": team.color } as React.CSSProperties}
          >
            <div className={styles.teamHeader}>
              <span className={styles.teamIndex}>0{idx + 1}</span>
              <h3 className={styles.teamName}>{team.name}</h3>

              {/* ⭐ QUEM INICIA A RODADA (apenas na 1ª rodada) */}
              {data.roundNumber === 1 && (
                <button
                  className={`${styles.startTeamBtn} ${
                    data.currentTeamIndex === idx ? styles.startTeamActive : ""
                  }`}
                  onClick={() => onSetStartingTeam(idx)}
                >
                  {data.currentTeamIndex === idx
                    ? "⭐ COMEÇA A RODADA"
                    : "DEFINIR COMO PRIMEIRO"}
                </button>
              )}
            </div>

            <div className={styles.membersList}>
              <p className={styles.roleLabel}>
                SELECIONE O OPERADOR (QUEM DÁ AS DICAS):
              </p>
              {team.players.map((player) => {
                const isOperator = team.operatorId === player.id;
                return (
                  <button
                    key={player.id}
                    className={`${styles.memberBtn} ${isOperator ? styles.activeOperator : ""}`}
                    onClick={() => onSelectOperator(team.id, player.id)}
                  >
                    <div className={styles.memberInfo}>
                      <span
                        className={styles.statusDot}
                        style={{ background: player.color }}
                      />
                      {player.name}
                    </div>
                    {isOperator && (
                      <span className={styles.operatorBadge}>OPERADOR</span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              className={styles.randomSubBtn}
              onClick={() => {
                const randomPlayer =
                  team.players[
                    Math.floor(Math.random() * team.players.length)
                  ];
                if (randomPlayer) onSelectOperator(team.id, randomPlayer.id);
              }}
            >
              🎲 SORTEAR JOGADOR
            </button>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <p className={styles.instruction}>
          Defina quem será o Operador de cada esquadrão antes de prosseguir.
        </p>

        <div className={styles.buttonGroup}>
          <button className={styles.editBtn} onClick={onEdit}>
            ⚙️ EDITAR TIMES
          </button>
          <button className={styles.confirmBtn} onClick={handleConfirm}>
            INICIAR AÇÃO 🚀
          </button>
        </div>
      </div>
    </div>
  );
}
