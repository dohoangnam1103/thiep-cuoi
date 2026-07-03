type LogoMarkProps = {
  className?: string;
};

export function LogoMark({ className }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      role="img"
      aria-label="Thiệp Mừng Online"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="tmo-red" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c62828" />
          <stop offset="1" stopColor="#8e1616" />
        </linearGradient>
        <linearGradient id="tmo-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6d365" />
          <stop offset="0.55" stopColor="#e6b422" />
          <stop offset="1" stopColor="#c8971a" />
        </linearGradient>
      </defs>

      <rect
        x="5.25"
        y="17.25"
        width="37.5"
        height="23.5"
        rx="3.5"
        fill="url(#tmo-red)"
        stroke="url(#tmo-gold)"
        strokeWidth="1.6"
      />
      <path
        d="M6.5 19.5 L24 33 L41.5 19.5"
        fill="none"
        stroke="url(#tmo-gold)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24 17.5 C 21 13.2, 15 11, 15 6.8 C 15 4.2, 18 3.2, 20 4.9 C 21.6 6.2, 24 8.8, 24 8.8 C 24 8.8, 26.4 6.2, 28 4.9 C 30 3.2, 33 4.2, 33 6.8 C 33 11, 27 13.2, 24 17.5 Z"
        fill="url(#tmo-gold)"
        stroke="#8e1616"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
