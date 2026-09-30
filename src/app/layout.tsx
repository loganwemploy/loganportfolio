import type { Metadata, Viewport } from "next";
import { Poppins, Unbounded } from "next/font/google";
import { SmoothScroll } from "@/components/smooth-scroll";
import { profile } from "@/lib/data";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin"],
  weight: ["800", "900"],
});

const title = `${profile.name} · ${profile.role}`;
const description =
  "Full-stack engineer building secure, high-volume commerce and fintech experiences in React, Next.js and Node.js. Capital One, Cooper's Hawk, IMS, and independent products.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: "profile",
    firstName: "Logan",
    lastName: "Wilson",
  },
  twitter: { card: "summary_large_image", title, description },
};

export const viewport: Viewport = {
  themeColor: "#1d1d1b",
};

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  jobTitle: profile.role,
  address: { "@type": "PostalAddress", addressRegion: "Tampa Bay Area" },
  sameAs: [profile.linkedin],
  alumniOf: "DePaul University",
  worksFor: { "@type": "Organization", name: "Capital One" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${poppins.variable} ${unbounded.variable}`}>
      <body>
        <noscript>
          <style>{`[data-reveal]{opacity:1!important}`}</style>
        </noscript>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
        <a
          href="#main"
          className="fixed left-4 top-4 z-[100] -translate-y-20 rounded-full bg-butter px-4 py-2 text-sm font-medium text-ink transition-transform focus:translate-y-0"
        >
          Skip to content
        </a>
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
