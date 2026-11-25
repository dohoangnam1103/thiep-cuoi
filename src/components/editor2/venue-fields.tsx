"use client";

import { ChevronDown, ExternalLink, RotateCcw } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { resolveVisualGoogleMapsLink } from "@/app/editor2/actions";
import { InvitationMap, directionsUrl } from "@/components/chungdoi-tpl-shared";
import { isGoogleMapsShortUrl, isGoogleMapsUrl, MAX_GOOGLE_MAPS_URL_LENGTH } from "@/lib/google-maps";
import { MAX_VENUE_ADDRESS_LENGTH, venueMapQuery } from "@/lib/venue-address";

/** Address-first map editing, following thiep 2's PartyMapField interaction. */
export function Editor2VenueFields({ invitationId, venueName, address, onAddressChange, mapValue, onMapChange, children }: {
  invitationId: string; venueName: string; address: string; mapValue: string;
  onAddressChange: (value: string) => void; onMapChange: (value: string) => void; children: ReactNode;
}) {
  const t = useTranslations("editor.venue");
  const editorT = useTranslations("editor2");
  const bodyId = useId();
  const details = useRef<HTMLDetailsElement>(null);
  const summary = useRef<HTMLElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const addressInput = useRef<HTMLTextAreaElement>(null);
  const addressRequest = useRef(0);
  const request = useRef(0);
  const [initialOverrideOpen] = useState(() => Boolean(mapValue.trim()));
  const [linkError, setLinkError] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolvingAddress, setResolvingAddress] = useState(false);
  const [addressLinkError, setAddressLinkError] = useState(false);
  const override = mapValue.trim();
  const usingOverride = Boolean(override) && !linkError && !isGoogleMapsShortUrl(override)
    && (!/^https?:\/\//i.test(override) || isGoogleMapsUrl(override));
  const effectiveQuery = venueMapQuery(venueName, address, usingOverride ? override : "");
  const [previewQuery, setPreviewQuery] = useState(effectiveQuery);

  useEffect(() => {
    const timer = window.setTimeout(() => setPreviewQuery(effectiveQuery), 500);
    return () => window.clearTimeout(timer);
  }, [effectiveQuery]);

  async function resolveAddress() {
    const source = addressInput.current?.value.trim() ?? "";
    if (!isGoogleMapsShortUrl(source)) return;
    const current = ++addressRequest.current;
    setResolvingAddress(true);
    setAddressLinkError(false);
    try {
      const result = await resolveVisualGoogleMapsLink(invitationId, source);
      if (addressRequest.current !== current || addressInput.current?.value.trim() !== source) return;
      if (result.valid && result.resolved) onAddressChange(result.url);
      else setAddressLinkError(true);
    } catch {
      if (addressRequest.current === current && addressInput.current?.value.trim() === source) setAddressLinkError(true);
    } finally {
      if (addressRequest.current === current) setResolvingAddress(false);
    }
  }

  async function resolveLink() {
    const source = input.current?.value.trim() ?? "";
    const current = ++request.current;
    setResolving(false);
    if (!source || !isGoogleMapsShortUrl(source)) {
      setLinkError(/^https?:\/\//i.test(source) && !isGoogleMapsUrl(source));
      return;
    }
    setResolving(true);
    setLinkError(false);
    try {
      const result = await resolveVisualGoogleMapsLink(invitationId, source);
      if (request.current !== current || !input.current?.isConnected || input.current.value.trim() !== source) return;
      if (!result.valid || !result.resolved) { setLinkError(true); return; }
      onMapChange(result.url);
      setPreviewQuery(venueMapQuery(venueName, address, result.url));
    } catch {
      if (request.current === current) setLinkError(true);
    } finally {
      if (request.current === current) setResolving(false);
    }
  }

  function useAddress() {
    request.current++;
    onMapChange("");
    setLinkError(false);
    setResolving(false);
    setPreviewQuery(venueMapQuery(venueName, address));
    if (details.current) details.current.open = false;
    summary.current?.focus();
  }

  return <div className="e2-dialog-fields">
    {children}
    <label className="e2-field"><span>{editorT("fields.address")}</span>
      <textarea ref={addressInput} id="e2-address" name="address" value={address} maxLength={MAX_GOOGLE_MAPS_URL_LENGTH}
        aria-label={editorT("fields.address")} aria-invalid={addressLinkError || undefined} aria-describedby={`${bodyId}-address-hint`}
        onChange={event => {
          const value = event.target.value;
          addressRequest.current++;
          setResolvingAddress(false);
          setAddressLinkError(false);
          onAddressChange(isGoogleMapsUrl(value) ? value : value.slice(0, MAX_VENUE_ADDRESS_LENGTH));
        }}
        onBlur={() => void resolveAddress()} />
    </label>
    <p id={`${bodyId}-address-hint`} className={addressLinkError ? "e2-error" : "e2-description"}
      role={addressLinkError ? "alert" : resolvingAddress ? "status" : undefined}>
      {resolvingAddress ? t("resolving") : addressLinkError ? t("linkError") : t("addressHint")}
    </p>
    <section className="e2-map-preview" aria-label={t("previewTitle")}>
      <header className="e2-map-preview-head">
        <div><strong>{t("previewTitle")}</strong><p className="e2-description">{usingOverride ? t("usingOverride") : t("usingAddress")}</p></div>
        {effectiveQuery && <a href={directionsUrl(effectiveQuery)} target="_blank" rel="noopener noreferrer" className="e2-map-open">
          {t("openMaps")}<ExternalLink size={13} aria-hidden="true" />
        </a>}
      </header>
      {previewQuery ? <InvitationMap query={previewQuery} title={t("previewIframeTitle")} className="e2-map-frame" />
        : <p className="e2-map-empty">{t("emptyPreview")}</p>}
    </section>
    <details ref={details} open={initialOverrideOpen} className="e2-map-override">
      <summary ref={summary} aria-controls={bodyId} className="e2-map-toggle">
        <span><strong>{t("overrideTitle")}</strong><span className="e2-description">{t("overrideDescription")}</span></span>
        <ChevronDown size={18} aria-hidden="true" />
      </summary>
      <div id={bodyId} className="e2-map-override-body">
        <label className="e2-field"><span>{editorT("fields.mapAddress")}</span>
          <input ref={input} id="e2-mapAddress" name="mapAddress" value={mapValue} maxLength={MAX_GOOGLE_MAPS_URL_LENGTH} inputMode="url"
            autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder={t("mapLinkPlaceholder")}
            aria-invalid={linkError || undefined} aria-describedby={`${bodyId}-hint`}
            onChange={event => { request.current++; onMapChange(event.target.value); setLinkError(false); setResolving(false); }}
            onBlur={() => void resolveLink()} />
        </label>
        <p id={`${bodyId}-hint`} className={linkError ? "e2-error" : "e2-description"} role={linkError ? "alert" : resolving ? "status" : undefined}>
          {resolving ? t("resolving") : linkError ? t("linkError") : t("mapLinkHint")}
        </p>
        {mapValue && <button type="button" className="e2-button" onClick={useAddress}><RotateCcw size={14} aria-hidden="true" />{t("useAddressAgain")}</button>}
      </div>
    </details>
  </div>;
}
