import styles from "./newHostModal.module.css";
import { useI18n } from "../../../../../i18n";

export function NewHostModal({ onConfirm }: { onConfirm: () => void }) {
  const { t } = useI18n();

  return (
    <div className={styles.overlay}>
      <div className={`glass-panel ${styles.modal}`}>
        <div className={styles.scanEffect} />

        <div className={styles.content}>
          <div className={styles.iconWrapper}>
            <span className={styles.mainIcon}>👨‍✈️</span>
            <div className={styles.ring} />
          </div>

          <header className={styles.header}>
            <div className={styles.alertBadge}>
              {t("games.impostor_host_systemUpdated", "SYSTEM UPDATED")}
            </div>
            <h2 className={styles.title}>
              {t("games.impostor_host_command", "COMMAND")}{" "}
              <span>{t("games.impostor_host_transferred", "TRANSFERRED")}</span>
            </h2>
          </header>

          <div className={styles.infoBox}>
            <p className={styles.mainText}>
              {t(
                "games.impostor_host_previousDisconnected",
                "The previous host lost connection to the station.",
              )}
            </p>
            <div className={styles.promotionBadge}>
              {t(
                "games.impostor_host_promoted",
                "YOU HAVE BEEN PROMOTED TO MISSION HOST",
              )}
            </div>
          </div>

          <button className={styles.confirmBtn} onClick={onConfirm}>
            {t("games.impostor_host_takeControl", "TAKE CONTROL")} 🚀
          </button>
        </div>
      </div>
    </div>
  );
}
