interface CapptaLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  textClassName?: string;
}

export function CapptaLogo({ className = "", size = 32, showText = true, textClassName = "" }: CapptaLogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <rect width="40" height="40" rx="10" fill="url(#cappta-bg)" />
        <path
          d="M25.5 14.2C24.2 12.8 22.3 12 20 12c-4.4 0-8 3.6-8 8s3.6 8 8 8c2.3 0 4.2-.8 5.5-2.2"
          stroke="url(#cappta-letter)"
          strokeWidth="3.2"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="30" cy="13" r="3" fill="url(#cappta-dot)" />
        <defs>
          <linearGradient id="cappta-bg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="hsl(var(--primary))" />
            <stop offset="1" stopColor="hsl(250, 60%, 45%)" />
          </linearGradient>
          <linearGradient id="cappta-letter" x1="12" y1="12" x2="26" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="white" />
            <stop offset="1" stopColor="rgba(255,255,255,0.85)" />
          </linearGradient>
          <linearGradient id="cappta-dot" x1="27" y1="10" x2="33" y2="16" gradientUnits="userSpaceOnUse">
            <stop stopColor="rgba(255,255,255,0.95)" />
            <stop offset="1" stopColor="rgba(255,255,255,0.7)" />
          </linearGradient>
        </defs>
      </svg>
      {showText && (
        <span className={`font-extrabold tracking-tight ${textClassName || "text-xl"}`}>
          <span className="text-gradient-brand">Cappta</span>
          <span className="text-white/50 font-medium ml-1">AI</span>
        </span>
      )}
    </span>
  );
}

export function CapptaIcon({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="40" height="40" rx="10" fill="url(#cappta-icon-bg)" />
      <path
        d="M25.5 14.2C24.2 12.8 22.3 12 20 12c-4.4 0-8 3.6-8 8s3.6 8 8 8c2.3 0 4.2-.8 5.5-2.2"
        stroke="url(#cappta-icon-letter)"
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="30" cy="13" r="3" fill="url(#cappta-icon-dot)" />
      <defs>
        <linearGradient id="cappta-icon-bg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="hsl(var(--primary))" />
          <stop offset="1" stopColor="hsl(250, 60%, 45%)" />
        </linearGradient>
        <linearGradient id="cappta-icon-letter" x1="12" y1="12" x2="26" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" />
          <stop offset="1" stopColor="rgba(255,255,255,0.85)" />
        </linearGradient>
        <linearGradient id="cappta-icon-dot" x1="27" y1="10" x2="33" y2="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgba(255,255,255,0.95)" />
          <stop offset="1" stopColor="rgba(255,255,255,0.7)" />
        </linearGradient>
      </defs>
    </svg>
  );
}
