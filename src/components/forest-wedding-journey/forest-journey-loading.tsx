import styles from "./forest-wedding-journey.module.css";

export type ForestJourneyLoadingProps = {
  body: string;
  enter: string;
  firstName: string;
  formattedReceptionDate: string;
  kicker: string;
  loading: string;
  receptionDate: string;
  secondName: string;
};

export function ForestJourneyLoading({
  body,
  enter,
  firstName,
  formattedReceptionDate,
  kicker,
  loading,
  receptionDate,
  secondName,
}: ForestJourneyLoadingProps) {
  return (
    <section className={styles.entry} aria-labelledby="forest-journey-entry-title">
      <div className={styles.entryCard}>
        <p className={styles.kicker}>{kicker}</p>
        <h1
          className={styles.names}
          data-testid="forest-journey-couple"
          id="forest-journey-entry-title"
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
        <button className={styles.enter} data-testid="forest-journey-enter" disabled type="button">
          {enter}
        </button>
      </div>
    </section>
  );
}
