import Image from "next/image";

import LeadForm from "./components/lead-form";
import { CONTACT, whatsappLink } from "./lib/site";

const MAP_SRC =
  "https://www.google.com/maps?q=Reliance+Corporate+Park,+Ghansoli,+Navi+Mumbai&output=embed";

const HERO_STATS = [
  { value: "47.5 Acres", label: "Integrated development" },
  { value: "₹5,000+ Cr", label: "Total investment" },
  { value: "Ghansoli", label: "Navi Mumbai" },
  { value: "Taj Hotel + IT Park", label: "In campus" },
];

const WHY_CARDS = [
  {
    icon: "shield",
    title: "Tata Brand",
    body: "Trusted developer, TRIL backed, ₹5,000 Cr committed.",
  },
  {
    icon: "campus",
    title: "Integrated Campus",
    body: "Taj Hotel, Smartworks IT Park, and retail in one campus.",
  },
  {
    icon: "forest",
    title: "Low Density",
    body: "Only 7 towers on 10.33 acres — large open spaces, hill views.",
  },
  {
    icon: "pin",
    title: "Location",
    body: "Next to Reliance Corporate Park, near upcoming Adani 100-acre commercial hub.",
  },
];

const CONFIGURATIONS = [
  {
    type: "2 BHK",
    size: "~750+ sq.ft",
    price: "[client to fill]",
    image: "/config-2bhk.webp",
    alt: "Residents' lounge with bar seating and a games zone",
  },
  {
    type: "3 BHK",
    size: "~970 – 1,155 sq.ft",
    price: "[client to fill]",
    image: "/config-3bhk.webp",
    alt: "Landscaped lobby with lounge seating and a sculpture",
  },
];

// Verbatim from the brief's "About the Property" tables — no figures invented.
const SPEC_TABLES = [
  {
    title: "Location",
    rows: [
      ["Project Name", "Tata Realty Integrated Development (Pre-Launch)"],
      ["Developer", "Tata Realty & Infrastructure Ltd"],
      ["Location", "Ghansoli, Navi Mumbai"],
      ["Total Campus", "47.5 acres integrated development"],
      ["Campus Mix", "Residential + Commercial + Hospitality"],
      ["Landmark", "Adjacent to Reliance Corporate Park"],
      ["Nearby", "Upcoming 100-acre Adani Commercial Park, IT hubs"],
      ["Total Investment", "₹5,000+ Crore"],
      ["RERA Number", "To be confirmed"],
    ],
  },
  {
    title: "Residential Offering",
    rows: [
      ["Type", "Premium 2 BHK & 3 BHK"],
      ["2 BHK Size", "~750+ sq.ft"],
      ["3 BHK Size", "~970 to 1,155 sq.ft"],
      ["Tower Config", "High-rise G+40 / G+42 towers"],
      ["Density", "Low density — only ~7 towers across ~10.33 acres"],
      ["Views", "Lifetime open green / hill views"],
      ["Amenities", "Premium lifestyle amenities + large open spaces"],
      ["Launch Status", "Pre-Launch"],
      ["Price", "To be confirmed"],
      ["Possession", "To be confirmed"],
    ],
  },
];

const ECOSYSTEM = [
  {
    title: "Smartworks IT Park",
    status: "Operational",
    body: "5,000+ professionals working on campus.",
  },
  {
    title: "Taj Hotel",
    status: "Under Development",
    body: "World-class hospitality at your doorstep.",
  },
  {
    title: "Upcoming Adani Commercial Park",
    status: "Upcoming",
    body: "100 acres of commercial growth next door.",
  },
];

const LOCATION_POINTS = [
  "Adjacent to Reliance Corporate Park",
  "Close to upcoming 100-acre Adani Commercial Park",
  "Strong IT & corporate catchment zone",
  "Future growth corridor for Navi Mumbai",
  "Well connected to Thane, Vashi, and greater Mumbai",
];

const MARQUEE_ITEMS = [
  "47.5 Acres",
  "₹5,000+ Cr Investment",
  "G+40 / G+42 Towers",
  "Taj Hotel in Campus",
  "Smartworks IT Park",
  "Ghansoli, Navi Mumbai",
];

const FAQS = [
  {
    q: "What is the Tata Realty Ghansoli project?",
    a: "A pre-launch premium residential development by Tata Realty & Infrastructure Ltd, set within a 47.5-acre integrated campus at Ghansoli, Navi Mumbai, with a total investment of ₹5,000+ crore.",
  },
  {
    q: "What configurations are available?",
    a: "Premium 2 BHK of ~750+ sq.ft and 3 BHK of ~970 to 1,155 sq.ft, in high-rise G+40 / G+42 towers.",
  },
  {
    q: "When will the project launch?",
    a: "The project is at pre-launch stage. Launch and possession dates are yet to be confirmed — share your details and Rahul Thakur will update you as soon as they are announced.",
  },
  {
    q: "What is included in the 47.5-acre campus?",
    a: "A mix of residential, commercial and hospitality — an IT Park already delivered and leased to Smartworks, a Taj Hotel currently under development, and only ~7 residential towers across ~10.33 acres with premium lifestyle amenities and large open spaces.",
  },
  {
    q: "Why should I invest at pre-launch?",
    a: "Pre-launch rates are available for a limited period only. The campus sits adjacent to Reliance Corporate Park and close to the upcoming 100-acre Adani Commercial Park, in a strong IT and corporate catchment expected to bring 5,000+ working professionals in the near term.",
  },
  {
    q: "Do I need to visit to get started?",
    a: "No. Share your name and number, and Rahul Thakur will call you back within 30 minutes with pricing and floor plan details.",
  },
];

function SectionLabel({
  children,
  dark = false,
}: {
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-medium tracking-[0.18em] uppercase ${
        dark ? "border-white/15 bg-white/5 text-white/60" : "border-line bg-white/70 text-muted"
      }`}
    >
      <span className="size-1.5 rounded-full bg-gold" />
      {children}
    </span>
  );
}

/** Material Symbols (24dp, weight 400) — filled paths on a 0 -960 960 960 grid */
const CARD_ICONS: Record<string, string> = {
  shield:
    "M467-85q-6-1-12-3-135-45-215-166.5T160-516v-189q0-25 14.5-45t37.5-29l240-90q14-5 28-5t28 5l240 90q23 9 37.5 29t14.5 45v189q0 140-80 261.5T505-88q-6 2-12 3t-13 1q-7 0-13-1Zm13-79q104-33 172-132t68-220v-189l-240-90-240 90v189q0 121 68 220t172 132Zm0-316Z",
  campus:
    "M200-120q-33 0-56.5-23.5T120-200v-400q0-33 23.5-56.5T200-680h80v-80q0-33 23.5-56.5T360-840h240q33 0 56.5 23.5T680-760v240h80q33 0 56.5 23.5T840-440v240q0 33-23.5 56.5T760-120H520v-160h-80v160H200Zm0-80h80v-80h-80v80Zm0-160h80v-80h-80v80Zm0-160h80v-80h-80v80Zm160 160h80v-80h-80v80Zm0-160h80v-80h-80v80Zm0-160h80v-80h-80v80Zm160 320h80v-80h-80v80Zm0-160h80v-80h-80v80Zm0-160h80v-80h-80v80Zm160 480h80v-80h-80v80Zm0-160h80v-80h-80v80Z",
  forest:
    "M280-120v-120H73q-24 0-35-21t2-41l114-178q-23 0-34.5-20.5T122-541l205-292q12-17 33-17t33 17l87 125 87-125q12-17 33-17t33 17l205 292q14 20 2.5 40.5T806-480l114 178q13 20 2 41t-35 21H680v120q0 17-11.5 28.5T640-80h-80q-17 0-28.5-11.5T520-120v-120h-80v120q0 17-11.5 28.5T400-80h-80q-17 0-28.5-11.5T280-120Zm389-200h145L659-560h67L600-740l-71 101 69 98q14 20 2.5 40.5T566-480l103 160Zm-523 0h428L419-560h67L360-740 234-560h67L146-320Zm0 0h155-67 252-67 155-428Zm523 0H566h74-111 197-67 155-145Zm-149 80h160-160Zm201 0Z",
  pin: "M480-186q122-112 181-203.5T720-552q0-109-69.5-178.5T480-800q-101 0-170.5 69.5T240-552q0 71 59 162.5T480-186Zm-28 74q-14-5-25-15-65-60-115-117t-83.5-110.5q-33.5-53.5-51-103T160-552q0-150 96.5-239T480-880q127 0 223.5 89T800-552q0 45-17.5 94.5t-51 103Q698-301 648-244T533-127q-11 10-25 15t-28 5q-14 0-28-5Zm28-448Zm56.5 56.5Q560-527 560-560t-23.5-56.5Q513-640 480-640t-56.5 23.5Q400-593 400-560t23.5 56.5Q447-480 480-480t56.5-23.5Z",
};

function CardIcon({ name, className = "size-6" }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 -960 960 960" fill="currentColor" className={className} aria-hidden="true">
      <path d={CARD_ICONS[name]} />
    </svg>
  );
}

function Icon({ name, className = "size-5" }: { name: string; className?: string }) {
  const paths: Record<string, React.ReactNode> = {
    phone: (
      <path d="M6.5 3h3l1.5 4-2 1.5a12 12 0 0 0 6.5 6.5L17 13l4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 3.5 5.2 2 2 0 0 1 5.5 3Z" />
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3.5 7 8.5 6 8.5-6" />
      </>
    ),
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export default function Home() {
  return (
    <>
      {/* Identity strip — channel partner badge only, no navigation menu */}
      <header className="sticky top-0 z-40 border-b border-line/70 bg-cream/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="font-display grid size-9 place-items-center rounded-lg bg-navy text-sm font-semibold text-gold">
              TR
            </span>
            <span className="leading-tight">
              <span className="block text-[10px] tracking-[0.18em] text-muted uppercase">
                Channel Partner for
              </span>
              <span className="font-display block text-sm font-semibold text-navy">
                Tata Realty
              </span>
            </span>
          </div>
          <a
            href={CONTACT.phoneHref}
            className="inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2 text-xs font-semibold text-cream transition hover:bg-navy-deep sm:text-sm"
          >
            <Icon name="phone" className="size-4" />
            <span className="hidden sm:inline">Call {CONTACT.name}</span>
            <span className="sm:hidden">Call now</span>
          </a>
        </div>
      </header>

      <main className="flex-1">
        {/* ── SECTION 1 · HERO ───────────────────────────────────────────── */}
        <section className="relative">
          {/*
           * Below lg the copy stacks above the render. From lg it overlays the
           * render's empty left half — the tower occupies roughly the right 36%,
           * so a max-w-xl column stays clear of it.
           */}
          <div className="lg:absolute lg:inset-0 lg:z-10 lg:flex lg:items-start">
            <div className="mx-auto w-full max-w-7xl px-5 pt-10 pb-3 sm:px-8 lg:pt-[9%] lg:pb-0">
              <div className="max-w-xl">
                <SectionLabel>Pre-Launch · Tata Realty · Ghansoli, Navi Mumbai</SectionLabel>
                <h1 className="font-display mt-5 text-3xl leading-[1.05] font-semibold text-black sm:mt-6 sm:text-5xl">
                  Tata Realty&apos;s Most Prestigious Development in Navi Mumbai — Now
                  Pre-Launching at Ghansoli
                </h1>
                <p className="mt-5 text-sm leading-relaxed text-black/75 sm:text-base lg:text-lg">
                  Premium 2 &amp; 3 BHK residences within a 47.5-acre integrated campus — Taj
                  Hotel, IT Park, and open green views in one address.
                </p>
                <p className="font-deva mt-3 text-sm text-black sm:text-base">
                  एक बार का मौका - टाटा का प्रीमियम प्रोजेक्ट, नवी मुंबई में।
                </p>

                <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row">
                  <a
                    href="#lead-form"
                    className="group inline-flex items-center gap-3 rounded-xl bg-black py-2 pr-2 pl-6 text-sm font-semibold text-white shadow-[0_12px_32px_-14px_rgba(0,0,0,0.6)] transition hover:bg-black/85"
                  >
                    Get Pre-Launch Price
                    <span className="grid size-9 place-items-center rounded-lg bg-gold text-navy-deep transition group-hover:translate-x-0.5">
                      <Icon name="arrow" className="size-4" />
                    </span>
                  </a>
                  <a
                    href={CONTACT.phoneHref}
                    className="group inline-flex items-center gap-3 rounded-xl bg-black py-2 pr-2 pl-6 text-sm font-semibold text-white shadow-[0_12px_32px_-14px_rgba(0,0,0,0.6)] transition hover:bg-black/85"
                  >
                    Call {CONTACT.name}
                    <span className="grid size-9 place-items-center rounded-lg bg-gold text-navy-deep">
                      <Icon name="phone" className="size-4" />
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/*
           * Fixed 950px band. `object-bottom` keeps the tower and the misty
           * sky-to-field gradient anchored, so the fixed height eats into the
           * blank sky at the top rather than the composition.
           */}
          <div className="relative h-[950px] w-full overflow-hidden">
            <Image
              src="/hero-home.webp"
              alt="High-rise residential tower beside open green fields"
              fill
              priority
              sizes="100vw"
              className="object-cover object-bottom"
            />
          </div>

          {/*
           * Stat bar straddles the seam. The zero-height wrapper sits exactly on
           * the bottom edge of the render, and -translate-y-1/2 shifts the bar up
           * by half its own height — so the 50/50 split holds at any breakpoint,
           * however the cells wrap.
           */}
          <div className="relative z-20 mx-auto h-0 w-full max-w-7xl px-5 sm:px-8">
            <dl className="grid -translate-y-1/2 grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line shadow-[0_18px_44px_-24px_rgba(27,42,74,0.45)] lg:grid-cols-4">
              {HERO_STATS.map((stat) => (
                <div key={stat.value} className="bg-white px-5 py-6 sm:px-7">
                  <dt className="font-display text-xl font-semibold text-black sm:text-2xl">
                    {stat.value}
                  </dt>
                  <dd className="mt-1 text-xs tracking-wide text-muted uppercase">
                    {stat.label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ── SECTION 2 · WHY THIS PROJECT ───────────────────────────────── */}
        <section className="bg-white">
          {/* Extra top padding clears the half of the stat bar hanging into it */}
          <div className="mx-auto w-full max-w-7xl px-5 pt-[174px] pb-16 sm:px-8 lg:pt-[126px] lg:pb-24">
            <SectionLabel>Why This Project</SectionLabel>
            <h2 className="font-display mt-6 max-w-3xl text-3xl leading-tight font-semibold text-black sm:text-4xl lg:text-5xl">
              Why Tata Realty at Ghansoli is Different
            </h2>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-black/70 lg:text-lg">
              Tata Realty &amp; Infrastructure Ltd has committed ₹5,000+ crore to a 47.5-acre
              integrated campus at Ghansoli — residential, commercial and hospitality in one
              address. The IT Park is already delivered and leased to Smartworks, with a Taj
              Hotel under development on the same campus.
            </p>

            <div className="mt-12 grid gap-[30px] sm:grid-cols-2 lg:grid-cols-4">
              {WHY_CARDS.map((card) => (
                <article
                  key={card.title}
                  className="flex flex-col rounded-2xl border border-line bg-white p-7 transition hover:border-gold/60"
                >
                  <span className="grid size-11 place-items-center rounded-xl bg-gold-tint text-black">
                    <CardIcon name={card.icon} />
                  </span>
                  <h3 className="font-display mt-6 text-lg font-semibold text-black">
                    {card.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-black/70">{card.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 3 · CONFIGURATIONS & PRICING ───────────────────────── */}
        <section className="bg-white">
          <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
            <SectionLabel>Configurations</SectionLabel>
            <h2 className="font-display mt-6 text-3xl leading-tight font-semibold text-black sm:text-4xl lg:text-5xl">
              Choose Your Home
            </h2>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-black/70 lg:text-lg">
              Premium 2 and 3 BHK residences in high-rise G+40 / G+42 towers, with lifetime open
              green and hill views. Set among premium lifestyle amenities and large open spaces,
              across a low-density layout of only ~7 towers.
            </p>

            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              {CONFIGURATIONS.map((config) => (
                <article
                  key={config.type}
                  className="overflow-hidden rounded-3xl border border-line bg-cream"
                >
                  <div className="relative h-48 sm:h-56">
                    <Image
                      src={config.image}
                      alt={config.alt}
                      fill
                      sizes="(min-width: 1024px) 620px, 100vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-7 sm:p-8">
                    <h3 className="font-display text-2xl font-semibold text-black">
                      {config.type}
                    </h3>
                    <dl className="mt-6 divide-y divide-line border-y border-line text-sm">
                      <div className="flex items-center justify-between py-3">
                        <dt className="text-muted">Size</dt>
                        <dd className="font-medium text-navy">{config.size}</dd>
                      </div>
                      <div className="flex items-center justify-between py-3">
                        <dt className="text-muted">Price</dt>
                        <dd className="font-medium text-navy">{config.price}</dd>
                      </div>
                    </dl>
                    <a
                      href="#lead-form"
                      className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-navy px-6 py-3.5 text-sm font-semibold text-cream transition hover:bg-navy-deep"
                    >
                      Get Price Details
                      <Icon name="arrow" className="size-4" />
                    </a>
                  </div>
                </article>
              ))}
            </div>

            <p className="mt-8 rounded-2xl border border-gold/30 bg-gold-tint/50 px-6 py-4 text-sm text-navy">
              Exact pricing and floor plans shared on enquiry only — pre-launch rates available
              for a limited period.
            </p>
          </div>
        </section>

        {/* ── PROJECT DETAILS · the brief's Location & Residential Offering tables ── */}
        <section className="relative isolate overflow-hidden">
          <Image
            src="/details-backdrop.webp"
            alt=""
            fill
            sizes="100vw"
            className="-z-10 object-cover"
          />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-black/70" />

          <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
            <SectionLabel dark>Project Details</SectionLabel>
            <h2 className="font-display mt-6 text-3xl leading-tight font-semibold text-white sm:text-4xl lg:text-5xl">
              About the Property
            </h2>

            <div className="mt-12 grid gap-[30px] lg:grid-cols-2">
              {SPEC_TABLES.map((table) => (
                <div
                  key={table.title}
                  className="rounded-3xl border border-line bg-white p-7 sm:p-9"
                >
                  <h3 className="font-display text-xl font-semibold text-navy">{table.title}</h3>
                  <dl className="mt-6 divide-y divide-line border-t border-line text-sm">
                    {table.rows.map(([term, value]) => (
                      <div
                        key={term}
                        className="grid gap-1 py-3.5 sm:grid-cols-[11rem_1fr] sm:gap-4"
                      >
                        <dt className="text-muted">{term}</dt>
                        <dd className="font-medium text-navy">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 4 · CAMPUS ECOSYSTEM ───────────────────────────────── */}
        <section className="bg-navy py-16 lg:py-24">
          <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
            <SectionLabel dark>Campus Ecosystem</SectionLabel>
            <div className="mt-6 grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-end">
              <h2 className="font-display text-3xl leading-tight font-semibold text-white sm:text-4xl lg:text-5xl">
                More Than a Home — An Integrated Address
              </h2>
              <p className="max-w-3xl text-base leading-relaxed text-white/60 lg:text-lg">
                Ghansoli is fast becoming Navi Mumbai&apos;s next major corporate and lifestyle
                corridor.
              </p>
            </div>

            <div className="mt-12 divide-y divide-white/10 border-y border-white/10">
              {ECOSYSTEM.map((item, index) => (
                <article
                  key={item.title}
                  className="grid gap-4 py-8 sm:grid-cols-[auto_1fr_1fr] sm:items-center sm:gap-8"
                >
                  <span className="font-display text-sm text-gold">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-semibold text-white sm:text-2xl">
                      {item.title}
                    </h3>
                    <span className="mt-2 inline-block rounded-full border border-gold/40 px-3 py-1 text-[11px] tracking-wide text-gold uppercase">
                      {item.status}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-white/60 sm:text-base">
                    {item.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 5 · LOCATION & CONNECTIVITY ────────────────────────── */}
        <section className="bg-white">
          <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
            <SectionLabel>Location</SectionLabel>
            <h2 className="font-display mt-6 text-3xl leading-tight font-semibold text-black sm:text-4xl lg:text-5xl">
              Where Ghansoli Stands
            </h2>

            <div className="mt-12 grid gap-8 lg:grid-cols-2 lg:gap-10">
              <div className="overflow-hidden rounded-3xl border border-line bg-white">
                <iframe
                  src={MAP_SRC}
                  title="Map of Ghansoli, Navi Mumbai near Reliance Corporate Park"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-80 w-full lg:h-full lg:min-h-[26rem]"
                />
              </div>

              <div className="flex flex-col justify-between rounded-3xl border border-line bg-white p-7 sm:p-9">
                <ul className="divide-y divide-line">
                  {LOCATION_POINTS.map((point) => (
                    <li key={point} className="flex items-start gap-4 py-4 first:pt-0">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold" />
                      <span className="text-sm leading-relaxed text-navy sm:text-base">
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>
                <a
                  href="#lead-form"
                  className="mt-8 inline-flex items-center justify-center gap-2 rounded-full border border-navy/20 px-6 py-3.5 text-sm font-semibold text-navy transition hover:bg-navy hover:text-cream"
                >
                  Ask About Connectivity
                  <Icon name="arrow" className="size-4" />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 6 · CONTACT CARD ───────────────────────────────────── */}
        <section className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
          <SectionLabel>Your Point of Contact</SectionLabel>

          <div className="mt-10 grid gap-10 rounded-3xl bg-navy p-8 sm:p-12 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="font-display text-3xl font-semibold text-white sm:text-4xl">
                {CONTACT.name}
              </p>
              <p className="mt-2 text-sm tracking-wide text-gold uppercase">{CONTACT.role}</p>
              <p className="mt-1 text-sm text-white/50">{CONTACT.location}</p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:gap-10">
                <a
                  href={CONTACT.phoneHref}
                  className="flex items-center gap-3 text-sm text-white/80 transition hover:text-gold"
                >
                  <Icon name="phone" className="size-4 text-gold" />
                  {CONTACT.phone}
                </a>
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="flex items-center gap-3 text-sm text-white/80 transition hover:text-gold"
                >
                  <Icon name="mail" className="size-4 text-gold" />
                  {CONTACT.email}
                </a>
              </div>
            </div>

            <a
              href="#lead-form"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gold px-8 py-4 text-sm font-semibold text-navy-deep transition hover:bg-gold-soft"
            >
              Request a Callback
              <Icon name="arrow" className="size-4" />
            </a>
          </div>
        </section>

        {/* ── SECTION 7 · LEAD FORM ──────────────────────────────────────── */}
        <section id="lead-form" className="scroll-mt-24 bg-navy-deep py-16 lg:py-24">
          <div className="mx-auto w-full max-w-3xl px-5 text-center sm:px-8">
            <SectionLabel dark>Enquire Now</SectionLabel>
            <h2 className="font-display mt-6 text-3xl leading-tight font-semibold text-white sm:text-4xl lg:text-5xl">
              Get Pre-Launch Price &amp; Floor Plans
            </h2>

            <div className="mt-10 text-left">
              <LeadForm
                id="main-form"
                tone="dark"
                withConfiguration
                submitLabel="Get Pre-Launch Details"
              />
            </div>

            <p className="mt-8 text-xs text-white/40">
              RERA number to be added once confirmed.
            </p>
          </div>
        </section>

        {/* Marquee */}
        <div className="overflow-hidden border-y border-line bg-gold py-4">
          <div className="animate-marquee flex w-max">
            {[0, 1].map((copy) => (
              <ul key={copy} className="flex shrink-0" aria-hidden={copy === 1}>
                {MARQUEE_ITEMS.map((item) => (
                  <li
                    key={item}
                    className="font-display flex items-center gap-8 px-8 text-sm font-medium tracking-wide text-navy-deep uppercase sm:text-base"
                  >
                    {item}
                    <span className="size-1.5 rounded-full bg-navy-deep/40" />
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>

        {/* ── SECTION 8 · FAQ ────────────────────────────────────────────── */}
        <section className="bg-white">
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14 lg:py-24">
            <div>
              <SectionLabel>FAQ</SectionLabel>
              <h2 className="font-display mt-6 text-3xl leading-tight font-semibold text-black sm:text-4xl lg:text-5xl">
                Find answers to common questions about this project
              </h2>
              <div className="relative mt-8 hidden h-72 overflow-hidden rounded-3xl border border-line lg:block">
                <Image
                  src="/faq-aerial.webp"
                  alt="Aerial view of high-rise residential towers beside a waterfront"
                  fill
                  sizes="(min-width: 1024px) 45vw, 100vw"
                  className="object-cover"
                />
              </div>
            </div>

            <div className="divide-y divide-line rounded-3xl border border-line bg-cream px-6 sm:px-8">
              {FAQS.map((faq) => (
                <details key={faq.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-left">
                    <span className="font-display text-base font-semibold text-navy sm:text-lg">
                      {faq.q}
                    </span>
                    <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line text-navy transition group-open:rotate-45 group-open:border-gold group-open:bg-gold">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        className="size-4"
                        aria-hidden="true"
                      >
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </span>
                  </summary>
                  <p className="mt-3 pr-14 text-sm leading-relaxed text-muted">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="overflow-hidden bg-black">
        <div className="mx-auto w-full max-w-7xl px-5 pt-12 sm:px-8">
          <div className="grid gap-10 border-b border-white/10 pb-10 lg:grid-cols-2">
            <div>
              <p className="text-[10px] tracking-[0.18em] text-white/40 uppercase">
                Channel Partner for
              </p>
              <p className="font-display mt-1 text-2xl font-semibold text-white">Tata Realty</p>
              <p className="mt-6 max-w-md text-sm leading-relaxed text-white/50">
                {CONTACT.name} is a channel partner for Tata Realty and is not the developer. All
                details, sizes and images on this page are indicative and subject to change.
              </p>
              <p className="mt-4 text-sm text-white/50">RERA Number: To be confirmed.</p>
            </div>

            <div className="flex flex-col gap-3 text-sm lg:items-end">
              <p className="font-display text-base font-semibold text-white">{CONTACT.name}</p>
              <a href={CONTACT.phoneHref} className="text-white/70 transition hover:text-gold">
                {CONTACT.phone}
              </a>
              <a
                href={`mailto:${CONTACT.email}`}
                className="text-white/70 transition hover:text-gold"
              >
                {CONTACT.email}
              </a>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 px-5 py-2.5 font-medium text-white transition hover:border-gold hover:text-gold"
              >
                Chat on WhatsApp
              </a>
            </div>
          </div>

          <p className="pt-8 text-left text-xs text-white/40">
            © {new Date().getFullYear()} {CONTACT.name} · {CONTACT.role}
          </p>

          <p
            className="font-display -mb-3 pt-8 text-center text-[18vw] leading-[0.8] font-semibold text-white/[0.07] select-none lg:text-[13rem]"
            aria-hidden="true"
          >
            GHANSOLI
          </p>
        </div>
      </footer>

      {/* Sticky actions */}
      <a
        href={whatsappLink()}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed right-5 bottom-5 z-50 grid size-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:brightness-105"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="size-7" aria-hidden="true">
          <path d="M12.04 2c-5.5 0-9.96 4.46-9.96 9.96 0 1.76.46 3.48 1.34 5L2 22l5.2-1.36a9.9 9.9 0 0 0 4.84 1.24h.01c5.5 0 9.96-4.46 9.96-9.96A9.9 9.9 0 0 0 19.09 4.9 9.9 9.9 0 0 0 12.04 2Zm5.83 14.06c-.25.7-1.44 1.33-1.99 1.38-.53.05-1.02.24-3.44-.72-2.9-1.14-4.73-4.1-4.87-4.29-.14-.19-1.16-1.54-1.16-2.94 0-1.4.73-2.09.99-2.37.26-.28.57-.35.76-.35h.54c.18 0 .42-.07.65.5.25.6.83 2.06.9 2.21.07.14.12.31.02.5-.09.19-.14.31-.28.47l-.42.49c-.14.14-.28.29-.12.57.16.28.71 1.17 1.52 1.9 1.05.93 1.93 1.22 2.21 1.36.28.14.44.12.6-.07.16-.19.69-.81.88-1.08.19-.28.37-.23.63-.14.25.09 1.61.76 1.89.9.28.14.46.21.53.33.07.12.07.66-.18 1.35Z" />
        </svg>
      </a>
      <a
        href={CONTACT.phoneHref}
        aria-label={`Call ${CONTACT.name}`}
        className="fixed bottom-5 left-5 z-50 grid size-14 place-items-center rounded-full bg-navy text-gold shadow-lg transition hover:bg-navy-deep lg:hidden"
      >
        <Icon name="phone" className="size-6" />
      </a>
    </>
  );
}
