import styles from "./roundAudit.module.css";

// Painel de auditoria da rodada — compartilhado entre o resultado offline
// (valida limites localmente) e o online (o servidor valida). No modo
// infiltração a palavra fica travada ao esquadrão dono (regra do RN).

export interface AuditItem {
  word: string;
  winnerTeamIndex: number | null;
  ownerTeamIndex?: number | null;
}

export interface AuditTeam {
  id: string;
  name: string;
  color: string;
}

export interface AuditTeamMeta {
  addUsed: number;
  removeUsed: number;
  limit: number;
}

type RoundAuditProps = {
  items: AuditItem[];
  teams: AuditTeam[];
  teamMeta?: AuditTeamMeta[]; // offline: controla limites; online: omite
  onReassign: (wordIndex: number, newWinnerIndex: number | null) => void;
};

export function RoundAudit({
  items,
  teams,
  teamMeta,
  onReassign,
}: RoundAuditProps) {
  const warnLimit = (teamName: string, limit: number) => {
    alert(
      `Limite de ajustes da equipe ${teamName.toUpperCase()} atingido (${limit} por rodada).`,
    );
  };

  const handleChange = (wordIndex: number, newWinnerIndex: number | null) => {
    const item = items[wordIndex];
    if (!item) return;

    const locked =
      item.ownerTeamIndex !== null && item.ownerTeamIndex !== undefined;

    // INFILTRAÇÃO: palavra travada ao esquadrão dono
    if (locked) {
      const ownerIdx = item.ownerTeamIndex!;
      const owner = teams[ownerIdx];

      if (newWinnerIndex !== null && newWinnerIndex !== ownerIdx) {
        alert(
          `${owner.name.toUpperCase()} é a equipe responsável por essa palavra.`,
        );
        return;
      }

      const meta = teamMeta?.[ownerIdx];
      if (meta) {
        if (newWinnerIndex === null) {
          if (item.winnerTeamIndex !== null && meta.removeUsed >= meta.limit) {
            warnLimit(owner.name, meta.limit);
            return;
          }
          if (
            item.winnerTeamIndex !== null &&
            !window.confirm(
              `Remover o acerto de ${owner.name.toUpperCase()}?`,
            )
          ) {
            return;
          }
        } else {
          if (meta.addUsed >= meta.limit) {
            warnLimit(owner.name, meta.limit);
            return;
          }
          if (
            !window.confirm(
              `Atribuir esta palavra a ${owner.name.toUpperCase()}?`,
            )
          ) {
            return;
          }
        }
      }

      onReassign(wordIndex, newWinnerIndex);
      return;
    }

    // INTERCEPTAÇÃO (ou palavra sem dono)
    if (newWinnerIndex === null) {
      if (item.winnerTeamIndex !== null) {
        const meta = teamMeta?.[item.winnerTeamIndex];
        if (meta && meta.removeUsed >= meta.limit) {
          warnLimit(teams[item.winnerTeamIndex].name, meta.limit);
          return;
        }
        if (
          !window.confirm(
            `Remover o acerto de ${teams[item.winnerTeamIndex].name.toUpperCase()}?`,
          )
        ) {
          return;
        }
      }
    } else {
      const meta = teamMeta?.[newWinnerIndex];
      if (meta && meta.addUsed >= meta.limit) {
        warnLimit(teams[newWinnerIndex].name, meta.limit);
        return;
      }
    }

    onReassign(wordIndex, newWinnerIndex);
  };

  const optionsFor = (item: AuditItem): number[] => {
    const locked =
      item.ownerTeamIndex !== null && item.ownerTeamIndex !== undefined;
    if (locked) return [item.ownerTeamIndex!]; // só o dono
    return teams.map((_, idx) => idx);
  };

  const optionLabel = (teamIdx: number) => {
    const meta = teamMeta?.[teamIdx];
    return meta
      ? `${teams[teamIdx].name} (A ${meta.addUsed}/${meta.limit})`
      : teams[teamIdx].name;
  };

  return (
    <div className={`glass-panel ${styles.auditPanel}`}>
      <h2 className={styles.auditTitle}>📡 AUDITORIA DA RODADA (REATRIBUIR PONTOS)</h2>
      <p className={styles.auditHint}>
        Toque na palavra para corrigir o vencedor. Cada esquadrão tem um
        limite de ajustes por rodada.
      </p>

      {items.length === 0 ? (
        <p className={styles.auditHint}>Nenhuma palavra nesta rodada.</p>
      ) : (
        <div className={styles.auditTable}>
          {items.map((item, idx) => (
            <div key={idx} className={styles.auditRow}>
              <div>
                <span className={styles.auditWord}>{item.word}</span>
                {item.ownerTeamIndex !== null &&
                  item.ownerTeamIndex !== undefined && (
                    <span className={styles.auditOwner}>
                      RESPONSÁVEL: {teams[item.ownerTeamIndex]?.name}
                    </span>
                  )}
              </div>
              <select
                className={styles.auditSelect}
                value={item.winnerTeamIndex ?? -1}
                onChange={(e) => {
                  const v = e.target.value;
                  handleChange(
                    idx,
                    v === "-1" ? null : Number(v),
                  );
                }}
              >
                <option value={-1}>— sem vencedor</option>
                {optionsFor(item).map((tIdx) => (
                  <option key={teams[tIdx].id} value={tIdx}>
                    {optionLabel(tIdx)}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
