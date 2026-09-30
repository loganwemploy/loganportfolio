# Logan Wilson — résumé site

Motion-driven résumé / portfolio. Next.js (App Router) · TypeScript · Tailwind v4 · GSAP (ScrollTrigger, SplitText) · Lenis.

Visual language is modelled on [House of Yellow](https://houseofyellow.nl/): ink `#1d1d1b`, butter `#f2efa3`, off-white `#eeeeee`, Poppins + Unbounded, bracketed `[ 00 ]` indexes, a four-sided marquee button, and a grid/list work browser.

## Run

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # static production build
```

## Edit the content

Everything on the page comes from [`src/lib/data.ts`](src/lib/data.ts): hero copy, stats, roles, projects, skills, credentials and contact details. Change text there, not in the components.

- **Résumé download:** replace `public/Logan_Wilson_Resume.pdf`.
- **Hero video:** `HERO_VIDEO` in [`src/components/hero.tsx`](src/components/hero.tsx). It is hot-linked from a third-party CDN; copy the file into `public/` and point the constant at `/your-file.mp4` to self-host.
- **Colours / type:** tokens at the top of [`src/app/globals.css`](src/app/globals.css).

## Motion

All animation runs through `useMotion` in [`src/lib/gsap.ts`](src/lib/gsap.ts), which only activates when the visitor has *not* asked for reduced motion. With reduced motion on, Lenis smooth-scroll, scroll animations, marquees and the hero video are all switched off and the content is shown as-is.
