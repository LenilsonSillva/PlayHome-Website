import { Link } from "react-router-dom";
import type { Game } from "../../types/game";
import { useI18n } from "../../i18n";
import styles from "./GameCard.module.css";

type Props = {
  game: Game & { icon: string; accent: string; btn: string; mode: "local" | "online" };
};

export function GameCard({ game }: Props) {
  const { t } = useI18n();

  return (
    <article
      className={`${styles.card} ${game.id === "impostor" ? styles.impostor : styles.crypto}`}
      style={
        {
          "--accent": game.accent,
          "--btn-grad": game.btn,
        } as React.CSSProperties
      }
    >
      <div className={styles.cardGrid} aria-hidden="true" />
      <div className={styles.cardTopline}>
        <span className={styles.protocol}>0{game.id === "impostor" ? "1" : "2"} / PLAYHOME</span>
        <span className={styles.status}><i />{t("site.active", "active now")}</span>
      </div>

      <div className={styles.visualRow}>
        <div className={styles.iconBox} aria-hidden="true">{game.icon}</div>
        <div className={styles.playerBadge}>
          <strong>{game.minPlayers}-{game.maxPlayers}</strong>
          <span>{t("site.players", "players")}</span>
        </div>
      </div>

      <div className={styles.content}>
        <p className={styles.eyebrow}>{game.id === "impostor" ? t("home.card_typeMystery", "SOCIAL DEDUCTION") : t("home.card_typeCode", "WORD & STRATEGY")}</p>
        <h2 className={styles.title}>{game.name}</h2>
        <p className={styles.desc}>{game.description}</p>
      </div>

      <Link to={`${game.route}?mode=${game.mode}`} className={styles.link}>
        <button className={styles.playBtn} type="button">
          <span>{t("site.launch", "Open game")}</span>
          <span className={styles.arrow} aria-hidden="true">↗</span>
        </button>
      </Link>
    </article>
  );
}
