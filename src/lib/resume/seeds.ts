import type { Entry, ResumeDoc, ResumeTheme, Section } from "./types";
import { newId } from "./types";

/*
 * Built-in resume variants. Every fact here comes from Logan's master resume
 * (public/Logan_Wilson_Resume.pdf) or from projects in his own repos and live
 * sites. Nothing is invented: where a variant needs experience his files don't
 * show (restaurant floor jobs, social media accounts, a design portfolio), the
 * private notes say so instead of the resume pretending.
 */

export const PROFILE = {
  name: "Logan Wilson",
  phone: "(847) 826-1057",
  email: "loganwemploy@gmail.com",
  location: "Tampa Bay Area, FL",
  linkedin: "linkedin.com/in/logan-wilson-5015a5143",
  github: "github.com/loganwemploy",
};

const CONTACTS = [PROFILE.phone, PROFILE.email, PROFILE.location, PROFILE.linkedin];
const TECH_CONTACTS = [...CONTACTS, PROFILE.github];

/* ---------- builders ---------- */

const bullets = (texts: string[]) => texts.map((text) => ({ id: newId("b"), text }));

function entry(title: string, org: string, dates: string, location: string, texts: string[]): Entry {
  return { id: newId("e"), title, org, dates, location, bullets: bullets(texts) };
}

const summary = (title: string, ...paras: string[]): Section => ({
  id: newId("s"),
  kind: "summary",
  title,
  paragraphs: bullets(paras),
});

const entries = (title: string, list: Entry[]): Section => ({
  id: newId("s"),
  kind: "entries",
  title,
  entries: list,
});

const skills = (title: string, rows: [string, string][]): Section => ({
  id: newId("s"),
  kind: "skills",
  title,
  rows: rows.map(([label, value]) => ({ id: newId("r"), label, value })),
});

const list = (title: string, items: string[]): Section => ({
  id: newId("s"),
  kind: "list",
  title,
  items: bullets(items),
});

/* ---------- experience ---------- */

const ROLE = {
  capitalOne: ["Software Engineer", "Capital One", "Feb 2025 – Present", "Denver, CO · Remote"],
  coopersHawk: [
    "Sr. JavaScript Engineer",
    "Cooper's Hawk Winery & Restaurants",
    "Nov 2021 – Nov 2023",
    "Downers Grove, IL",
  ],
  ims: [
    "Front End React / Full Stack Engineer",
    "IMS Integrated Merchandising Solutions",
    "May 2019 – Jun 2021",
    "Morton Grove, IL",
  ],
  ymca: [
    "Software Engineer / Web Developer",
    "YMCA of Metropolitan Chicago",
    "Oct 2017 – Mar 2019",
    "Chicago, IL",
  ],
  freelance: ["Web Developer & UX Designer", "Freelance", "Jan 2013 – Dec 2019", "Remote"],
} as const;

const role = (r: readonly [string, string, string, string], texts: string[]) =>
  entry(r[0], r[1], r[2], r[3], texts);

const C = {
  arch: "Architect and implement full-stack web features in JavaScript and Node.js, with attention to performance, reliability and security.",
  shopping:
    "Worked on Capital One Shopping as its partner network grew from 30,000 retailers to 100,000+ in a little over a year.",
  apis: "Built APIs and SQL queries that securely serve analytics, email and verified customer data to multiple internal tools.",
  debug:
    "Debug, test and troubleshoot across browsers and devices to resolve rendering and functionality issues.",
};

const H = {
  pci: "Designed PCI-compliant payment forms for the ecommerce store and monthly Wine Club, integrating Bluepay iframes and captchas, supporting checkout that processed ~$35M in average yearly ecommerce GMV.",
  club: "The Wine Club those forms served had roughly 600,000 members during that period.",
  validation:
    "Built client-side and server-side validation with Zod, Yup and JavaScript to block code injection and XSS while keeping forms easy to complete.",
  feeds:
    "Integrated API services, JSON feeds and content tools for real-time data delivery across web channels.",
};

const I = {
  components:
    "Built reusable React components for a multi-tenant application serving multiple client portals.",
  cms: "Contributed to architecting a CMS that rearranged visual layouts based on which client signed in through the portal.",
  smileMakers:
    "Worked on the Smile Makers Online ecommerce platform, supporting payment and account-based purchasing for McDonald's branded merchandise across its U.S. restaurant network.",
  b2b: "Worked with enterprise nopCommerce, including a B2B payment system that charged the company card.",
};

const Y = {
  cms: "Maintained and enhanced digital marketing properties on an enterprise CMS (ExpressionEngine), PHP, JavaScript and HTML/CSS.",
  design:
    "Translated UI/UX design assets from Adobe Creative Suite into accessible, standards-compliant web pages.",
  seo: "Implemented SEO best practices and API integrations to increase marketing reach and operational efficiency.",
};

const F = {
  build:
    "Designed and built custom mobile-responsive web applications for client brands using JavaScript, Node.js, HTML5, CSS3 and CMS platforms.",
  ux: "Ran end-to-end UX/UI workflows: user research, wireframing and interactive prototyping in Figma, Sketch and Adobe XD.",
};

/* ---------- independent projects (all live unless noted) ---------- */

const P = {
  restaurantSuite: (texts: string[]) =>
    entry("Restaurant Suite", "Restaurant operations platform · Next.js, Medusa v2, PostgreSQL", "2026", "", texts),
  qrKings: () =>
    entry("QRKings · Side Work", "Shift task app · Node.js, Netlify", "", "loganqrkings.netlify.app", [
      "Staff scan a station's QR code and photograph the finished task (\"Clean espresso machine\", \"Organize walk-in cooler\"); AI vision approves it and managers track completion on a shift calendar.",
    ]),
  courtyard: () =>
    entry("The Courtyard Tech Café", "Team registration portal · Next.js, Google Apps Script", "2026", "", [
      "Registration portal that collects each new team member's details and sends them a branded confirmation email.",
    ]),
  protech: (texts: string[]) =>
    entry(
      "Protech Event Scheduler",
      "Event crew scheduling · Next.js, Payload CMS, PostgreSQL",
      "",
      "sched.protecheventsolutions.com",
      texts,
    ),
  mission007: () =>
    entry("Mission 007", "Youth mentorship nonprofit · Next.js", "", "mission007.org", [
      "Site for a youth mentorship nonprofit: program pages for mentoring, skills training and backpack giveaways, plus an events catalog with RSVPs to attend or volunteer.",
    ]),
  darick: () =>
    entry("Darick's Dive Recovery", "Local service business · Next.js, Three.js", "", "darickdiving.vercel.app", [
      "Site for an underwater search-and-recovery service at Lake of the Ozarks, with an immersive WebGL water scene and a clear find-it-or-it's-free guarantee.",
    ]),
  firstStep: () =>
    entry("First Step Junk Removal", "Local service business · Next.js", "", "firststepjunk.com", [
      "Marketing site for a junk-removal company in Rockford, IL: upfront pricing, arrival windows and free estimates by phone, text or photo, built for local SEO and lead capture.",
    ]),
  spades: () =>
    entry("Spades · Denver", "Artist & producer site · Next.js, Payload CMS", "", "spadesmusic.netlify.app", [
      "Rebuilt an artist and producer landing site from Create React App onto Next.js and Payload CMS with a Postgres-backed admin.",
    ]),
  veltrix: () =>
    entry("Veltrix Drive", "Vehicle ownership platform · Next.js", "", "veltrix-drive.vercel.app", [
      "Vehicle ownership platform with fleet profiles, maintenance timelines, investment tracking, documents, a calendar and a voice copilot.",
    ]),
  canigan: () =>
    entry("Canigan Health Options", "Wellness brand · Marketing site", "", "caniganhealthoptions.com", [
      "Brand site for a personalized-nutrition company, with membership benefits and an Ambassador program.",
    ]),
  litWitTre: () =>
    entry("LIT WIT TRE", "Brand landing page", "", "lit-wit-tre.vercel.app", [
      "Join-the-movement landing page built to the brand's dark, electric-neon visual guidelines.",
    ]),
  caniganDash: () =>
    entry("Canigan Dash", "Internal dashboard · Next.js, Gmail API", "", "canigan-dash.vercel.app", [
      "Private sign-in dashboard for projects, tasks, files and cross-organization collaboration, with Gmail integration.",
    ]),
  portfolio: () =>
    entry("Portfolio site", "Motion-driven portfolio · Next.js, GSAP, Lenis", "2026", "", [
      "Designed and built a motion-led portfolio: scroll-linked display type, a swinging marquee sign, staggered logo reveals and a full-width parallax image, with reduced-motion fallbacks.",
    ]),
  studio: () =>
    entry("Resume Studio", "WYSIWYG resume editor · React 19, Next.js 16", "2026", "", [
      "Built a WYSIWYG resume editor with native drag-and-drop reordering, inline editing, undo, version history and one-click PDF export with embedded fonts and selectable text.",
    ]),
};

const EDUCATION = () =>
  entries("Education", [
    entry("DePaul University", "Coursework in Human-Computer Interaction (HCI)", "", "Chicago, IL", []),
  ]);

const CERTS = () =>
  list("Certifications", [
    "SoloLearn JavaScript Certification (2018)",
    "Node.js Developer Certification (Wes Bos, 2018)",
  ]);

/* ---------- the variants ---------- */

type Spec = {
  seed: string;
  name: string;
  target: string;
  notes: string;
  headline: string;
  contacts: string[];
  theme: ResumeTheme;
  sections: () => Section[];
};

const theme = (font: ResumeTheme["font"], accent: string): ResumeTheme => ({
  font,
  accent,
  size: "standard",
  margin: "normal",
  align: "left",
});

const SPECS: Spec[] = [
  {
    seed: "restaurant",
    name: "Restaurant",
    target: "Restaurant groups and restaurant-tech teams",
    notes:
      "Built from your real restaurant-tech work: Cooper's Hawk plus the restaurant tools you've built. I found no restaurant floor or kitchen jobs (server, bartender, host, line cook) in your files, so none are listed. If you've held any, add them under Experience and drag them to the top. Add ServSafe or a food handler card under a Certifications section if you have one.",
    headline: "Software Engineer · Restaurant & Hospitality Technology",
    contacts: CONTACTS,
    theme: theme("serif", "#7b2d3b"),
    sections: () => [
      summary(
        "Summary",
        "Software engineer who builds the technology restaurants run on. At Cooper's Hawk Winery & Restaurants I built the payment forms behind ~$35M in average yearly ecommerce GMV and a Wine Club of roughly 600,000 members. Since then I've built my own restaurant operations tools for crew scheduling, staff training, side work and kitchen recipes.",
      ),
      entries("Restaurant Technology Projects", [
        P.restaurantSuite([
          "Built an all-in-one operations suite for restaurant teams: crew scheduling with shift swaps and pickups, training modules with AI-generated menu quizzes, floorplan sections with printable assignment sheets, and side-work checklists.",
          "Modeled real restaurant roles (owner, manager, trainer; server, bartender, barback, busser, kitchen) with job codes that control who can work or cover each shift.",
          "Added guest-behavior analytics with Microsoft Clarity and pricing experiments (price drops, bundles, add-ons) measured by conversion lift, so managers decide from data.",
        ]),
        P.qrKings(),
        P.courtyard(),
      ]),
      entries("Experience", [
        role(ROLE.coopersHawk, [H.pci, H.club, H.validation]),
        role(ROLE.capitalOne, [C.shopping, C.apis]),
        role(ROLE.ims, [I.smileMakers, I.components]),
        role(ROLE.ymca, [Y.cms]),
      ]),
      skills("Skills", [
        ["Restaurant tech", "Online ordering and checkout, membership billing, crew scheduling, staff training and onboarding, side-work checklists, recipe management"],
        ["Payments & security", "PCI-compliant payment forms, Bluepay, captchas, input validation (Zod, Yup)"],
        ["Web & data", "React, Next.js, Node.js, PostgreSQL, Airtable, REST APIs"],
        ["Analytics", "Microsoft Clarity (heatmaps, session replay), conversion and pricing experiments"],
      ]),
      EDUCATION(),
    ],
  },
  {
    seed: "hospitality",
    name: "Hospitality",
    target: "Hospitality, events and guest-experience teams",
    notes:
      "Leans on guest- and member-facing work you can prove: Cooper's Hawk Wine Club and ecommerce, Protech's event crew scheduling, the Courtyard café onboarding and Mission 007's event RSVPs. I found no hotel, front desk or event-staff jobs in your files, so none are listed. Add them under Experience if you've held them.",
    headline: "Software Engineer · Hospitality, Events & Membership",
    contacts: CONTACTS,
    theme: theme("serif", "#0f5e66"),
    sections: () => [
      summary(
        "Summary",
        "Software engineer building guest- and member-facing experiences since 2013. At Cooper's Hawk Winery & Restaurants I built ecommerce and Wine Club payment flows for a membership of roughly 600,000. Since then I've built crew scheduling for an event-labor company, team onboarding for a café and event RSVPs for a youth nonprofit.",
      ),
      entries("Experience", [
        role(ROLE.capitalOne, [C.shopping, C.apis]),
        role(ROLE.coopersHawk, [H.pci, H.club, H.feeds]),
        role(ROLE.ims, [I.smileMakers, I.cms]),
        role(ROLE.ymca, [Y.cms, Y.design]),
      ]),
      entries("Hospitality & Events Projects", [
        P.protech([
          "Crew scheduling portal for an event-labor company: shift confirmations, automated reminders and AI-assisted outreach to fill open shifts.",
        ]),
        P.restaurantSuite([
          "Operations suite for restaurant teams: scheduling with shift swaps, staff training and onboarding, floorplan sections and side-work checklists, with role-based access for owners, managers, trainers and crew.",
        ]),
        P.courtyard(),
        P.mission007(),
      ]),
      skills("Skills", [
        ["Guest & member experience", "Membership checkout, online ordering, event RSVPs, confirmation emails, accessible responsive design"],
        ["Operations software", "Crew scheduling, shift reminders, staff onboarding and training, side-work tracking"],
        ["Web & data", "React, Next.js, Node.js, Payload CMS, PostgreSQL, REST APIs"],
        ["Payments & security", "PCI-compliant payment forms, input validation, least-privilege access"],
      ]),
      EDUCATION(),
    ],
  },
  {
    seed: "marketing",
    name: "Marketing & Social Media",
    target: "Digital marketing, web marketing and social media roles",
    notes:
      "I found no social media management work in your files (no accounts, content calendars or campaigns), so this version sticks to web marketing you can prove: SEO, landing pages, CMS publishing and analytics. If you've run social accounts, add an entry with the platforms, follower growth, engagement rate and posting cadence. Numbers win interviews here.",
    headline: "Digital Marketing & Web Developer · SEO, Content & Analytics",
    contacts: CONTACTS,
    theme: theme("sans", "#9a4416"),
    sections: () => [
      summary(
        "Summary",
        "Web developer for marketing teams since 2013. I build landing pages and brand sites, handle SEO and CMS publishing, and set up the analytics that show what's working. I maintained the YMCA of Metropolitan Chicago's digital marketing properties, built ecommerce and Wine Club flows for Cooper's Hawk, and launch sites for local businesses, brands and nonprofits.",
      ),
      skills("Skills", [
        ["Marketing & analytics", "SEO, landing pages, lead capture, Microsoft Clarity (heatmaps, session replay), conversion funnels, A/B and pricing experiments"],
        ["Content & CMS", "ExpressionEngine, WordPress, Payload, headless CMS, JSON content feeds"],
        ["Design", "Figma, Adobe Creative Cloud (Photoshop, Illustrator, InDesign, After Effects), responsive design, accessibility"],
        ["Web", "HTML5, CSS3, JavaScript, React, Next.js, Vercel, Netlify"],
      ]),
      entries("Experience", [
        role(ROLE.capitalOne, [C.shopping]),
        role(ROLE.coopersHawk, [H.pci, H.feeds]),
        role(ROLE.ims, [I.smileMakers]),
        role(ROLE.ymca, [Y.cms, Y.seo, Y.design]),
        role(ROLE.freelance, [F.build, F.ux]),
      ]),
      entries("Marketing Projects", [
        P.firstStep(),
        P.restaurantSuite([
          "Set up guest-behavior analytics with Microsoft Clarity (heatmaps, session replay, friction reports) and ran pricing and copy experiments measured by conversion lift.",
        ]),
        P.canigan(),
        P.mission007(),
      ]),
      EDUCATION(),
    ],
  },
  {
    seed: "graphic-designer",
    name: "Graphic Designer",
    target: "Graphic, visual and brand design roles",
    notes:
      "Graphic design roles expect a portfolio. Add a Behance, Dribbble or PDF portfolio link to the contact line. Your master resume lists Adobe Creative Cloud, but I found no design source files on this machine, so this version leads with the web, brand and motion work you can show live.",
    headline: "Visual & Interface Designer · Brand, Web & Motion",
    contacts: CONTACTS,
    theme: theme("sans", "#4b2c5e"),
    sections: () => [
      summary(
        "Summary",
        "Designer who builds what he designs. Since 2013 I've turned Figma, Sketch and Adobe files into finished, responsive work for client brands, backed by Human-Computer Interaction coursework at DePaul. Recent work includes motion-led typography, an immersive WebGL water scene for a dive-recovery business and brand pages built to strict visual guidelines.",
      ),
      skills("Skills", [
        ["Design tools", "Adobe Photoshop, Illustrator, InDesign, After Effects and XD; Figma; Sketch"],
        ["Visual design", "Typography, layout, color, responsive design, accessibility, design-to-code handoff"],
        ["UX", "User research, wireframing, interactive prototyping, usability (HCI coursework)"],
        ["Motion & 3D", "GSAP, Lenis, Framer Motion, Three.js"],
      ]),
      entries("Selected Work", [P.portfolio(), P.darick(), P.litWitTre(), P.canigan()]),
      entries("Experience", [
        role(ROLE.capitalOne, [
          "Build and refine web features for Capital One Shopping, resolving rendering issues across browsers and devices.",
        ]),
        role(ROLE.coopersHawk, [
          "Designed PCI-compliant payment forms for the online store and Wine Club that stayed secure while staying easy to complete.",
        ]),
        role(ROLE.ims, [
          "Built reusable interface components and helped architect a CMS that rearranged visual layouts based on which client signed in.",
        ]),
        role(ROLE.ymca, [Y.design, Y.cms]),
        role(ROLE.freelance, [F.ux, F.build]),
      ]),
      EDUCATION(),
    ],
  },
  {
    seed: "web-designer",
    name: "Web Designer",
    target: "Web design and UX/UI roles",
    notes:
      "Put a portfolio link in the contact line. Every project under Selected Work is live, so a reviewer can click straight through. Swap projects in and out to match each studio's style.",
    headline: "Web Designer · UX/UI & Front-End Development",
    contacts: TECH_CONTACTS,
    theme: theme("sans", "#0f5e66"),
    sections: () => [
      summary(
        "Summary",
        "Web designer and front-end developer since 2013. I design in Figma, Sketch and Adobe XD and build what I design: responsive, accessible sites with clear structure and motion that serves the content. Clients range from the YMCA of Metropolitan Chicago and Cooper's Hawk to local businesses, artists and nonprofits.",
      ),
      entries("Selected Work", [P.darick(), P.firstStep(), P.mission007(), P.spades(), P.portfolio()]),
      entries("Experience", [
        role(ROLE.capitalOne, [C.debug, C.arch]),
        role(ROLE.coopersHawk, [H.pci, H.validation]),
        role(ROLE.ims, [I.components, I.cms]),
        role(ROLE.ymca, [Y.design, Y.seo, Y.cms]),
        role(ROLE.freelance, [F.ux, F.build]),
      ]),
      skills("Skills", [
        ["Design", "Figma, Sketch, Adobe XD, Photoshop, Illustrator"],
        ["Front end", "HTML5, CSS3, Tailwind CSS, JavaScript, TypeScript, React, Next.js"],
        ["UX", "Wireframing, prototyping, user research, accessibility, responsive design, cross-browser testing"],
        ["CMS & SEO", "ExpressionEngine, WordPress, Payload, headless CMS, technical SEO"],
        ["Motion", "GSAP, Lenis, Framer Motion, Three.js"],
      ]),
      EDUCATION(),
    ],
  },
  {
    seed: "frontend",
    name: "Frontend Developer",
    target: "Frontend developer roles",
    notes:
      "Reorder Experience bullets so the first one under each job matches the posting's top requirement. Recruiters often skim only the first line.",
    headline: "Frontend Developer · React, Next.js, TypeScript",
    contacts: TECH_CONTACTS,
    theme: theme("sans", "#1e3a5f"),
    sections: () => [
      summary(
        "Summary",
        "Frontend developer building fast, accessible interfaces in React, Next.js and TypeScript. I've shipped customer-facing features at Capital One, PCI-compliant checkout at Cooper's Hawk and reusable multi-tenant components at IMS, with a UX background (HCI coursework at DePaul) that keeps the person using the product at the center.",
      ),
      skills("Skills", [
        ["Languages & frameworks", "JavaScript (ES6+), TypeScript, React, Next.js, Node.js, HTML5, CSS3"],
        ["UI & styling", "Tailwind CSS, CSS Grid, Flexbox, Styled Components, Material Design, responsive design, accessibility"],
        ["Data & forms", "REST APIs, GraphQL, TanStack Query, Zod, Yup"],
        ["Motion", "GSAP, Framer Motion, Three.js"],
        ["Tools", "Git, GitHub, Vercel, Netlify, Chrome DevTools, Postman, Jira, Figma"],
      ]),
      entries("Experience", [
        role(ROLE.capitalOne, [C.arch, C.shopping, C.debug]),
        role(ROLE.coopersHawk, [H.pci, H.validation, H.feeds]),
        role(ROLE.ims, [I.components, I.cms, I.smileMakers]),
        role(ROLE.ymca, [Y.design, Y.seo]),
        role(ROLE.freelance, [F.build]),
      ]),
      entries("Projects", [P.studio(), P.veltrix(), P.darick()]),
      EDUCATION(),
    ],
  },
  {
    seed: "senior-react",
    name: "Senior React Developer",
    target: "Senior React developer roles",
    notes:
      "For senior roles, be ready to talk through one deep example: the Cooper's Hawk payment forms (PCI, validation, iframes) or IMS's multi-tenant component system. Keep the bullet for whichever you'd rather discuss first.",
    headline: "Senior React Developer",
    contacts: TECH_CONTACTS,
    theme: theme("sans", "#1d1d1b"),
    sections: () => [
      summary(
        "Summary",
        "Senior React developer with React in production since 2019, focused on component systems, complex forms and secure checkout. I built multi-tenant React portals at IMS, PCI-compliant payment forms with Zod and Yup validation at Cooper's Hawk (~$35M in average yearly ecommerce GMV) and full-stack features at Capital One. Current with React 19, Server Components and the Next.js App Router.",
      ),
      skills("Skills", [
        ["React", "React 19, hooks, Server Components, Next.js App Router, component architecture, form state and validation (Zod, Yup)"],
        ["Languages", "TypeScript, JavaScript (ES6+), HTML5, CSS3"],
        ["Data", "TanStack Query, REST APIs, GraphQL, Node.js, PostgreSQL"],
        ["UI", "Tailwind CSS, Radix UI, Styled Components, Material Design, accessibility, responsive design"],
        ["Quality", "Chrome DevTools profiling, cross-browser and cross-device debugging, feature flags"],
      ]),
      entries("Experience", [
        role(ROLE.capitalOne, [C.arch, C.shopping, C.apis]),
        role(ROLE.coopersHawk, [H.pci, H.validation, H.feeds]),
        role(ROLE.ims, [I.components, I.cms, I.smileMakers]),
        role(ROLE.ymca, [Y.design]),
        role(ROLE.freelance, [F.build]),
      ]),
      entries("Projects", [
        P.studio(),
        P.protech([
          "Scheduling portal in React and Next.js with TanStack Query and Radix UI: shift confirmations, automated reminders and AI-assisted outreach to fill open shifts.",
        ]),
        P.restaurantSuite([
          "Restaurant operations suite on Next.js 16: scheduling with shift swaps, training quizzes, floorplan sections and role-based access for owners, managers, trainers and crew.",
        ]),
      ]),
      EDUCATION(),
    ],
  },
  {
    seed: "full-stack-developer",
    name: "Full Stack Developer",
    target: "Full stack developer roles",
    notes:
      "Developer roles weigh shipping speed and product sense. Lead with projects that are live and used (Protech, Mission 007), and keep the stack line on each project in sync with the posting.",
    headline: "Full Stack Developer · React, Node.js, PostgreSQL",
    contacts: TECH_CONTACTS,
    theme: theme("sans", "#24543f"),
    sections: () => [
      summary(
        "Summary",
        "Full stack developer who ships features end to end: React and Next.js on the front, Node.js APIs and SQL behind them. At Capital One I build APIs and queries that serve analytics and verified customer data to internal tools. On my own I've built scheduling, restaurant-operations and CMS-backed products used by real businesses.",
      ),
      skills("Skills", [
        ["Front end", "React, Next.js, TypeScript, JavaScript (ES6+), Tailwind CSS, HTML5, CSS3"],
        ["Back end", "Node.js, REST APIs, GraphQL, Payload CMS, Medusa, Hasura"],
        ["Data", "PostgreSQL, MongoDB, MySQL, Airtable, vector databases"],
        ["Cloud & tools", "Vercel, Netlify, AWS, Azure, GCP, Git, GitHub, Postman, Jira"],
        ["Integrations", "Twilio, Resend, Ably, Gmail API, Google Apps Script"],
      ]),
      entries("Experience", [
        role(ROLE.capitalOne, [C.apis, C.arch, C.shopping]),
        role(ROLE.coopersHawk, [H.pci, H.feeds, H.validation]),
        role(ROLE.ims, [I.b2b, I.smileMakers, I.components]),
        role(ROLE.ymca, [Y.cms, Y.seo]),
        role(ROLE.freelance, [F.build]),
      ]),
      entries("Projects", [
        P.protech([
          "Crew scheduling portal for an event-labor company: shift confirmations, automated reminders and AI-assisted outreach to fill open shifts.",
          "Built on Next.js, Payload CMS and Postgres, with Twilio, Resend and Ably for messaging and real-time updates.",
        ]),
        P.restaurantSuite([
          "Multi-tenant restaurant operations suite: scheduling, training, floorplans and side work, with every API checking auth, store scope and role before it writes.",
        ]),
        P.caniganDash(),
        P.spades(),
      ]),
      EDUCATION(),
    ],
  },
  {
    seed: "full-stack-engineer",
    name: "Full Stack Engineer",
    target: "Full-stack / software engineer roles (fintech, commerce, security)",
    notes:
      "Closest to your master resume. Keep the security story up front for fintech and commerce roles, and drop the AI & Retrieval row for teams that don't touch LLMs.",
    headline: "Full-Stack Software Engineer · Secure Commerce & Fintech",
    contacts: TECH_CONTACTS,
    theme: theme("serif", "#1e3a5f"),
    sections: () => [
      summary(
        "Summary",
        "Full-stack software engineer specializing in secure application architecture, React, Next.js and systems that handle sensitive data. I build authentication and authorization workflows, secure APIs, data-access controls and payment applications while minimizing exposure of sensitive information.",
        "I apply tokenization, least-privilege access, secure credential management, environment isolation and PCI-aware design from architecture through deployment, and complete monthly training in information security, privacy, phishing, AML principles and data protection.",
      ),
      skills("Skills", [
        ["Languages & frameworks", "JavaScript (ES6+), TypeScript, React, Next.js, Node.js, Gatsby, HTML5, CSS3"],
        ["Security & auth", "JWT, bcrypt, hashing, PCI compliance, tokenization, role-based access, white-hat pen-testing, canary tokens, AI/LLM security assessment"],
        ["Backend & data", "REST APIs, GraphQL, PostgreSQL, MongoDB, MySQL, Hasura, vector databases"],
        ["AI & retrieval", "RAG, CAG, cost-aware model usage, feature flags"],
        ["Cloud & tools", "Vercel, AWS, Azure, GCP, Netlify, Git, GitHub, Postman, Jira, Confluence, Agile/Scrum"],
      ]),
      entries("Experience", [
        role(ROLE.capitalOne, [C.arch, C.shopping, C.apis, C.debug]),
        role(ROLE.coopersHawk, [H.pci, H.club, H.validation, H.feeds]),
        role(ROLE.ims, [I.components, I.cms, I.smileMakers, I.b2b]),
        role(ROLE.ymca, [Y.cms, Y.seo]),
        role(ROLE.freelance, [F.build, F.ux]),
      ]),
      entries("Projects", [
        P.restaurantSuite([
          "Multi-tenant, role-based operations suite (Medusa v2, Next.js 16): every mutation API enforces auth, then store scoping, then role permission, with server-side AI calls through a key rotator so keys never reach the browser.",
        ]),
        P.protech([
          "Crew scheduling portal with automated reminders and AI-assisted outreach, built on Next.js, Payload CMS and Postgres.",
        ]),
      ]),
      EDUCATION(),
      CERTS(),
    ],
  },
];

/* ---------- public helpers ---------- */

export const SEED_IDS = SPECS.map((s) => s.seed);

/** Built-in resumes use their seed as the id, so each has a readable URL: /backoffice/resumes/frontend. */
function build(spec: Spec, now: string): ResumeDoc {
  return {
    id: spec.seed,
    name: spec.name,
    target: spec.target,
    notes: spec.notes,
    seed: spec.seed,
    createdAt: now,
    updatedAt: now,
    theme: { ...spec.theme },
    header: {
      name: PROFILE.name,
      headline: spec.headline,
      contacts: bullets(spec.contacts),
    },
    sections: spec.sections(),
  };
}

export function seedDoc(seed: string, now = new Date().toISOString()): ResumeDoc | null {
  const spec = SPECS.find((s) => s.seed === seed);
  return spec ? build(spec, now) : null;
}

export function seedDocs(skip: string[] = []): ResumeDoc[] {
  const now = new Date().toISOString();
  return SPECS.filter((s) => !skip.includes(s.seed)).map((s) => build(s, now));
}

export function blankDoc(name = "Untitled resume"): ResumeDoc {
  const now = new Date().toISOString();
  return {
    id: newId("r"),
    name,
    target: "",
    notes: "",
    createdAt: now,
    updatedAt: now,
    theme: theme("sans", "#1d1d1b"),
    header: { name: PROFILE.name, headline: "", contacts: bullets(CONTACTS) },
    sections: [
      summary("Summary", ""),
      entries("Experience", [entry("", "", "", "", [""])]),
      skills("Skills", [["", ""]]),
      EDUCATION(),
    ],
  };
}
