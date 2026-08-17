"use client";

/**
 * The live-action ocean backdrop.
 *
 * This is the prototype of the video direction: real footage of breaking waves
 * behind the invitation's DOM panels, in place of the procedural 3D sea. It exists
 * because the 3D scene's water, sand and sky were judged not "thơ mộng" enough,
 * and the three things it was weakest at — moving water, foam, and light
 * scattering on a wave face — are precisely the three that a photograph gets for
 * free and a real-time shader has to fake.
 *
 * The backdrop deliberately owns *only* the background. It renders no invitation
 * content, so it can be dropped in behind the existing scene panels without
 * touching the journey controller, the scene residency window, the gesture surface
 * or any test id.
 */

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import {
  resolveBeachFmvFraming,
  resolveBeachFmvTransform,
} from "./beach-fmv-camera";
import styles from "./beach-wedding-journey.module.css";

const VIDEO_ROOT = "/chungdoi/labs/beach-wedding-journey/video";

/**
 * The desktop and mobile renditions, and the poster that stands in for both.
 *
 * The desktop file is 2560x1440 rather than 1280x720, which is what makes the
 * synthetic camera possible *and* fixes the softness the 1280 prototype had: at a
 * 1398px container on a 2x display the old file was being upscaled 2.18x, so it
 * could not have looked sharp however it was encoded. The camera window samples
 * roughly 1843px of real source at the base framing, which beats the same viewport
 * even before the window is widened.
 */
export const BEACH_VIDEO_DESKTOP_SRC = `${VIDEO_ROOT}/ocean-fmv-2560.mp4`;
export const BEACH_VIDEO_MOBILE_SRC = `${VIDEO_ROOT}/ocean-fmv-1280.mp4`;
export const BEACH_VIDEO_POSTER_SRC = `${VIDEO_ROOT}/ocean-loop-poster.webp`;

/**
 * Viewport width below which the 720-wide rendition is used, in pixels.
 *
 * Matches the `md` breakpoint the rest of Chung Đôi uses.
 */
const MOBILE_MAX_WIDTH_PX = 768;
const MOBILE_QUERY = `(max-width: ${MOBILE_MAX_WIDTH_PX}px)`;

/**
 * Read through `useSyncExternalStore` rather than resolved in an effect.
 *
 * Which rendition to serve is *derived* from the viewport, not state the component
 * owns, and setting it from an effect renders once with no source at all — which
 * meant the first paint had no backdrop. Matching the reduced-motion store in
 * `beach-wedding-journey-lab.tsx` also means the value is correct during the very
 * first render, including on the server.
 */
function subscribeMobileQuery(onStoreChange: () => void): () => void {
  const query = window.matchMedia(MOBILE_QUERY);
  query.addEventListener("change", onStoreChange);
  return () => query.removeEventListener("change", onStoreChange);
}

function mobileQuerySnapshot(): boolean {
  return window.matchMedia(MOBILE_QUERY).matches;
}

/**
 * Desktop on the server.
 *
 * The wrong guess costs a larger file on a phone for one render, where guessing
 * mobile would cost a visibly soft video on a desktop — and the video only starts
 * loading on the client anyway.
 */
function serverMobileQuerySnapshot(): boolean {
  return false;
}

export type BeachVideoBackdropProps = {
  /**
   * Parallax look offsets, in degrees, from the journey's own look state.
   *
   * The guest can only drag +/-20deg horizontally and +/-8deg vertically (see
   * `beachWeddingJourneyDefinition.look`), which is the whole reason a flat video
   * works here at all: within a window that narrow there is no perspective change
   * a real camera move would have produced, so nudging the frame is enough. This
   * rides *on top of* the per-scene camera framing below.
   */
  readonly look: {
    readonly pitchDegrees: number;
    readonly yawDegrees: number;
  };
  readonly reducedMotion: boolean;
  /**
   * The scene the camera is framing, which selects the vantage point.
   *
   * Passing the scene type rather than a framing keeps the route in one authored
   * place (`beach-fmv-camera.ts`) instead of spread across callers.
   */
  readonly sceneType: string;
  /**
   * Whether the journey is between scenes.
   *
   * Drives the move's duration: travelling eases over `CAMERA_MOVE_MS`, and once
   * settled the window is stationary — the camera holds while the water keeps
   * moving, which is the whole point of the FMV pattern.
   */
  readonly travelling: boolean;
};

/**
 * How long the camera takes to reach the next vantage point, in milliseconds.
 *
 * Matched to the DOM renderer's own 650ms travel (see the fallback arrive timer in
 * `beach-wedding-journey-lab.tsx`) so the backdrop and the panels finish together
 * rather than the camera still drifting after the text has settled.
 */
const CAMERA_MOVE_MS = 650;

/** Reduced motion still changes vantage point, but cuts rather than glides. */
const CAMERA_MOVE_REDUCED_MS = 180;

export function BeachVideoBackdrop({
  look,
  reducedMotion,
  sceneType,
  travelling,
}: BeachVideoBackdropProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [failed, setFailed] = useState(false);
  const mobile = useSyncExternalStore(
    subscribeMobileQuery,
    mobileQuerySnapshot,
    serverMobileQuerySnapshot,
  );
  const source = mobile ? BEACH_VIDEO_MOBILE_SRC : BEACH_VIDEO_DESKTOP_SRC;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (reducedMotion) {
      // Pausing is not enough on its own: a paused video still shows whichever
      // frame it stopped on, so seeking to zero makes the still match the poster.
      video.pause();
      video.currentTime = 0;
      return;
    }

    // `play()` rejects when autoplay is blocked — on iOS that happens if either
    // `muted` or `playsInline` is missing, and in some desktop power-saving modes
    // regardless. The poster stays visible underneath, so a rejection degrades to
    // a still photograph rather than to a black rectangle.
    void video.play().catch(() => undefined);
  }, [reducedMotion, source]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    // The per-scene camera framing, and the guest's own look nudge on top of it.
    // Both are written as custom properties so the CSS owns how they compose —
    // the camera move is a transition on one variable set, the look nudge is a
    // separate untransitioned pair, and keeping them apart is what stops a drag
    // from inheriting the camera's 650ms easing and feeling laggy.
    const framing = resolveBeachFmvFraming(sceneType);
    const camera = resolveBeachFmvTransform(framing);

    frame.style.setProperty("--beach-camera-x", `${camera.offsetXPercent}%`);
    frame.style.setProperty("--beach-camera-y", `${camera.offsetYPercent}%`);
    frame.style.setProperty("--beach-camera-scale", `${camera.scale}`);
    frame.style.setProperty(
      "--beach-camera-duration",
      `${reducedMotion ? CAMERA_MOVE_REDUCED_MS : CAMERA_MOVE_MS}ms`,
    );
    frame.style.setProperty("--beach-look-x", `${look.yawDegrees * -0.55}px`);
    frame.style.setProperty("--beach-look-y", `${look.pitchDegrees * 0.4}px`);
  }, [look.pitchDegrees, look.yawDegrees, reducedMotion, sceneType]);

  return (
    <div
      aria-hidden="true"
      className={styles.videoBackdrop}
      data-beach-video-backdrop
      data-camera-scene={sceneType}
      data-camera-travelling={travelling ? "true" : "false"}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      data-video-failed={failed ? "true" : "false"}
      ref={frameRef}
    >
      {/*
        Camera gate. The media inside is sized to `1 / BEACH_FMV_WINDOW_SCALE` of
        this element, so this box is the aperture and the footage slides behind it.
      */}
      <div className={styles.videoBackdropGate} data-beach-camera-gate>
        {failed ? (
          // After a load failure the poster is the backdrop. A plain background
          // image rather than `next/image` because it fills a decorative layer at
          // an unknown aspect ratio, which is what `background-size: cover` is for.
          <div className={styles.videoBackdropPoster} />
        ) : (
          <video
            className={styles.videoBackdropMedia}
            disablePictureInPicture
            disableRemotePlayback
            loop
            muted
            onError={() => setFailed(true)}
            playsInline
            poster={BEACH_VIDEO_POSTER_SRC}
            // `auto` rather than `metadata`: this is the scene, not an optional
            // embed, and a poster-then-video pop is exactly what buffering causes.
            preload="auto"
            ref={videoRef}
            src={source}
          />
        )}
      </div>
      {/* Scrim: the footage is bright and the panels carry dark text, so without
          this the invitation loses contrast against foam. Above the video, below
          the content. */}
      <div className={styles.videoBackdropScrim} />
    </div>
  );
}
