import { useEffect, useRef } from "react";
import playhomeIcon from "../../assets/brand/playhome-icon.png";
import { useI18n } from "../../i18n";
import styles from "./appDownloadModal.module.css";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.usuper.playhome";

export function AppDownloadModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="download-modal-title"
        aria-describedby="download-modal-description"
      >
        <button
          ref={closeButtonRef}
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label={t("site.downloadModalClose", "Not now")}
        >
          ×
        </button>

        <div className={styles.brandRow}>
          <img src={playhomeIcon} alt="PlayHome" className={styles.icon} />
          <span className={styles.badge}>
            {t("site.downloadModalBadge", "AVAILABLE ON GOOGLE PLAY")}
          </span>
        </div>

        <h2 id="download-modal-title">
          {t("site.downloadModalTitle", "Take PlayHome with you")}
        </h2>
        <p id="download-modal-description" className={styles.description}>
          {t(
            "site.downloadModalBody",
            "Play offline, bring your friends together and enjoy the full PlayHome experience in the palm of your hand.",
          )}
        </p>

        <a
          className={styles.downloadButton}
          href={PLAY_STORE_URL}
          target="_blank"
          rel="noreferrer"
          onClick={onClose}
        >
          <span className={styles.playIcon} aria-hidden="true">▶</span>
          {t("site.downloadModalCta", "Get it on Google Play")}
          <span aria-hidden="true">↗</span>
        </a>
        <small className={styles.note}>
          {t("site.downloadModalNote", "Free to download")}
        </small>
      </section>
    </div>
  );
}
