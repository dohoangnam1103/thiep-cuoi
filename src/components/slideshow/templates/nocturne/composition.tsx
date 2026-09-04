import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { SlideshowMedia } from "../../core/media";
import type {
  SlideshowCompositionProps,
  SlideshowMediaKind,
  SlideshowScene,
} from "../../core/types";

import styles from "./composition.module.css";

type MediaSpec = {
  alt?: string;
  kind?: SlideshowMediaKind;
  src: string;
};

type SceneArtworkProps = {
  companion: MediaSpec;
  format: SlideshowCompositionProps["format"];
  primary: MediaSpec;
  scene: SlideshowScene;
  third: MediaSpec;
};

const MediaPlaybackContext = createContext(false);

function classNames(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

function textLength(value: string): number {
  return Array.from(value.trim()).length;
}

function primaryMedia(scene: SlideshowScene): MediaSpec {
  return { src: scene.image, kind: scene.imageKind, alt: scene.imageAlt };
}

function secondaryMedia(scene: SlideshowScene, fallback: SlideshowScene): MediaSpec {
  return scene.secondaryImage
    ? {
        src: scene.secondaryImage,
        kind: scene.secondaryImageKind,
        alt: scene.secondaryImageAlt,
      }
    : primaryMedia(fallback);
}

function isDuplicateVideo(media: MediaSpec, ...existing: MediaSpec[]): boolean {
  return media.kind === "video"
    && existing.some((item) => item.kind === "video" && item.src === media.src);
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reduced;
}

function NocturneVideo({
  alt,
  className,
  playing,
  src,
}: {
  alt?: string;
  className: string;
  playing: boolean;
  src: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!playing) {
      video.pause();
      return;
    }
    void video.play().catch(() => undefined);
  }, [playing, src]);

  return (
    <video
      ref={videoRef}
      key={src}
      src={src}
      aria-label={alt || undefined}
      autoPlay={playing}
      muted
      loop
      playsInline
      preload="metadata"
      className={classNames("absolute inset-0 size-full", styles.media, className)}
    />
  );
}

function Photo({
  allowMotion = true,
  className,
  media,
  priority = false,
  sizes,
}: {
  allowMotion?: boolean;
  className: string;
  media: MediaSpec;
  priority?: boolean;
  sizes: string;
}) {
  const playbackEnabled = useContext(MediaPlaybackContext);

  if (media.kind === "video") {
    return (
      <NocturneVideo
        src={media.src}
        alt={media.alt}
        playing={allowMotion && playbackEnabled}
        className={className}
      />
    );
  }

  return (
    <SlideshowMedia
      src={media.src}
      kind="image"
      alt={media.alt}
      priority={priority}
      sizes={sizes}
      className={classNames(styles.media, className)}
    />
  );
}

export function NocturneComposition({
  activeIndex,
  format,
  playing = false,
  scenes,
}: SlideshowCompositionProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const scene = scenes[activeIndex];
  if (!scene) return null;
  const fallback = scenes[(activeIndex + 1) % scenes.length] ?? scene;
  const thirdScene = scenes[(activeIndex + 2) % scenes.length] ?? fallback;
  const primary = primaryMedia(scene);
  const companion = secondaryMedia(scene, fallback);
  const third = primaryMedia(thirdScene);

  return (
    <div
      className={classNames(styles.root, format === "phone" ? styles.phone : styles.tv)}
      data-nocturne-scene={scene.id}
    >
      <AmbientBackdrop media={primary} />
      <div className={styles.lacquerWash} aria-hidden="true" />
      <div className={styles.grain} aria-hidden="true" />
      <MediaPlaybackContext.Provider value={playing && !prefersReducedMotion}>
        <div
          key={`${format}-${scene.id}-${activeIndex}`}
          className={styles.sceneCanvas}
        >
          {renderScene(scene.id, { companion, format, primary, scene, third })}
        </div>
      </MediaPlaybackContext.Provider>
      <NocturneChrome activeIndex={activeIndex} scenes={scenes} />
    </div>
  );
}

function AmbientBackdrop({ media }: { media: MediaSpec }) {
  return (
    <div className={styles.ambient} aria-hidden="true">
      {media.kind !== "video" ? (
        <Photo media={{ ...media, alt: "" }} sizes="100vw" className={styles.ambientMedia} />
      ) : null}
    </div>
  );
}

function renderScene(sceneId: number, props: SceneArtworkProps): ReactNode {
  switch (sceneId) {
    case 1:
      return <Overture {...props} />;
    case 2:
      return <FirstChapter {...props} />;
    case 3:
      return <DiptychChapter {...props} />;
    case 4:
      return <ContactSheet {...props} />;
    case 5:
      return <QuietVow {...props} />;
    case 6:
      return <SaveTheDate {...props} />;
    case 7:
      return <BecomingOne {...props} />;
    default:
      return <Finale {...props} />;
  }
}

function Overture({ companion, format, primary, scene }: SceneArtworkProps) {
  const showCompanion = !isDuplicateVideo(companion, primary);
  return (
    <>
      <div className={classNames(styles.photo, styles.overturePhoto)}>
        <Photo media={primary} priority sizes={format === "tv" ? "68vw" : "100vw"} className={styles.cover} />
      </div>
      {showCompanion ? (
        <div className={classNames(styles.photo, styles.overtureInset)}>
          <Photo allowMotion={false} media={companion} sizes={format === "tv" ? "18vw" : "34vw"} className={styles.cover} />
        </div>
      ) : null}
      <div className={classNames(styles.copy, styles.overtureCopy)}>
        <Eyebrow>{scene.eyebrow}</Eyebrow>
        <CoupleTitle title={scene.title} />
        <FittedCopy className={styles.dateLine}>{scene.caption}</FittedCopy>
      </div>
      <span className={styles.overtureNumber} aria-hidden="true">I</span>
    </>
  );
}

function FirstChapter({ companion, format, primary, scene }: SceneArtworkProps) {
  const showCompanion = !isDuplicateVideo(companion, primary);
  return (
    <>
      <div className={classNames(styles.photo, styles.chapterPortrait)}>
        <Photo media={primary} priority sizes={format === "tv" ? "36vw" : "76vw"} className={styles.coverTop} />
      </div>
      {showCompanion ? (
        <div className={classNames(styles.photo, styles.chapterDetail)}>
          <Photo allowMotion={false} media={companion} sizes={format === "tv" ? "22vw" : "42vw"} className={styles.cover} />
        </div>
      ) : null}
      <div className={classNames(styles.copy, styles.chapterCopy)}>
        <Eyebrow>{scene.eyebrow}</Eyebrow>
        <FittedTitle className={styles.storyTitle}>{scene.title}</FittedTitle>
        <Rule />
        <FittedCopy className={styles.bodyCopy}>{scene.caption}</FittedCopy>
      </div>
      <span className={styles.chapterRoman} aria-hidden="true">II</span>
    </>
  );
}

function DiptychChapter({ companion, format, primary, scene }: SceneArtworkProps) {
  const showCompanion = !isDuplicateVideo(companion, primary);
  return (
    <>
      <div className={classNames(styles.photo, styles.diptychLeft)}>
        <Photo media={primary} priority sizes={format === "tv" ? "39vw" : "68vw"} className={styles.coverTop} />
      </div>
      {showCompanion ? (
        <div className={classNames(styles.photo, styles.diptychRight)}>
          <Photo allowMotion={false} media={companion} sizes={format === "tv" ? "31vw" : "58vw"} className={styles.coverTop} />
        </div>
      ) : null}
      <div className={classNames(styles.copy, styles.diptychCopy)}>
        <Eyebrow>{scene.eyebrow}</Eyebrow>
        <FittedTitle className={styles.storyTitle}>{scene.title}</FittedTitle>
        <FittedCopy className={styles.bodyCopy}>{scene.caption}</FittedCopy>
      </div>
      <span className={styles.diptychMark} aria-hidden="true">&</span>
    </>
  );
}

function ContactSheet({ companion, format, primary, scene, third }: SceneArtworkProps) {
  const showCompanion = !isDuplicateVideo(companion, primary);
  const showThird = !isDuplicateVideo(
    third,
    primary,
    ...(showCompanion ? [companion] : []),
  );
  return (
    <>
      <div className={classNames(styles.photo, styles.contactOne)}>
        <Photo media={primary} priority sizes={format === "tv" ? "33vw" : "68vw"} className={styles.coverTop} />
      </div>
      {showCompanion ? (
        <div className={classNames(styles.photo, styles.contactTwo)}>
          <Photo allowMotion={false} media={companion} sizes={format === "tv" ? "24vw" : "46vw"} className={styles.coverTop} />
        </div>
      ) : null}
      {showThird ? (
        <div className={classNames(styles.photo, styles.contactThree)}>
          <Photo allowMotion={false} media={third} sizes={format === "tv" ? "20vw" : "39vw"} className={styles.coverTop} />
        </div>
      ) : null}
      <div className={classNames(styles.copy, styles.contactCopy)}>
        <Eyebrow>{scene.eyebrow}</Eyebrow>
        <FittedTitle className={styles.contactTitle}>{scene.title}</FittedTitle>
        <FittedCopy className={styles.bodyCopy}>{scene.caption}</FittedCopy>
      </div>
      <div className={styles.contactIndex} aria-hidden="true"><span>04</span><i /></div>
    </>
  );
}

function QuietVow({ format, primary, scene }: SceneArtworkProps) {
  return (
    <>
      <div className={classNames(styles.photo, styles.vowPhoto)}>
        <Photo media={primary} priority sizes={format === "tv" ? "100vw" : "100vw"} className={styles.coverTop} />
      </div>
      <div className={styles.vowShade} aria-hidden="true" />
      <div className={classNames(styles.copy, styles.vowCopy)}>
        <Eyebrow>{scene.eyebrow}</Eyebrow>
        <span className={styles.quoteMark} aria-hidden="true">“</span>
        <FittedTitle className={styles.vowTitle}>{scene.title}</FittedTitle>
        <FittedCopy className={styles.vowCaption}>{scene.caption}</FittedCopy>
      </div>
    </>
  );
}

function SaveTheDate({ companion, format, primary, scene }: SceneArtworkProps) {
  const showCompanion = !isDuplicateVideo(companion, primary);
  return (
    <div className={styles.dateCard}>
      <div className={classNames(styles.photo, styles.datePhoto)}>
        <Photo media={primary} priority sizes={format === "tv" ? "37vw" : "78vw"} className={styles.coverTop} />
      </div>
      {showCompanion ? (
        <div className={classNames(styles.photo, styles.dateSealPhoto)}>
          <Photo allowMotion={false} media={companion} sizes={format === "tv" ? "14vw" : "30vw"} className={styles.cover} />
        </div>
      ) : null}
      <div className={classNames(styles.copy, styles.dateCopy)}>
        <Eyebrow>{scene.eyebrow}</Eyebrow>
        <FittedTitle className={styles.dateTitle}>{scene.title}</FittedTitle>
        <Rule />
        <FittedCopy className={styles.location}>{scene.caption}</FittedCopy>
      </div>
      <span className={styles.dateMonogram} aria-hidden="true">N°06</span>
    </div>
  );
}

function BecomingOne({ companion, format, primary, scene }: SceneArtworkProps) {
  const showCompanion = !isDuplicateVideo(companion, primary);
  return (
    <>
      <div className={classNames(styles.photo, styles.becomingPhoto)}>
        <Photo media={primary} priority sizes={format === "tv" ? "70vw" : "100vw"} className={styles.coverTop} />
      </div>
      {showCompanion ? (
        <div className={classNames(styles.photo, styles.becomingStrip)}>
          <Photo allowMotion={false} media={companion} sizes={format === "tv" ? "19vw" : "34vw"} className={styles.coverTop} />
        </div>
      ) : null}
      <div className={classNames(styles.copy, styles.becomingCopy)}>
        <Eyebrow>{scene.eyebrow}</Eyebrow>
        <CoupleTitle title={scene.title} compact />
        <FittedCopy className={styles.bodyCopy}>{scene.caption}</FittedCopy>
      </div>
      <span className={styles.becomingSeven} aria-hidden="true">07</span>
    </>
  );
}

function Finale({ format, primary, scene }: SceneArtworkProps) {
  return (
    <>
      <div className={classNames(styles.photo, styles.finalePhoto)}>
        <Photo media={primary} priority sizes={format === "tv" ? "45vw" : "86vw"} className={styles.coverTop} />
      </div>
      <div className={classNames(styles.copy, styles.finaleCopy)}>
        <span className={styles.finaleOrnament} aria-hidden="true">✦</span>
        <Eyebrow>{scene.eyebrow}</Eyebrow>
        <FittedTitle className={styles.finaleTitle}>{scene.title}</FittedTitle>
        <Rule />
        <FittedCopy className={styles.finaleCaption}>{scene.caption}</FittedCopy>
      </div>
      <div className={styles.finaleHalo} aria-hidden="true" />
    </>
  );
}

function FittedTitle({ children, className }: { children: string; className: string }) {
  const length = textLength(children);
  return (
    <h1
      className={classNames(
        className,
        styles.fittedTitle,
        length > 110 ? styles.titleDense : length > 60 && styles.titleCompact,
      )}
    >
      {children}
    </h1>
  );
}

function FittedCopy({ children, className }: { children: string; className: string }) {
  const length = textLength(children);
  return (
    <p
      className={classNames(
        className,
        styles.fittedCopy,
        length > 500 ? styles.copyDense : length > 220 && styles.copyCompact,
      )}
    >
      {children}
    </p>
  );
}

function CoupleTitle({ compact = false, title }: { compact?: boolean; title: string }) {
  const names = title.split(" & ");
  const length = textLength(title);
  const titleClassName = classNames(
    styles.coupleTitle,
    styles.fittedCouple,
    compact && styles.coupleTitleCompact,
    length > 56 ? styles.coupleTitleDense : length > 28 && styles.coupleTitleLong,
  );
  if (names.length !== 2) {
    return <h1 className={titleClassName}>{title}</h1>;
  }
  return (
    <h1 className={titleClassName}>
      <span>{names[0]}</span>
      <i>&</i>
      <span>{names[1]}</span>
    </h1>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className={styles.eyebrow}>{children}</p>;
}

function Rule() {
  return <span className={styles.rule} aria-hidden="true"><i /></span>;
}

function NocturneChrome({ activeIndex, scenes }: Pick<SlideshowCompositionProps, "activeIndex" | "scenes">) {
  return (
    <div className={styles.chrome} aria-hidden="true">
      <span className={styles.chromeTitle}>Dạ khúc sơn mài</span>
      <div className={styles.progress}>
        {scenes.map((scene, index) => (
          <i
            key={scene.id}
            className={classNames(index <= activeIndex && styles.progressComplete, index === activeIndex && styles.progressActive)}
          />
        ))}
      </div>
      <span className={styles.counter}>{String(activeIndex + 1).padStart(2, "0")} / {String(scenes.length).padStart(2, "0")}</span>
    </div>
  );
}
