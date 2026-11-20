import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="logo" aria-label="S&E Webstudio – Startseite">
      <span>
        S<span className="logo__amp">&amp;</span>E
      </span>
      <span className="logo__sub">Webstudio</span>
    </Link>
  );
}
