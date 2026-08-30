import styles from "./cryptoHud.module.css";
import { useI18n } from "../../../../i18n";

// Cabeçalho HUD compartilhado das telas de ação do Criptografia
// (offline e online): nome do group da vez, stats e cronômetro.

export type HudStat = {
  text: string;
  value: string | number;
  tone?: "success" | "warning" | "neutral";
};

type CryptoHudProps = {
  label: string; // ex.: "JOGANDO AGORA" | "VEZ DE"
  teamName: string;
  teamColor: string;
  operatorName?: string | null;
  stats: HudStat[];
  countdown: number | null; // segundos restantes (null = parado)
  totalTime: number;
};

export function CryptoHud({
  label,
  teamName,
  teamColor,
  operatorName,
  stats,
  countdown,
  totalTime,
}: CryptoHudProps) {
  const { t } = useI18n();
  const running = countdown !== null;
  const critical = running && countdown <= 5;

  return (
    <div
      className={styles.hud}
      style={{ borderLeftColor: teamColor } as React.CSSProperties}
    >
      <div className={styles.hudLeft}>
        <span className={styles.hudLabel}>{label}</span>
        <div className={styles.hudTeamRow}>
          <h2 className={styles.hudTeam} style={{ color: teamColor }}>
            {teamName}
          </h2>
        </div>
        {operatorName ? (
          <p className={styles.hudOperator}>
            {t("games.cryptography_action_operator", "OPERATOR:")} <strong>{operatorName}</strong>
          </p>
        ) : null}
        {stats.length > 0 && (
          <div className={styles.hudStats}>
            {stats.map((s) => (
              <span
                key={s.text}
                className={`${styles.statPill} ${
                  s.tone === "success"
                    ? styles.statPillSuccess
                    : s.tone === "warning"
                      ? styles.statPillWarning
                      : ""
                }`}
              >
                {s.text} {s.value}
              </span>
            ))}
          </div>
        )}
      </div>

      <div
        className={`${styles.timer} ${critical ? styles.timerCritical : ""} ${
          !running ? styles.timerPaused : ""
        }`}
      >
        {countdown ?? totalTime}s
      </div>
    </div>
  );
}
