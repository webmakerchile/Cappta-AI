import logoHorizontal from "@assets/Logo_Cappta_1774155801341.png";
import logoIcon from "@assets/Logo_Cappta_Solo_1774155801340.png";
import logoStacked from "@assets/Logoo_Cappta_2_1774155801342.png";

interface CapptaLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  textClassName?: string;
  variant?: "horizontal" | "stacked";
}

export function CapptaLogo({ className = "", size = 32, showText = true, textClassName = "", variant = "horizontal" }: CapptaLogoProps) {
  if (variant === "stacked") {
    return (
      <span className={`inline-flex flex-col items-center ${className}`}>
        <img
          src={logoStacked}
          alt="Cappta AI"
          style={{ height: size * 2.5, width: "auto" }}
          className="object-contain"
        />
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <img
        src={logoIcon}
        alt="Cappta AI"
        style={{ width: size, height: size }}
        className="shrink-0 object-contain"
      />
      {showText && (
        <span className={`font-heading font-semibold tracking-[-0.02em] ${textClassName || "text-xl"}`}>
          <span className="text-white/90">Cappta</span>
          <span className="text-white/40 font-light ml-1.5">AI</span>
        </span>
      )}
    </span>
  );
}

export function CapptaIcon({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src={logoIcon}
      alt="Cappta AI"
      style={{ width: size, height: size }}
      className={`object-contain ${className}`}
    />
  );
}

export function CapptaHorizontalLogo({ height = 32, className = "" }: { height?: number; className?: string }) {
  return (
    <img
      src={logoHorizontal}
      alt="Cappta AI"
      style={{ height, width: "auto" }}
      className={`object-contain ${className}`}
    />
  );
}

export function CapptaStackedLogo({ height = 80, className = "" }: { height?: number; className?: string }) {
  return (
    <img
      src={logoStacked}
      alt="Cappta AI"
      style={{ height, width: "auto" }}
      className={`object-contain ${className}`}
    />
  );
}
