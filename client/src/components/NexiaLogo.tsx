interface NexiaLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  textClassName?: string;
}

export function NexiaLogo({ className = "", size = 32, showText = true, textClassName = "" }: NexiaLogoProps) {
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
        <rect width="40" height="40" rx="10" fill="url(#nexia-bg)" />
        <path
          d="M12 28V12h2.8l8.4 11.2V12H26v16h-2.8L14.8 16.8V28H12Z"
          fill="url(#nexia-letter)"
        />
        <circle cx="30" cy="13" r="3" fill="url(#nexia-dot)" />
        <defs>
          <linearGradient id="nexia-bg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="hsl(var(--primary))" />
            <stop offset="1" stopColor="hsl(250, 60%, 45%)" />
          </linearGradient>
          <linearGradient id="nexia-letter" x1="12" y1="12" x2="26" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="white" />
            <stop offset="1" stopColor="rgba(255,255,255,0.85)" />
          </linearGradient>
          <linearGradient id="nexia-dot" x1="27" y1="10" x2="33" y2="16" gradientUnits="userSpaceOnUse">
            <stop stopColor="rgba(255,255,255,0.95)" />
            <stop offset="1" stopColor="rgba(255,255,255,0.7)" />
          </linearGradient>
        </defs>
      </svg>
      {showText && (
        <span className={`font-extrabold tracking-tight ${textClassName || "text-xl"}`}>
          <span className="text-gradient-brand">Nexia</span>
          <span className="text-white/50 font-medium ml-1">AI</span>
        </span>
      )}
    </span>
  );
}

export function NexiaIcon({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="40" height="40" rx="10" fill="url(#nexia-icon-bg)" />
      <path
        d="M12 28V12h2.8l8.4 11.2V12H26v16h-2.8L14.8 16.8V28H12Z"
        fill="url(#nexia-icon-letter)"
      />
      <circle cx="30" cy="13" r="3" fill="url(#nexia-icon-dot)" />
      <defs>
        <linearGradient id="nexia-icon-bg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="hsl(var(--primary))" />
          <stop offset="1" stopColor="hsl(250, 60%, 45%)" />
        </linearGradient>
        <linearGradient id="nexia-icon-letter" x1="12" y1="12" x2="26" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" />
          <stop offset="1" stopColor="rgba(255,255,255,0.85)" />
        </linearGradient>
        <linearGradient id="nexia-icon-dot" x1="27" y1="10" x2="33" y2="16" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgba(255,255,255,0.95)" />
          <stop offset="1" stopColor="rgba(255,255,255,0.7)" />
        </linearGradient>
      </defs>
    </svg>
  );
}
