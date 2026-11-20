import Link from "next/link";

/**
 * Querformat-Logo aus dem Logo-Paket.
 * - "dunkel": Chrom-Version mit transparentem Hintergrund – für dunkle Flächen (Header, Footer)
 * - "hell":   flache Version – für helle Flächen
 */
export function Logo({ variant = "dunkel", className = "" }: { variant?: "dunkel" | "hell"; className?: string }) {
  const src = variant === "dunkel" ? "/brand/logo-quer-chrom.svg" : "/brand/logo-quer-flach.svg";
  return (
    <Link href="/" className={`logo ${className}`} aria-label="S&E Webstudio – Startseite">
      {/* eslint-disable-next-line @next/next/no-img-element -- SVG, keine Optimierung nötig */}
      <img src={src} alt="S&E Webstudio" width={938} height={270} />
    </Link>
  );
}
