"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";

import {
  isValidForestGiftAccount,
  orderForestFamilySides,
  type ForestFamilySide,
  type ForestJourneyContent,
  type ForestJourneySceneType,
  type ForestJourneyWishEntry,
} from "@/data/forest-wedding-journey";

import type { ForestSceneLabels } from "./forest-scene-content";
import styles from "./forest-wedding-journey.module.css";

export type ForestRsvpAttendance = "no" | "yes";
export const FOREST_LAB_FAILURE_SENTINEL = "__forest_lab_failure__";

export function googleMapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export type ForestRsvpStatus =
  | "failure"
  | "idle"
  | "name-required"
  | "party-invalid"
  | "success";

export type ForestRsvpDraft = {
  readonly attendance: ForestRsvpAttendance;
  readonly guestName: string;
  readonly notes: string;
  readonly partySize: string;
};

export type ForestRsvpSubmission = {
  readonly attendance: ForestRsvpAttendance;
  readonly guestName: string;
  readonly notes: string;
  readonly partySize: number;
};

export type ForestWishDraft = {
  readonly message: string;
  readonly name: string;
};

export type ForestWishStatus = "failure" | "idle" | "required" | "success";

export type ForestJourneyLocalInteractions = {
  readonly mapExpanded: boolean;
  readonly openGiftSide: ForestFamilySide | null;
  readonly closeGift: () => void;
  readonly openGift: (side: ForestFamilySide) => void;
  readonly rsvpDraft: ForestRsvpDraft;
  readonly rsvpStatus: ForestRsvpStatus;
  readonly setRsvpAttendance: (value: ForestRsvpAttendance) => void;
  readonly setRsvpGuestName: (value: string) => void;
  readonly setRsvpNotes: (value: string) => void;
  readonly setRsvpPartySize: (value: string) => void;
  readonly setMapExpanded: (value: boolean) => void;
  readonly submitRsvp: () => void;
  readonly submittedRsvp: ForestRsvpSubmission | null;
  readonly setWishMessage: (value: string) => void;
  readonly setWishName: (value: string) => void;
  readonly submitWish: () => void;
  readonly wishDraft: ForestWishDraft;
  readonly wishes: readonly ForestJourneyWishEntry[];
  readonly wishStatus: ForestWishStatus;
};

export function useForestJourneyLocalInteractions(
  initialWishes: readonly ForestJourneyWishEntry[],
): ForestJourneyLocalInteractions {
  const [mapExpanded, setMapExpanded] = useState(false);
  const [openGiftSide, setOpenGiftSide] = useState<ForestFamilySide | null>(null);
  const [rsvpDraft, setRsvpDraft] = useState<ForestRsvpDraft>({
    attendance: "yes",
    guestName: "",
    notes: "",
    partySize: "1",
  });
  const [rsvpStatus, setRsvpStatus] = useState<ForestRsvpStatus>("idle");
  const [submittedRsvp, setSubmittedRsvp] = useState<ForestRsvpSubmission | null>(null);
  const [wishDraft, setWishDraft] = useState<ForestWishDraft>({ message: "", name: "" });
  const [wishStatus, setWishStatus] = useState<ForestWishStatus>("idle");
  const [wishes, setWishes] = useState<readonly ForestJourneyWishEntry[]>(() => [
    ...initialWishes,
  ]);
  const nextWishIdRef = useRef(initialWishes.length + 1);
  const setRsvpGuestName = useCallback((guestName: string) => {
    setRsvpDraft((draft) => ({ ...draft, guestName }));
  }, []);
  const openGift = useCallback((side: ForestFamilySide) => {
    setOpenGiftSide(side);
  }, []);
  const closeGift = useCallback(() => {
    setOpenGiftSide(null);
  }, []);
  const setRsvpAttendance = useCallback((attendance: ForestRsvpAttendance) => {
    setRsvpDraft((draft) => ({ ...draft, attendance }));
  }, []);
  const setRsvpPartySize = useCallback((partySize: string) => {
    setRsvpDraft((draft) => ({ ...draft, partySize }));
  }, []);
  const setRsvpNotes = useCallback((notes: string) => {
    setRsvpDraft((draft) => ({ ...draft, notes }));
  }, []);
  const submitRsvp = useCallback(() => {
    const guestName = rsvpDraft.guestName.trim();
    if (!guestName) {
      setRsvpStatus("name-required");
      return;
    }

    if (guestName === FOREST_LAB_FAILURE_SENTINEL) {
      setRsvpStatus("failure");
      return;
    }

    const partySize = Number(rsvpDraft.partySize);
    if (!Number.isInteger(partySize) || partySize < 1 || partySize > 10) {
      setRsvpStatus("party-invalid");
      return;
    }

    setSubmittedRsvp({
      attendance: rsvpDraft.attendance,
      guestName,
      notes: rsvpDraft.notes.trim(),
      partySize,
    });
    setRsvpStatus("success");
  }, [rsvpDraft]);
  const setWishName = useCallback((name: string) => {
    setWishDraft((draft) => ({ ...draft, name }));
  }, []);
  const setWishMessage = useCallback((message: string) => {
    setWishDraft((draft) => ({ ...draft, message }));
  }, []);
  const submitWish = useCallback(() => {
    const name = wishDraft.name.trim();
    const message = wishDraft.message.trim();
    if (!name || !message) {
      setWishStatus("required");
      return;
    }

    if (message === FOREST_LAB_FAILURE_SENTINEL) {
      setWishStatus("failure");
      return;
    }

    const id = `local-wish-${String(nextWishIdRef.current).padStart(2, "0")}`;
    nextWishIdRef.current += 1;
    setWishes((entries) => [...entries, { id, message, name }]);
    setWishDraft({ message: "", name: "" });
    setWishStatus("success");
  }, [wishDraft]);

  return useMemo(() => ({
    closeGift,
    mapExpanded,
    openGift,
    openGiftSide,
    rsvpDraft,
    rsvpStatus,
    setRsvpAttendance,
    setRsvpGuestName,
    setRsvpNotes,
    setRsvpPartySize,
    setMapExpanded,
    submitRsvp,
    submitWish,
    submittedRsvp,
    setWishMessage,
    setWishName,
    wishDraft,
    wishes,
    wishStatus,
  }), [
    closeGift,
    mapExpanded,
    openGift,
    openGiftSide,
    rsvpDraft,
    rsvpStatus,
    setRsvpAttendance,
    setRsvpGuestName,
    setRsvpNotes,
    setRsvpPartySize,
    setMapExpanded,
    submitRsvp,
    submitWish,
    submittedRsvp,
    setWishMessage,
    setWishName,
    wishDraft,
    wishes,
    wishStatus,
  ]);
}

function GiftSceneContent({
  content,
  interactions,
  labels,
}: {
  readonly content: ForestJourneyContent;
  readonly interactions: ForestJourneyLocalInteractions;
  readonly labels: ForestSceneLabels;
}) {
  const envelopeRefs = useRef<Record<ForestFamilySide, HTMLButtonElement | null>>({
    bride: null,
    groom: null,
  });
  const accounts = orderForestFamilySides(content.brideFirst).flatMap((side) => {
    const account = content.giftAccounts.find((candidate) => candidate.side === side);
    return account && isValidForestGiftAccount(account, content) ? [account] : [];
  });
  const openAccount = accounts.find((account) => account.side === interactions.openGiftSide);
  const handleClose = () => {
    const side = interactions.openGiftSide;
    interactions.closeGift();
    if (side) envelopeRefs.current[side]?.focus();
  };

  if (accounts.length === 0) {
    return <p role="status">{labels.giftUnavailable}</p>;
  }

  return (
    <div
      className={styles.giftEnvelopes}
      data-forest-interactive="true"
      data-testid="forest-gift-envelopes"
    >
      <div className={styles.giftEnvelopeButtons}>
        {accounts.map((account) => (
          <button
            data-gift-side={account.side}
            data-testid="forest-gift-envelope"
            key={account.side}
            onClick={() => interactions.openGift(account.side)}
            ref={(element) => {
              envelopeRefs.current[account.side] = element;
            }}
            type="button"
          >
            <span>{labels.openGift}</span>
            <strong>{account.accountName}</strong>
          </button>
        ))}
      </div>
      {openAccount ? (
        <section
          className={styles.giftDetails}
          data-gift-side={openAccount.side}
          data-testid="forest-gift-details"
        >
          <dl>
            <div>
              <dt>{labels.bankName}</dt>
              <dd>{openAccount.bankName}</dd>
            </div>
            <div>
              <dt>{labels.accountHolder}</dt>
              <dd>{openAccount.accountName}</dd>
            </div>
            <div>
              <dt>{labels.accountNumber}</dt>
              <dd>{openAccount.accountNumber}</dd>
            </div>
          </dl>
          <button onClick={handleClose} type="button">{labels.closeGift}</button>
        </section>
      ) : null}
    </div>
  );
}

function MapSceneContent({
  content,
  interactions,
  labels,
}: {
  readonly content: ForestJourneyContent;
  readonly interactions: ForestJourneyLocalInteractions;
  readonly labels: ForestSceneLabels;
}) {
  const query = content.mapQuery.trim() || content.venueAddress.trim();

  return (
    <div
      className={styles.mapPaper}
      data-forest-interactive="true"
      data-testid="forest-map-paper"
    >
      {query ? (
        <>
          <details
            data-testid="forest-map-disclosure"
            onToggle={(event) => interactions.setMapExpanded(event.currentTarget.open)}
            open={interactions.mapExpanded}
          >
            <summary>{query}</summary>
            <div aria-hidden="true" className={styles.localMapDrawing}>
              <span />
              <span />
              <span />
            </div>
          </details>
          <a href={googleMapsSearchUrl(query)} rel="noreferrer" target="_blank">
            {labels.directions}
          </a>
        </>
      ) : (
        <p role="status">{labels.mapUnavailable}</p>
      )}
    </div>
  );
}

function RsvpSceneContent({
  interactions,
  labels,
}: {
  readonly interactions: ForestJourneyLocalInteractions;
  readonly labels: ForestSceneLabels;
}) {
  const statusMessage = interactions.rsvpStatus === "name-required"
    ? labels.rsvpNameRequired
    : interactions.rsvpStatus === "party-invalid"
      ? labels.rsvpGuestsInvalid
    : interactions.rsvpStatus === "failure"
      ? labels.formError
    : interactions.rsvpStatus === "success"
      ? labels.rsvpSuccess
      : "";
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    interactions.submitRsvp();
  };

  return (
    <form
      className={styles.rsvpForm}
      data-forest-interactive="true"
      data-testid="forest-rsvp-form"
      noValidate
      onSubmit={handleSubmit}
    >
      <label>
        <span>{labels.rsvpName}</span>
        <input
          name="guestName"
          onChange={(event) => interactions.setRsvpGuestName(event.target.value)}
          value={interactions.rsvpDraft.guestName}
        />
      </label>
      <label>
        <span>{labels.rsvpAttendance}</span>
        <select
          name="attendance"
          onChange={(event) => interactions.setRsvpAttendance(
            event.target.value === "no" ? "no" : "yes",
          )}
          value={interactions.rsvpDraft.attendance}
        >
          <option value="yes">{labels.attendingYes}</option>
          <option value="no">{labels.attendingNo}</option>
        </select>
      </label>
      <label>
        <span>{labels.rsvpGuests}</span>
        <input
          max={10}
          min={1}
          name="partySize"
          onChange={(event) => interactions.setRsvpPartySize(event.target.value)}
          type="number"
          value={interactions.rsvpDraft.partySize}
        />
      </label>
      <label>
        <span>{labels.rsvpNotes}</span>
        <textarea
          name="notes"
          onChange={(event) => interactions.setRsvpNotes(event.target.value)}
          value={interactions.rsvpDraft.notes}
        />
      </label>
      <button type="submit">{labels.rsvpSubmit}</button>
      <p aria-live="polite" role="status">{statusMessage}</p>
      {interactions.submittedRsvp ? (
        <p data-testid="forest-rsvp-submission">
          {interactions.submittedRsvp.guestName}
        </p>
      ) : null}
    </form>
  );
}

function WishesSceneContent({
  interactions,
  labels,
}: {
  readonly interactions: ForestJourneyLocalInteractions;
  readonly labels: ForestSceneLabels;
}) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    interactions.submitWish();
  };

  return (
    <div
      className={styles.wishesGuestbook}
      data-forest-interactive="true"
      data-testid="forest-wishes-guestbook"
    >
      <div className={styles.wishNotes} data-testid="forest-wish-notes">
        {interactions.wishes.map((wish) => (
          <article data-testid="forest-wish-note" key={wish.id}>
            <p>{wish.message}</p>
            <cite>{wish.name}</cite>
          </article>
        ))}
      </div>
      <form className={styles.wishForm} noValidate onSubmit={handleSubmit}>
        <label>
          <span>{labels.wishName}</span>
          <input
            name="wishName"
            onChange={(event) => interactions.setWishName(event.target.value)}
            value={interactions.wishDraft.name}
          />
        </label>
        <label>
          <span>{labels.wishText}</span>
          <textarea
            name="wishMessage"
            onChange={(event) => interactions.setWishMessage(event.target.value)}
            value={interactions.wishDraft.message}
          />
        </label>
        <button type="submit">{labels.wishSubmit}</button>
        <p aria-live="polite" role="status">
          {interactions.wishStatus === "success"
            ? labels.wishSuccess
            : interactions.wishStatus === "required"
              ? labels.wishRequired
              : interactions.wishStatus === "failure"
                ? labels.formError
                : ""}
        </p>
      </form>
    </div>
  );
}

export function ForestInteractiveSceneContent({
  content,
  interactions,
  labels,
  sceneType,
}: {
  readonly content: ForestJourneyContent;
  readonly interactions: ForestJourneyLocalInteractions;
  readonly labels: ForestSceneLabels;
  readonly sceneType: ForestJourneySceneType;
}) {
  if (sceneType === "map") {
    return (
      <MapSceneContent
        content={content}
        interactions={interactions}
        labels={labels}
      />
    );
  }

  if (sceneType === "gift") {
    return (
      <GiftSceneContent
        content={content}
        interactions={interactions}
        labels={labels}
      />
    );
  }

  if (sceneType === "rsvp") {
    return <RsvpSceneContent interactions={interactions} labels={labels} />;
  }

  if (sceneType === "wishes") {
    return <WishesSceneContent interactions={interactions} labels={labels} />;
  }

  return null;
}
