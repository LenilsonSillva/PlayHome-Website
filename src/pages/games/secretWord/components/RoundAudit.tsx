import styles from "./roundAudit.module.css";
import { useI18n } from "../../../../i18n";

// Painel de auditoria da rodada — compartilhado entre o resultado offline
// (valida limites localmente) e o online (o servidor valida). No modo
// infiltration keeps each word locked to its owning group (the mobile rule).

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
  const { t } = useI18n();
  const warnLimit = (teamName: string, limit: number) => {
    alert(
      `${t("games.cryptography_result_audit_limit_reached", "Adjustment limit reached for this team.")} (${teamName.toUpperCase()} · ${limit})`,
    );
  };

  const handleChange = (wordIndex: number, newWinnerIndex: number | null) => {
    const item = items[wordIndex];
    if (!item) return;

    const locked =
      item.ownerTeamIndex !== null && item.ownerTeamIndex !== undefined;

    // INFILTRATION: word locked to its owning group
    if (locked) {
      const ownerIdx = item.ownerTeamIndex!;
      const owner = teams[ownerIdx];

      if (newWinnerIndex !== null && newWinnerIndex !== ownerIdx) {
        alert(
          `${owner.name.toUpperCase()} ${t("games.cryptography_result_audit_lockedWord", "is responsible for this word.")}`,
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
              `${t("games.cryptography_result_audit_removeHit", "Remove the hit from")} ${owner.name.toUpperCase()}?`,
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
              `${t("games.cryptography_result_audit_assignWord", "Assign this word to")} ${owner.name.toUpperCase()}?`,
            )
          ) {
            return;
          }
        }
      }

      onReassign(wordIndex, newWinnerIndex);
      return;
    }

    // INTERCEPTION (or a word without an owner)
    if (newWinnerIndex === null) {
      if (item.winnerTeamIndex !== null) {
        const meta = teamMeta?.[item.winnerTeamIndex];
        if (meta && meta.removeUsed >= meta.limit) {
          warnLimit(teams[item.winnerTeamIndex].name, meta.limit);
          return;
        }
        if (
          !window.confirm(
            `${t("games.cryptography_result_audit_removeHit", "Remove the hit from")} ${teams[item.winnerTeamIndex].name.toUpperCase()}?`,
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
      ? `${teams[teamIdx].name} (${t("games.cryptography_result_audit_added", "ADDED")} ${meta.addUsed}/${meta.limit})`
      : teams[teamIdx].name;
  };

  return (
    <div className={`glass-panel ${styles.auditPanel}`}>
      <h2 className={styles.auditTitle}>📡 {t("games.cryptography_result_audit_title", "ROUND AUDIT")}</h2>
      <p className={styles.auditHint}>
        {t("games.cryptography_result_audit_clickToEdit", "Click to reassign points")}. {t("games.cryptography_result_audit_subtitle", "Adjust the result")}
      </p>

      {items.length === 0 ? (
        <p className={styles.auditHint}>{t("games.cryptography_result_audit_empty", "No words recorded.")}</p>
      ) : (
        <div className={styles.auditTable}>
          {items.map((item, idx) => (
            <div key={idx} className={styles.auditRow}>
              <div>
                <span className={styles.auditWord}>{item.word}</span>
                {item.ownerTeamIndex !== null &&
                  item.ownerTeamIndex !== undefined && (
                    <span className={styles.auditOwner}>
                      {t("games.cryptography_result_audit_responsible", "RESPONSIBLE:")} {teams[item.ownerTeamIndex]?.name}
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
                <option value={-1}>— {t("games.cryptography_result_noWord", "no winner")}</option>
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
