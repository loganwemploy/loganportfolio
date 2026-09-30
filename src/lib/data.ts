export const profile = {
  name: "Logan Wilson",
  role: "Full-Stack Software Engineer",
  location: "Greater Tampa Bay Area",
  email: "loganwemploy@gmail.com",
  linkedin: "https://www.linkedin.com/in/logan-wilson-5015a5143",
  resume: "/Logan_Wilson_Resume.pdf",
  startYear: 2013,
};

export const yearsBuilding = new Date().getFullYear() - profile.startYear;

export const heroStatement =
  "I'm a full-stack engineer who builds secure commerce at scale. From Cooper's Hawk checkout to Capital One Shopping, I turn payment flows and sensitive data into software people trust.";

export const heroAside =
  "React, Next.js and Node.js for teams that move money and protect data. PCI-aware payment forms, secure APIs and access controls, shipped across enterprise ecommerce, fintech and a growing set of independent products.";

export const aboutStatement = `${yearsBuilding} years in, I still care about the same thing: software that feels instant to the person using it and boring to the person trying to break it. I've shipped checkout for a winery-restaurant chain, merchandise ordering for McDonald's restaurants, and retailer tooling at Capital One, and I build independent products for small businesses and founders.`;

export type Stat = {
  prefix?: string;
  value: number;
  suffix?: string;
  label: string;
};

export const stats: Stat[] = [
  { value: yearsBuilding, suffix: "+", label: "Years building for the web" },
  {
    prefix: "~$",
    value: 35,
    suffix: "M",
    label: "Yearly ecommerce GMV through Cooper's Hawk checkout",
  },
  {
    value: 600,
    suffix: "K",
    label: "Wine Club members at Cooper's Hawk during my time there",
  },
  {
    value: 100,
    suffix: "K+",
    label: "Retailers in Capital One Shopping's network, up from 30K",
  },
];

export const pillars = [
  {
    title: "Secure commerce",
    body: "PCI-aware payment forms, tokenization, least-privilege access, and validation that blocks XSS and injection without making checkout harder.",
  },
  {
    title: "Full-stack product",
    body: "React, Next.js and Node.js on the front; REST, GraphQL, PostgreSQL and MongoDB behind it; Vercel, AWS, Azure and GCP underneath.",
  },
  {
    title: "Design & UX",
    body: "Accessible, responsive interfaces built from Figma, Sketch and Adobe files, backed by HCI coursework at DePaul and years of UX/UI workflow.",
  },
  {
    title: "AI & retrieval",
    body: "RAG and CAG patterns, cost-aware model usage, feature flags, and security assessment for LLM-powered features.",
  },
];

export type Role = {
  id: string;
  company: string;
  title: string;
  dates: string;
  location: string;
  bullets: string[];
  tags: string[];
};

export const roles: Role[] = [
  {
    id: "capital-one",
    company: "Capital One",
    title: "Software Engineer",
    dates: "Feb 2025 – Present",
    location: "Denver, Colorado / Remote",
    bullets: [
      "Architect and implement full-stack web features in JavaScript and Node.js, with attention to performance, reliability and security.",
      "Worked on Capital One Shopping as the partner network grew from 30,000 retailers to 100,000+ in a little over a year.",
      "Built APIs and SQL queries that securely serve analytics, email and verified customer data to multiple internal tools.",
      "Debug, test and troubleshoot across browsers and devices to resolve rendering and functionality issues.",
    ],
    tags: ["JavaScript", "Node.js", "SQL", "APIs", "Security"],
  },
  {
    id: "coopers-hawk",
    company: "Cooper's Hawk Winery & Restaurants",
    title: "Sr. JavaScript Engineer",
    dates: "Nov 2021 – Nov 2023",
    location: "Downers Grove, IL",
    bullets: [
      "Designed PCI-compliant payment forms for the ecommerce store and monthly Wine Club, integrating Bluepay iframes and captchas, supporting checkout that processed ~$35M in average yearly ecommerce GMV.",
      "Wine Club membership was roughly 600,000 during that period.",
      "Built client-side and server-side validation with Zod, Yup and JavaScript to block code injection and XSS while keeping forms easy to complete.",
      "Integrated API services, JSON feeds and content tools for real-time data delivery across web channels.",
    ],
    tags: ["PCI", "Bluepay", "Zod", "Yup", "XSS defense", "JSON feeds"],
  },
  {
    id: "ims",
    company: "IMS Integrated Merchandising Solutions",
    title: "Front End React / Full Stack Engineer",
    dates: "May 2019 – Jun 2021",
    location: "Morton Grove, IL",
    bullets: [
      "Built reusable components for a multi-tenant application serving multiple client portals.",
      "Contributed to architecting a CMS that rearranged visual layouts based on which client signed in through the portal.",
      "Worked on the Smile Makers Online ecommerce platform, supporting payment and account-based purchasing for McDonald's branded merchandise across its U.S. restaurant network.",
      "Worked with enterprise nopCommerce, including a B2B payment system that charged the company card.",
    ],
    tags: ["React", "Multi-tenant", "CMS", "nopCommerce", "B2B payments"],
  },
  {
    id: "ymca",
    company: "YMCA of Metropolitan Chicago",
    title: "Software Engineer / Web Developer",
    dates: "Oct 2017 – Mar 2019",
    location: "Greater Chicago Area",
    bullets: [
      "Maintained and enhanced digital marketing properties on enterprise CMS (ExpressionEngine), PHP, JavaScript and HTML/CSS.",
      "Translated UI/UX design assets from Adobe Creative Suite into accessible, standards-compliant web pages.",
      "Implemented SEO best practices and API integrations to increase marketing reach and operational efficiency.",
    ],
    tags: ["ExpressionEngine", "PHP", "SEO", "Accessibility"],
  },
  {
    id: "freelance",
    company: "Freelance / UX Design",
    title: "Web Developer & User Experience Designer",
    dates: "Jan 2013 – Dec 2019",
    location: "Remote",
    bullets: [
      "Designed and built custom mobile-responsive web applications for client brands using JavaScript, Node.js, HTML5, CSS3 and CMS platforms.",
      "Ran end-to-end UX/UI workflows: user research, wireframing and interactive prototyping in Figma, Sketch and Adobe XD.",
    ],
    tags: ["Node.js", "Figma", "Sketch", "Adobe XD", "Prototyping"],
  },
];

export type ProjectGroup = "Enterprise" | "Independent";

export type Project = {
  id: string;
  name: string;
  category: string;
  group: ProjectGroup;
  blurb: string;
  focus: string[];
  domain: string;
  href?: string;
  glyph: string;
  tone: "ink" | "butter" | "white";
};

export const projects: Project[] = [
  {
    id: "capital-one-shopping",
    name: "Capital One Shopping",
    category: "Fintech · Shopping",
    group: "Enterprise",
    blurb:
      "Full-stack features and internal-tool APIs while the retailer network grew from 30K to 100K+.",
    focus: ["JavaScript", "Node.js", "SQL"],
    domain: "capitaloneshopping.com",
    glyph: "C1",
    tone: "ink",
  },
  {
    id: "coopers-hawk-shop",
    name: "Cooper's Hawk Shop",
    category: "Ecommerce",
    group: "Enterprise",
    blurb:
      "Online store for handcrafted wine and gifts, with PCI-compliant payment forms on Bluepay iframes.",
    focus: ["PCI", "Bluepay", "Zod"],
    domain: "shop.coopershawkwinery.com",
    href: "https://shop.coopershawkwinery.com/",
    glyph: "CH",
    tone: "butter",
  },
  {
    id: "coopers-hawk-winery",
    name: "Cooper's Hawk Winery",
    category: "Hospitality · Membership",
    group: "Enterprise",
    blurb:
      "Flagship site for the winery-restaurant brand: Wine Club checkout, live content feeds, and injection-hardened forms.",
    focus: ["Wine Club", "JSON feeds", "XSS defense"],
    domain: "chwinery.com",
    href: "https://chwinery.com/",
    glyph: "CHW",
    tone: "white",
  },
  {
    id: "smile-makers",
    name: "Smile Makers Online",
    category: "B2B Ecommerce",
    group: "Enterprise",
    blurb:
      "McDonald's branded merchandise store with payment and account-based purchasing across the U.S. restaurant network.",
    focus: ["Payments", "Accounts", "Multi-tenant"],
    domain: "smilemakersonline.com",
    href: "https://smilemakersonline.com/",
    glyph: "SM",
    tone: "ink",
  },
  {
    id: "darick-dive",
    name: "Darick's Dive Recovery",
    category: "Local business",
    group: "Independent",
    blurb:
      "Underwater search-and-recovery service at Lake of the Ozarks, with an immersive WebGL water scene and a clear find-it-or-it's-free guarantee.",
    focus: ["Next.js", "Three.js", "Lenis"],
    domain: "darickdiving.vercel.app",
    href: "https://darickdiving.vercel.app",
    glyph: "DD",
    tone: "butter",
  },
  {
    id: "first-step-junk",
    name: "First Step Junk Removal",
    category: "Local business",
    group: "Independent",
    blurb:
      "Junk removal and estate cleanouts in Rockford, IL, with upfront pricing, arrival windows and free estimates by phone, text or photo.",
    focus: ["Marketing site", "Local SEO", "Lead capture"],
    domain: "firststepjunk.com",
    href: "https://firststepjunk.com",
    glyph: "FSJ",
    tone: "white",
  },
  {
    id: "fsj-invoice",
    name: "FSJ Invoice Generator",
    category: "Business tool",
    group: "Independent",
    blurb:
      "Client-side invoice generator for First Step Junk. Fill the form, get a PDF, and nothing leaves the browser.",
    focus: ["Next.js", "Static export", "jsPDF"],
    domain: "fsj-invoice.netlify.app",
    href: "https://fsj-invoice.netlify.app/",
    glyph: "INV",
    tone: "ink",
  },
  {
    id: "mission-007",
    name: "Mission 007",
    category: "Nonprofit",
    group: "Independent",
    blurb:
      "Site for a youth mentorship nonprofit: one-on-one mentoring, skills training, backpack giveaways and community events.",
    focus: ["Next.js", "Content", "Community"],
    domain: "mission007.org",
    href: "https://mission007.org",
    glyph: "007",
    tone: "butter",
  },
  {
    id: "protech-scheduler",
    name: "Protech Event Scheduler",
    category: "Operations software",
    group: "Independent",
    blurb:
      "Crew scheduling portal for Protech Event Solutions: confirmations, automated reminders and AI-assisted replacement outreach.",
    focus: ["Scheduling", "Automation", "AI outreach"],
    domain: "sched.protecheventsolutions.com",
    href: "https://sched.protecheventsolutions.com",
    glyph: "PTES",
    tone: "white",
  },
  {
    id: "veltrix-drive",
    name: "Veltrix Drive",
    category: "Automotive platform",
    group: "Independent",
    blurb:
      "Vehicle ownership platform with fleet profiles, maintenance timelines, investment tracking, documents, calendar and a voice copilot.",
    focus: ["Dashboard", "Voice copilot", "Reports"],
    domain: "veltrix-drive.vercel.app",
    href: "https://veltrix-drive.vercel.app/",
    glyph: "VD",
    tone: "ink",
  },
  {
    id: "veltrix-inspect",
    name: "Veltrix Inspect",
    category: "Automotive tool",
    group: "Independent",
    blurb:
      "Pre-rental vehicle inspection checklist with guided sections, saved records, PDF export and e-signature sign-off.",
    focus: ["Forms", "PDF export", "E-signature"],
    domain: "veltrix-car-checklist-335.netlify.app",
    href: "https://veltrix-car-checklist-335.netlify.app/",
    glyph: "VI",
    tone: "butter",
  },
  {
    id: "spades",
    name: "Spades · Denver",
    category: "Music",
    group: "Independent",
    blurb:
      "Artist and producer landing site, rebuilt from a CRA build onto Next.js and Payload CMS with a Postgres-backed admin.",
    focus: ["Next.js", "Payload CMS", "Postgres"],
    domain: "spadesmusic.netlify.app",
    href: "https://spadesmusic.netlify.app/",
    glyph: "SP",
    tone: "white",
  },
  {
    id: "lit-wit-tre",
    name: "LIT WIT TRE",
    category: "Brand",
    group: "Independent",
    blurb: "Join-the-movement landing page for the LIT WIT TRE brand.",
    focus: ["Landing page", "Branding"],
    domain: "lit-wit-tre.vercel.app",
    href: "https://lit-wit-tre.vercel.app/",
    glyph: "LWT",
    tone: "ink",
  },
  {
    id: "canigan-health",
    name: "Canigan Health Options",
    category: "Wellness",
    group: "Independent",
    blurb:
      "Personalized-nutrition brand site with membership benefits and an Ambassador program.",
    focus: ["Marketing site", "Brand", "Content"],
    domain: "caniganhealthoptions.com",
    href: "https://caniganhealthoptions.com",
    glyph: "CHO",
    tone: "butter",
  },
  {
    id: "canigan-dash",
    name: "Canigan Dash",
    category: "Internal tool",
    group: "Independent",
    blurb:
      "Private sign-in dashboard for projects, tasks, files and cross-organization collaboration, with Gmail integration.",
    focus: ["Auth", "Dashboard", "Gmail API"],
    domain: "canigan-dash.vercel.app",
    href: "https://canigan-dash.vercel.app/",
    glyph: "CD",
    tone: "white",
  },
];

export const skillGroups: { label: string; items: string[] }[] = [
  {
    label: "Languages & Frameworks",
    items: [
      "JavaScript (ES6+)",
      "TypeScript",
      "React.js",
      "Next.js",
      "Node.js",
      "Gatsby.js",
      "HTML5",
      "CSS3",
      "JSON",
    ],
  },
  {
    label: "Security & Auth",
    items: [
      "JWT",
      "bcrypt",
      "Hashing",
      "PCI compliance",
      "White-hat pen-testing",
      "Canary tokens",
      "AI/LLM security assessment",
    ],
  },
  {
    label: "Backend & Data",
    items: [
      "REST APIs",
      "GraphQL",
      "PostgreSQL",
      "MongoDB",
      "MySQL",
      "Vector databases",
    ],
  },
  {
    label: "AI & Retrieval",
    items: ["RAG", "CAG", "Cost-aware model usage", "Feature flags"],
  },
  {
    label: "Tools & Cloud",
    items: [
      "Vercel",
      "AWS",
      "Azure",
      "GCP",
      "Netlify",
      "Hasura",
      "Git & GitHub",
      "Postman",
      "Jira",
      "Confluence",
      "Agile/Scrum",
    ],
  },
  {
    label: "Creative Dev",
    items: ["Three.js / R3F", "Lenis", "Motion", "GSAP"],
  },
  {
    label: "Styling & Layout",
    items: [
      "Flexbox",
      "CSS Grid",
      "Styled Components",
      "Material Design",
      "Bootstrap",
      "Tachyons",
    ],
  },
  {
    label: "CMS",
    items: ["Headless CMS", "ExpressionEngine", "WordPress API", "Payload"],
  },
  {
    label: "UX/UI & Design",
    items: [
      "Figma",
      "Sketch",
      "Adobe Creative Cloud",
      "Responsive design",
      "Accessibility",
      "Cross-browser testing",
    ],
  },
];

export const marqueeRows = [
  ["React", "Next.js", "Node.js", "TypeScript", "PCI", "GraphQL"],
  ["Payments", "Security", "APIs", "PostgreSQL", "UX", "GSAP"],
];

export const credentials = {
  education: {
    school: "DePaul University",
    detail: "Coursework in Human Computer Interaction (HCI)",
  },
  certifications: {
    range: "Jan 2022 – Feb 2023",
    items: ["SoloLearn JavaScript Certification", "Node.js Developer Certification (Wes Bos)"],
  },
  training: [
    "Information security & privacy",
    "Phishing & social engineering",
    "Regulatory compliance & AML principles",
    "Data protection",
  ],
};
