// Copied from src/components/forest-wedding-journey/forest-journey-loading.tsx. Fixes to
// journey mechanics must be applied to both.

import styles from "./beach-wedding-journey.module.css";

export type BeachJourneyLoadingProps = {
  body: string;
  enter: string;
  firstName: string;
  formattedReceptionDate: string;
  kicker: string;
  loading: string;
  receptionDate: string;
  secondName: string;
};

export function BeachJourneyLoading({
  body,
  enter,
  firstName,
  formattedReceptionDate,
  kicker,
  loading,
  receptionDate,
  secondName,
}: BeachJourneyLoadingProps) {
  return (
    <section className={styles.entry} aria-labelledby="beach-journey-entry-title">
      <div className={styles.entryCard}>
        <p className={styles.kicker}>{kicker}</p>
        <h1
          className={styles.names}
          data-testid="beach-journey-couple"
          id="beach-journey-entry-title"
        >
          <span>{firstName}</span>
          <span>&amp;</span>
          <span>{secondName}</span>
        </h1>
        <div className={styles.dates}>
          <time dateTime={receptionDate}>{formattedReceptionDate}</time>
        </div>
        <p className={styles.body}>{body}</p>
        <p className={styles.loading} role="status">
          {loading}
        </p>
        <button className={styles.enter} data-testid="beach-journey-enter" disabled type="button">
          {enter}
        </button>
      </div>
    </section>
  );
}
