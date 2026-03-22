import logoHorizontal from "@assets/unnamed_(2)-Photoroom_1774157184512.png";
import logoStacked from "@assets/unnamed_(1)-Photoroom_1774157184512.png";
import logoSolo from "@assets/Logo_Cappta_Solo_1774185893557.png";

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
    <span className={`inline-flex items-center ${className}`}>
      <img
        src={logoHorizontal}
        alt="Cappta AI"
        style={{ height: size, width: "auto" }}
        className="shrink-0 object-contain"
      />
    </span>
  );
}

export function CapptaIcon({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src={logoSolo}
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
