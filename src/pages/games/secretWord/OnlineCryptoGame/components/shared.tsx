import { useEffect, useState } from "react";
import type {
  CryptoTeamView,
  CryptoView,
} from "../../../../../types/cryptoOnline";
import { WordRevealBox } from "../../components/WordRevealBox";
import styles from "../onlineCrypto.module.css";

// ------------------------------------------------------------
// Contagem regressiva EXIBIDA (o servidor é a fonte da verdade:
// quem encerra o turno é a bomba-relógio do backend)
// ------------------------------------------------------------
export function useCountdown(view: CryptoView): number | null {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    if (!view.roundEndTime) {
      setLeft(null);
      return;
    }

    const end = view.roundEndTime;
    const compute = () =>
      setLeft(Math.max(0, Math.ceil((end - Date.now()) / 1000)));
    compute();
    const id = setInterval(compute, 250);
    return () => clearInterval(id);
  }, [view.roundEndTime]);

  return left;
}

// ------------------------------------------------------------
// Placar compacto de todos os groups (telas de espera)
// ------------------------------------------------------------
export function Scoreboard({ teams }: { teams: CryptoTeamView[] }) {
  const sorted = [...teams].sort((a, b) => b.score - a.score);
  return (
    <div className={styles.scoreboard}>
      {sorted.map((t) => (
        <div key={t.id} className={styles.scoreRow}>
          <span className={styles.scoreDot} style={{ background: t.color }} />
          <span className={styles.scoreName}>{t.name}</span>
          <span className={styles.scoreValue}>{t.score}</span>
        </div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------
// Integrantes do group com status de conexão
// ------------------------------------------------------------
export function TeamMembers({ team }: { team: CryptoTeamView }) {
  return (
    <div className={styles.memberChips}>
      {team.players.map((p) => (
        <span key={p.id} className={styles.memberChip}>
          <span className={styles.chipEmoji}>{p.emoji ?? "👤"}</span>
          {p.name}
          <i
            className={`${styles.chipDot} ${
              p.connection === "online"
                ? styles.dotOnline
                : p.connection === "present"
                  ? styles.dotPresent
                  : styles.dotOffline
            }`}
          />
        </span>
      ))}
    </div>
  );
}

// ------------------------------------------------------------
// Painel da palavra do operador (reaproveita o WordRevealBox
// offline: segure para revelar)
// ------------------------------------------------------------
export function OperatorWordPanel({
  word,
  timerRunning,
  feedback,
}: {
  word: string | null;
  timerRunning: boolean;
  feedback: "none" | "success" | "skip";
}) {
  const [revealing, setRevealing] = useState(false);

  return (
    <WordRevealBox
      word={word}
      hasStarted={timerRunning}
      isRevealing={revealing}
      feedback={feedback}
      onPointerDown={() => setRevealing(true)}
      onPointerUp={() => setRevealing(false)}
    />
  );
}
