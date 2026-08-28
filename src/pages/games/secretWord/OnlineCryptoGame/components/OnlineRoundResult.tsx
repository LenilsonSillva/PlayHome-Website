import { useState } from "react";
import type { CryptoView } from "../../../../../types/cryptoOnline";
import { TeamMembers } from "./shared";
import styles from "../onlineCrypto.module.css";

type Props = {
  view: CryptoView;
  emit: (event: string, payload?: unknown) => void;
};

export function OnlineRoundResult({ view, emit }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const sorted = [...view.teams].sort((a, b) => b.score - a.score);
  const isHost = view.controls.canNextRound;

  return (
    <div className={styles.container}>
      <header className={styles.phaseHeader}>
        <span className={styles.badge}>DADOS DESCRIPTOGRAFADOS</span>
        <h1>
          RANKING DE <span className={styles.cyan}>MISSÃO</span>
        </h1>
      </header>

      <div className={styles.podium}>
        {sorted.map((team, index) => {
          const attempts = team.roundScore + team.roundErrors;
          const efficiency = attempts > 0 ? Math.round((team.roundScore / attempts) * 100) : 0;
          const isOpen = expanded[team.id];

          return (
            <div
              key={team.id}
              className={`glass-panel ${styles.resultCard} ${index === 0 ? styles.winnerCard : ""}`}
              style={{ borderLeftColor: team.color } as React.CSSProperties}
            >
              <div className={styles.rankBadge}>{index + 1}º</div>

              <div className={styles.resultMain}>
                <div>
                  <h2 className={styles.resultTeamName}>{team.name}</h2>
                  <TeamMembers team={team} />
                </div>
                <div className={styles.resultScoreBlock}>
                  <div className={styles.resultScoreRow}>
                    {team.roundScore > 0 && team.score > team.roundScore && (
                      <span className={styles.roundGain}>+{team.roundScore}</span>
                    )}
                    <span className={styles.resultScore}>{team.score}</span>
                  </div>
                  <span className={styles.resultScoreLabel}>PONTOS</span>
                </div>
              </div>

              <div className={styles.resultStats}>
                <span>✅ {team.roundScore} acertos</span>
                <span>❌ {team.roundErrors} erros</span>
                <span>🎯 {efficiency}% eficiência</span>
              </div>

              <button
                className={styles.logBtn}
                onClick={() => setExpanded((prev) => ({ ...prev, [team.id]: !isOpen }))}
              >
                {isOpen ? "OCULTAR ACERTOS" : `VER ${team.wordsGuessed.length} ACERTOS`}
              </button>

              {isOpen && (
                <div className={styles.wordsLog}>
                  {team.wordsGuessed.length > 0 ? (
                    team.wordsGuessed.map((word, i) => (
                      <span key={i} className={styles.wordTag}>
                        {word}
                      </span>
                    ))
                  ) : (
                    <span className={styles.noWords}>Nenhum sinal interceptado.</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ============ AUDITORIA + AÇÕES (HOST) ============ */}
      {isHost ? (
        <div className={`glass-panel ${styles.auditPanel}`}>
          <h2>📡 AUDITORIA DA RODADA (REATRIBUIR PONTOS)</h2>
          {view.roundHistory.length === 0 ? (
            <p className={styles.hint}>Nenhuma palavra nesta rodada.</p>
          ) : (
            <div className={styles.auditTable}>
              {view.roundHistory.map((item, idx) => (
                <div key={idx} className={styles.auditRow}>
                  <span className={styles.auditWord}>{item.word}</span>
                  <select
                    className={styles.auditSelect}
                    value={item.winnerTeamIndex ?? -1}
                    onChange={(e) => {
                      const v = e.target.value;
                      emit("crypto:reassign-word", {
                        roomCode: view.roomCode,
                        wordIndex: idx,
                        newWinnerIndex: v === "-1" ? null : Number(v),
                      });
                    }}
                  >
                    <option value={-1}>— sem vencedor</option>
                    {view.teams.map((t, tIdx) => (
                      <option key={t.id} value={tIdx}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          <button
            className={styles.primaryBtn}
            onClick={() => emit("crypto:next-round", { roomCode: view.roomCode })}
          >
            🚀 PRÓXIMA MISSÃO (PONTOS SOMAM)
          </button>
        </div>
      ) : (
        <p className={styles.waitingNote}>
          ⏳ Aguardando o host iniciar a próxima rodada...
        </p>
      )}
    </div>
  );
}
