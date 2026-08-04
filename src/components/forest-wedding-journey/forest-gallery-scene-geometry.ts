/**
 * Authored dimensions for the gallery easel. The mount width is load-bearing:
 * the mobile framing tests budget the camera field of view around it, so the
 * silhouette may gain depth and legs but never grow wider.
 */
export const FOREST_GALLERY_MOUNT_SIZE = [0.76, 1.06] as const;

export const FOREST_GALLERY_EASEL = Object.freeze({
  /** Height of the cross brace the mount rests on. */
  braceHeight: 0.48,
  braceThickness: 0.055,
  braceWidth: 0.62,
  legHeight: 1.14,
  /** Distance from centre to the outer face of each leg. */
  legOuterX: 0.3,
  legThickness: 0.055,
  /** Lean applied to each leg, in radians per unit of x. */
  legTilt: 0.18,
  mountDepth: 0.075,
  mountHeight: 1.02,
  /** How far in front of the mount centre the print sits. */
  printOffsetZ: 0.045,
});
