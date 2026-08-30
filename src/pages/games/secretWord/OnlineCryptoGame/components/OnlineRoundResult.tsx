import type { CryptoView } from "../../../../../types/cryptoOnline";
import { TeamMembers } from "./shared";
import {
  getRoundWinners,
  getTeamStats,
  sortTeamsByRanking,
} from "../../components/ranking";
import { ResultCard } from "../../components/ResultCard";
import { RoundAudit } from "../../components/RoundAudit";
import styles from "../onlineCrypto.module.css";
import { useI18n } from "../../../../../i18n";

type Props = {
  view: CryptoView;
  emit: (event: string, payload?: unknown) => void;
};

export function OnlineRoundResult({ view, emit }: Props) {
  const { t } = useI18n();
  const isHost = view.controls.canNextRound;

  // 🏆 Vencedor(es) da rodada + ranking geral (mesma regra do offline)
  const roundWinners = getRoundWinners(view.teams);
  const sortedTeams = sortTeamsByRanking(view.teams, "global");
  const winnerHits =
    roundWinners.length > 0 ? getTeamStats(roundWinners[0], "round").hits : 0;

  return (
    <div className={styles.container}>
      <header className={styles.phaseHeader}>
        <span className={styles.badge}>{t("games.cryptography_result_badge", "DECRYPTED DATA")}</span>
        <h1>{t("games.cryptography_result_title", "MISSION RANKING")}</h1>
        <p className={styles.roundLabel}>{t("games.cryptography_result_round", "ROUND")} {view.roundNumber}</p>
      </header>

      {/* BANNER DE VITÓRIA DA RODADA */}
      <div className={`glass-panel ${styles.victoryBanner}`}>
        <h2 className={styles.victoryTitle}>
          {roundWinners.length > 1
            ? t("games.cryptography_result_tie", "ROUND TIE")
            : t("games.cryptography_result_teamWin", "ROUND WINNER")}
        </h2>
        <div className={styles.victoryNames}>
          {roundWinners.map((w, idx) => (
            <span
              key={w.id}
              className={styles.victoryName}
              style={{ color: w.color }}
            >
              {w.name.toUpperCase()}
              {idx < roundWinners.length - 1 ? " & " : ""}
            </span>
          ))}
        </div>
        <p className={styles.victoryHits}>
          +{winnerHits} {t("games.cryptography_result_hits", "HITS")}
        </p>
      </div>

      {/* RANKING GERAL (mesmo card do offline) */}
      <div className={styles.podium}>
        {sortedTeams.map((team, index) => (
          <ResultCard
            key={team.id}
            team={team}
            rank={index + 1}
            isWinner={index === 0}
            members={<TeamMembers team={team} />}
          />
        ))}
      </div>

      {/* ============ AUDITORIA + AÇÕES (HOST) ============ */}
      {isHost ? (
        <>
          <RoundAudit
            items={view.roundHistory}
            teams={view.teams}
            onReassign={(wordIndex, newWinnerIndex) =>
              emit("crypto:reassign-word", {
                roomCode: view.roomCode,
                wordIndex,
                newWinnerIndex,
              })
            }
          />

          <button
            className={styles.primaryBtn}
            onClick={() => emit("crypto:next-round", { roomCode: view.roomCode })}
          >
            🚀 {t("games.cryptography_result_nextRound", "NEXT ROUND (POINTS CARRY OVER)")}
          </button>
        </>
      ) : (
        <p className={styles.waitingNote}>
          ⏳ {t("games.cryptography_result_waitingHost", "Waiting for the host to start the next round...")}
        </p>
      )}
    </div>
  );
}
