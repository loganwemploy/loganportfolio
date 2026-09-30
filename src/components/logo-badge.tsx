import type { StaticImageData } from "next/image";
import Image from "next/image";
import type { CSSProperties } from "react";

/**
 * Round company logo that slides in while on screen (see `revealLogos`).
 * `index` is the badge's sibling index; it staggers the reveal and unveil.
 * Decorative: the company name always sits next to it in text.
 */
export function LogoBadge({
  logo,
  index = 0,
  className = "",
  sizes,
}: {
  logo: StaticImageData;
  index?: number;
  className?: string;
  sizes?: string;
}) {
  return (
    <span
      data-logo-reveal
      aria-hidden="true"
      className={`logo-slide ${className}`}
      style={{ "--i": index } as CSSProperties}
    >
      <Image
        src={logo}
        alt=""
        sizes={sizes}
        className="block h-full w-full object-cover"
      />
    </span>
  );
}
