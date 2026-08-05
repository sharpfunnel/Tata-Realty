import Image from "next/image";

import LeadForm from "./components/lead-form";
import SessionRecorder from "./components/session-recorder";
import { CONTACT, whatsappLink } from "./lib/site";

const MAP_SRC =
  "https://www.google.com/maps?q=Reliance+Corporate+Park,+Ghansoli,+Navi+Mumbai&output=embed";

const HERO_STATS = [
  { value: "₹1.99 Cr", label: "Starting price" },
  { value: "47.5 Acres", label: "Integrated development" },
  { value: "₹5,000+ Cr", label: "Total investment" },
  { value: "Ghansoli", label: "Navi Mumbai" },
  { value: "Taj Hotel, Mall, School, IT Park", label: "In campus" },
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
    body: "Only 7 towers on 10.33 acres - large open spaces, hill views.",
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
    price: "₹1.99 Cr",
    image: "/config-2bhk.webp",
    alt: "Residents' lounge with bar seating and a games zone",
  },
  {
    type: "3 BHK",
    size: "~970 to 1,155 sq.ft",
    price: "₹3 Cr",
    image: "/config-3bhk.webp",
    alt: "Landscaped lobby with lounge seating and a sculpture",
  },
];

// Verbatim from the brief's "About the Property" tables - no figures invented.
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
      ["Density", "Low density - only ~7 towers across ~10.33 acres"],
      ["Views", "Lifetime open green / hill views"],
      ["Amenities", "Premium lifestyle amenities + large open spaces"],
      ["Launch Status", "Pre-Launch"],
      ["2 BHK Price", "₹1.99 Cr"],
      ["3 BHK Price", "₹3 Cr"],
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

// Generic residential amenities — the brief names none, only "Premium lifestyle
// amenities + large open spaces". Confirm the real amenity list with the client.
const AMENITIES = [
  {
    icon: "parking",
    title: "Parking space",
    body: "Secure and spacious parking available for residents and visitors.",
  },
  {
    icon: "elevator",
    title: "Elevator access",
    body: "Modern elevators providing smooth access to all floors.",
  },
  {
    icon: "children",
    title: "Children's play",
    body: "Safe and engaging play areas designed for children of all ages.",
  },
  {
    icon: "speedy",
    title: "Speedy internet",
    body: "High-speed internet connection for work, entertainment and smart living.",
  },
  {
    icon: "fire",
    title: "Fire protection",
    body: "Advanced fire safety systems ensuring protection and peace of mind.",
  },
  {
    icon: "yoga",
    title: "Yoga equipment",
    body: "Dedicated yoga equipment supporting wellness and daily fitness.",
  },
];

// Cards 1-3 restate connectivity facts from the brief. Cards 4-6 (shopping,
// schools, healthcare) are generic - the brief names no specific landmarks or
// distances. Confirm real names/distances with the client before ads go live.
const NEARBY = [
  {
    icon: "road",
    title: "Highways & Roads",
    body: "Well connected to Thane, Vashi and greater Mumbai.",
  },
  {
    icon: "briefcase",
    title: "Business Parks",
    body: "Adjacent to Reliance Corporate Park and the upcoming Adani Commercial Park.",
  },
  {
    icon: "monitor",
    title: "IT & Corporate Hubs",
    body: "A strong IT and corporate catchment right on the doorstep.",
  },
  {
    icon: "bag",
    title: "Shopping & Retail",
    body: "Retail and shopping options across the growing Ghansoli corridor.",
  },
  {
    icon: "cap",
    title: "Schools & Education",
    body: "Schools and educational institutions within easy reach.",
  },
  {
    icon: "health",
    title: "Healthcare",
    body: "Hospitals and clinics serving the wider Navi Mumbai region.",
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
    a: "The project is at pre-launch stage. Launch and possession dates are yet to be confirmed - share your details and Rahul Thakur will update you as soon as they are announced.",
  },
  {
    q: "What is included in the 47.5-acre campus?",
    a: "A mix of residential, commercial and hospitality - an IT Park already delivered and leased to Smartworks, a Taj Hotel currently under development, and only ~7 residential towers across ~10.33 acres with premium lifestyle amenities and large open spaces.",
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

/** Material Symbols (24dp, weight 400) - filled paths on a 0 -960 960 960 grid */
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

/** Client-supplied amenity glyphs — each keeps its own viewBox, rendered filled. */
const AMENITY_ICONS: Record<string, { viewBox: string; body: React.ReactNode }> = {
  parking: {
    viewBox: "0 0 272.523 272.523",
    body: (
      <>
        <path d="M193.26 118.059c-.877 0-1.777.126-2.677.373l-10.172 2.802-10.561-25.73c-2.993-7.289-11.838-13.22-19.717-13.22h-98.85c-7.88 0-16.724 5.931-19.716 13.22l-10.548 25.694-10.046-2.767a10 10 0 0 0-2.676-.373c-4.808 0-8.297 3.673-8.297 8.732v5.996c0 5.906 4.806 10.712 10.712 10.712h1.151l-1.705 4.153c-2.78 6.77-5.043 18.236-5.043 25.558v51.115c0 5.906 4.806 10.712 10.712 10.712h13.99c5.906 0 10.712-4.806 10.712-10.712V211.56h120.357v12.764c0 5.906 4.806 10.712 10.712 10.712h13.988c5.906 0 10.712-4.806 10.712-10.712V173.21c0-7.321-2.263-18.787-5.043-25.558l-1.705-4.153h1.294c5.906 0 10.712-4.806 10.712-10.712v-5.996c.001-5.059-3.489-8.732-8.296-8.732zM28.698 137.681l15.978-38.918c1.79-4.36 7.11-7.928 11.823-7.928h88.418c4.713 0 10.033 3.567 11.823 7.928l15.978 38.918c1.789 4.36-.602 7.928-5.315 7.928H34.014c-4.714-.001-7.105-3.568-5.316-7.928zm35.667 49.227a4.297 4.297 0 0 1-4.284 4.284H29.729a4.297 4.297 0 0 1-4.285-4.284v-14.566a4.297 4.297 0 0 1 4.285-4.284h30.352a4.3 4.3 0 0 1 4.284 4.284zm111.319 0a4.297 4.297 0 0 1-4.284 4.284h-30.352a4.3 4.3 0 0 1-4.284-4.284v-14.566a4.3 4.3 0 0 1 4.284-4.284H171.4a4.3 4.3 0 0 1 4.284 4.284z" />
        <path d="M259.125 37.486H208.39c-7.388 0-13.398 6.011-13.398 13.398v50.736c0 7.388 6.011 13.399 13.398 13.399h20.367v113.872a5 5 0 0 0 5 5 5 5 0 0 0 5-5V115.02h20.368c7.388 0 13.398-6.011 13.398-13.399V50.885c0-7.388-6.01-13.399-13.398-13.399zm-11.491 42.067c-2.918 2.627-7.216 3.959-12.774 3.959h-7.347c-.882 0-1.6.719-1.6 1.601v12.389a2.443 2.443 0 0 1-2.441 2.44h-5.564a2.443 2.443 0 0 1-2.441-2.44V55.007a2.444 2.444 0 0 1 2.441-2.442h14.016c9.285 0 12.751 1.399 15.599 3.816 3.004 2.549 4.526 6.453 4.526 11.606-.001 5.035-1.485 8.925-4.415 11.566z" />
        <path d="M239.681 62.825c-1.356-1.024-3.755-1.544-7.129-1.544h-5.039c-.882 0-1.6.718-1.6 1.599v10.182c0 .881.718 1.599 1.6 1.599h3.019c1.109 0 2.901-.082 3.994-.183 1.061-.097 4.056-.531 5.155-1.361 1.319-.998 1.988-2.724 1.988-5.129 0-2.428-.669-4.165-1.988-5.163z" />
      </>
    ),
  },
  elevator: {
    viewBox: "0 0 512 512",
    body: (
      <path d="M153 35v58h206V35zm60.3 13h32l-16 32zm74.7 0 16 32h-32zm-183 89v350h142V137zm160 0v350h142V137zm173 141v84h52v-84zm26 26a16 16 0 0 1 16 16 16 16 0 0 1-16 16 16 16 0 0 1-16-16 16 16 0 0 1 16-16" />
    ),
  },
  children: {
    viewBox: "0 0 511.299 511.299",
    body: (
      <path d="M478.742 32.557c-43.386-43.409-114.02-43.409-157.407 0L211.144 142.748l-15.738-15.738c-8.682-8.704-22.773-8.704-31.477 0L6.522 284.416A22.2 22.2 0 0 0 0 300.154a22.24 22.24 0 0 0 6.522 15.738l62.954 62.954a22.24 22.24 0 0 0 15.738 6.522 22.26 22.26 0 0 0 15.761-6.522L258.36 221.44c8.704-8.682 8.704-22.773 0-31.477l-15.738-15.738 47.638-47.616c3.206 23.174 13.29 45.568 31.076 63.354s40.181 27.871 63.377 31.076l-47.638 47.638-15.738-15.738c-8.704-8.704-22.795-8.704-31.477 0L132.452 410.323c-8.704 8.704-8.704 22.795 0 31.499l62.954 62.954a22.24 22.24 0 0 0 15.738 6.522 22.2 22.2 0 0 0 15.738-6.522l157.43-157.406c4.163-4.185 6.522-9.839 6.522-15.738s-2.36-11.576-6.522-15.738l-15.761-15.738 110.191-110.191c43.409-43.388 43.409-114.022 0-157.408m-31.477 125.929c-26.045 26.001-68.408 26.023-94.453 0-26.023-26.045-26.023-68.408 0-94.453C365.835 51.01 382.953 44.51 400.05 44.51c17.096 0 34.193 6.5 47.215 19.523 26.046 26.046 26.046 68.408 0 94.453" />
    ),
  },
  speedy: {
    viewBox: "0 0 24 24",
    body: (
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.25 1.25a6 6 0 0 0-6 6v9.5a6 6 0 0 0 6 6h9.5a6 6 0 0 0 6-6v-9.5a6 6 0 0 0-6-6zm-1.792 9.8c3.972-3.067 9.112-3.067 13.084 0a.75.75 0 1 0 .916-1.187c-4.511-3.484-10.404-3.484-14.916 0a.75.75 0 1 0 .916 1.188Zm9.723 2.991c-1.935-1.498-4.434-1.498-6.369 0a.75.75 0 1 1-.918-1.186c2.475-1.917 5.73-1.917 8.205 0a.75.75 0 1 1-.918 1.186M12 15a1.5 1.5 0 0 0 0 3h.008a1.5 1.5 0 0 0 0-3z"
      />
    ),
  },
  fire: {
    viewBox: "-32 0 512 512",
    body: (
      <path d="m434.027 26.329-168 28C254.693 56.218 256 67.8 256 72h-58.332C208.353 36.108 181.446 0 144 0c-39.435 0-66.368 39.676-52.228 76.203-52.039 13.051-75.381 54.213-90.049 90.884-4.923 12.307 1.063 26.274 13.37 31.197 12.317 4.926 26.279-1.075 31.196-13.37C75.058 112.99 106.964 120 168 120v27.076c-41.543 10.862-72 49.235-72 94.129V488c0 13.255 10.745 24 24 24h144c13.255 0 24-10.745 24-24V240c0-44.731-30.596-82.312-72-92.97V120h40c0 2.974-1.703 15.716 10.027 17.671l168 28C441.342 166.89 448 161.25 448 153.834V38.166c0-7.416-6.658-13.056-13.973-11.837M144 72c-8.822 0-16-7.178-16-16s7.178-16 16-16 16 7.178 16 16-7.178 16-16 16" />
    ),
  },
  yoga: {
    viewBox: "0 0 512 512",
    body: (
      <path d="M482.752 435.574c-6.928-8.1-23.127-40.492-23.127-40.492s2.676-3.448 0-15.051c-3.48-15.035-18.514-13.886-21.978-17.349-3.479-3.472-33.549-58.424-35.863-64.792s-27.772-78.662-27.772-78.662c-8.549-37.604-24.308-53.221-45.121-57.85-20.64-4.581-31.817-3.471-41.075-11.571-5.778-5.054-5.573-8.809-5.573-24.056 0 0 6.235-5.927 10.784-14.122 5.195-9.375 7.746-22.907 7.746-22.907 5.211-2.086 5.274-4.684 7.525-12.965 3.118-11.461 2.897-19.317-5.431-19.317C304.836 19.066 286.085 0 256 0c-30.07 0-48.821 19.066-46.853 56.441-8.328 0-8.564 7.856-5.432 19.317 2.251 8.281 2.314 10.879 7.51 12.965 0 0 2.55 13.532 7.762 22.907 4.55 8.194 10.784 14.122 10.784 14.122 0 15.247.189 19.002-5.589 24.056-9.242 8.1-20.435 6.99-41.059 11.571-20.828 4.628-36.572 20.246-45.12 57.85 0 0-25.457 72.294-27.771 78.662s-32.401 61.32-35.864 64.792c-3.464 3.463-18.514 2.314-21.978 17.349-2.676 11.603 0 15.051 0 15.051s-16.2 32.392-23.143 40.492c-6.942 8.092 5.794 13.878 13.886 3.464.944 1.409 4.156 2.424 7.793 2.912-28.228 31.251-12.138 71.964 31.55 69.98C118.291 510.3 256 485.316 256 485.316S393.707 510.3 429.54 511.93c43.688 1.984 59.778-38.729 31.534-69.98 3.652-.488 6.864-1.503 7.808-2.912 8.092 10.414 20.813 4.628 13.87-3.464m-299.629-51.725s-59.274 17.626-96.192 34.234c7.604-14.154 16.357-33.423 16.357-33.423l37.029-53.212 29.504-64.218s9.257 34.714 12.138 39.917c2.896 5.203 1.164 76.702 1.164 76.702m145.768 0s-1.732-71.498 1.149-76.702c2.897-5.203 12.154-39.917 12.154-39.917l29.504 64.218 37.013 53.212s8.769 19.27 16.373 33.423c-36.919-16.609-96.193-34.234-96.193-34.234" />
    ),
  },
};

function AmenityIcon({ name, className = "size-6" }: { name: string; className?: string }) {
  const icon = AMENITY_ICONS[name];
  return (
    <svg viewBox={icon.viewBox} fill="currentColor" className={className} aria-hidden="true">
      {icon.body}
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
    road: (
      <>
        <path d="M4 21 8 3M20 21 16 3" />
        <path d="M12 4v3M12 10.5v3M12 17v3" />
      </>
    ),
    briefcase: (
      <>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12.5h18" />
      </>
    ),
    monitor: (
      <>
        <rect x="3" y="4" width="18" height="12" rx="2" />
        <path d="M8 20h8M12 16v4" />
      </>
    ),
    bag: (
      <>
        <path d="M6 8h12l-1 12H7L6 8Z" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      </>
    ),
    cap: (
      <>
        <path d="M12 4 2 9l10 5 10-5-10-5Z" />
        <path d="M6 11v5c0 1 2.6 2.5 6 2.5s6-1.5 6-2.5v-5" />
      </>
    ),
    health: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="M12 8v8M8 12h8" />
      </>
    ),
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

/**
 * The single button treatment used across the page: black pill, white label,
 * gold icon chip. The faint ring keeps the edge readable on dark backgrounds
 * (the footer and the contact card) where black-on-black would disappear.
 */
function ActionButton({
  href,
  icon = "arrow",
  external = false,
  className = "",
  children,
}: {
  href: string;
  icon?: string;
  external?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`group inline-flex items-center gap-3 rounded-xl bg-black py-2 pr-2 pl-6 text-sm font-semibold text-white ring-1 ring-white/10 shadow-[0_12px_32px_-14px_rgba(0,0,0,0.6)] transition hover:bg-black/85 ${className}`}
    >
      <span>{children}</span>
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-gold text-black transition group-hover:translate-x-0.5">
        <Icon name={icon} className="size-4" />
      </span>
    </a>
  );
}

export default function Home() {
  return (
    <>
      {/* Full-page session recording — landing page only, never the admin */}
      <SessionRecorder />
      {/* Identity strip - channel partner badge only, no navigation menu */}
      <header className="sticky top-0 z-40 border-b border-line/70 bg-cream/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="font-display grid size-9 place-items-center rounded-lg bg-black text-sm font-semibold text-gold">
              TR
            </span>
            <span className="leading-tight">
              <span className="block text-[10px] tracking-[0.18em] text-muted uppercase">
                Channel Partner for
              </span>
              <span className="font-display block text-sm font-semibold text-black">
                Tata Realty
              </span>
            </span>
          </div>
          <ActionButton href={CONTACT.phoneHref} icon="phone" className="py-1.5 pl-5">
            Call Us
          </ActionButton>
        </div>
      </header>

      <main className="flex-1">
        {/* ── SECTION 1 · HERO ───────────────────────────────────────────── */}
        <section className="relative">
          {/*
           * Below lg the copy stacks above the render. From lg it overlays the
           * render's empty left half - the tower occupies roughly the right 36%,
           * so a max-w-xl column stays clear of it.
           */}
          <div className="lg:absolute lg:inset-0 lg:z-10 lg:flex lg:items-start">
            <div className="mx-auto w-full max-w-7xl px-5 pt-10 pb-3 sm:px-8 lg:pt-[9%] lg:pb-0">
              <div className="max-w-xl">
                <SectionLabel>Pre-Launch · Tata Realty · Ghansoli, Navi Mumbai</SectionLabel>
                <h1 className="font-display mt-5 text-3xl leading-[1.05] font-semibold text-black sm:mt-6 sm:text-5xl">
                  Tata Realty&apos;s Most Prestigious Development in Navi Mumbai - Now
                  Pre-Launching at Ghansoli
                </h1>
                <p className="mt-5 text-sm leading-relaxed text-black/75 sm:text-base lg:text-lg">
                  Premium 2 &amp; 3 BHK residences within a 47.5-acre integrated campus - Taj
                  Hotel, IT Park, and open green views in one address.
                </p>
                <p className="font-deva mt-3 text-sm text-black sm:text-base">
                  एक बार का मौका - टाटा का प्रीमियम प्रोजेक्ट, नवी मुंबई में।
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-start">
                  <ActionButton
                    href="#lead-form"
                    className="w-full justify-between sm:w-auto sm:justify-start"
                  >
                    Get Pre-Launch Price
                  </ActionButton>
                  <ActionButton
                    href={CONTACT.phoneHref}
                    icon="phone"
                    className="w-full justify-between sm:w-auto sm:justify-start"
                  >
                    Call Us
                  </ActionButton>
                </div>
              </div>
            </div>
          </div>

          {/*
           * Fixed 950px band. `object-bottom` keeps the tower and the misty
           * sky-to-field gradient anchored, so the fixed height eats into the
           * blank sky at the top rather than the composition.
           */}
          <div className="relative aspect-[4/3] w-full overflow-hidden">
            <Image
              src="/hero-home.webp"
              alt="High-rise residential tower beside open green fields"
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
          </div>

          {/*
           * Stat bar straddles the seam. The zero-height wrapper sits exactly on
           * the bottom edge of the render, and -translate-y-1/2 shifts the bar up
           * by half its own height - so the 50/50 split holds at any breakpoint,
           * however the cells wrap.
           */}
          <div className="relative z-20 mx-auto h-0 w-full max-w-7xl px-5 sm:px-8">
            <dl className="grid -translate-y-1/2 grid-cols-5 gap-px overflow-hidden rounded-2xl border border-line bg-line shadow-[0_18px_44px_-24px_rgba(0,0,0,0.45)]">
              {HERO_STATS.map((stat) => (
                <div key={stat.value} className="bg-white px-2.5 py-4 sm:px-5 sm:py-6 lg:px-7">
                  <dt className="font-display text-sm leading-tight font-semibold text-black sm:text-xl lg:text-2xl">
                    {stat.value}
                  </dt>
                  <dd className="mt-1 text-[9px] leading-tight tracking-wide text-muted uppercase sm:text-xs">
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
          <div data-reveal className="mx-auto w-full max-w-7xl px-5 pt-[174px] pb-16 sm:px-8 lg:pt-[126px] lg:pb-24">
            <SectionLabel>Why This Project</SectionLabel>
            <h2 className="font-display mt-6 max-w-3xl text-3xl leading-tight font-semibold text-black sm:text-4xl lg:text-5xl">
              Why Tata Realty at Ghansoli is Different
            </h2>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-black/70 lg:text-lg">
              Tata Realty &amp; Infrastructure Ltd has committed ₹5,000+ crore to a 47.5-acre
              integrated campus at Ghansoli - residential, commercial and hospitality in one
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
          <div data-reveal className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
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
                        <dd className="font-medium text-black">{config.size}</dd>
                      </div>
                      <div className="flex items-center justify-between py-3">
                        <dt className="text-muted">Price</dt>
                        <dd className="font-medium text-black">{config.price}</dd>
                      </div>
                    </dl>
                    <ActionButton href="#lead-form" className="mt-7 w-full justify-between">
                      Get Price Details
                    </ActionButton>
                  </div>
                </article>
              ))}
            </div>

            <p className="mt-8 rounded-2xl border border-gold/30 bg-gold-tint/50 px-6 py-4 text-sm text-black">
              Exact pricing and floor plans shared on enquiry only - pre-launch rates available
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

          <div data-reveal className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
            <SectionLabel dark>Project Details</SectionLabel>
            <h2 className="font-display mt-6 text-3xl leading-tight font-semibold text-white sm:text-4xl lg:text-5xl">
              About the Property
            </h2>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-white/70 lg:text-lg">
              Pre-launch premium residential development by Tata Realty. One of Navi
              Mumbai&apos;s most anticipated projects.
            </p>

            <div className="mt-12 grid gap-[30px] lg:grid-cols-2">
              {SPEC_TABLES.map((table) => (
                <div
                  key={table.title}
                  className="rounded-3xl border border-line bg-white p-7 sm:p-9"
                >
                  <h3 className="font-display text-xl font-semibold text-black">{table.title}</h3>
                  <dl className="mt-6 divide-y divide-line border-t border-line text-sm">
                    {table.rows.map(([term, value]) => (
                      <div
                        key={term}
                        className="grid gap-1 py-3.5 sm:grid-cols-[11rem_1fr] sm:gap-4"
                      >
                        <dt className="text-muted">{term}</dt>
                        <dd className="font-medium text-black">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 4 · CAMPUS ECOSYSTEM ───────────────────────────────── */}
        <section className="bg-black py-16 lg:py-24">
          <div data-reveal className="mx-auto w-full max-w-7xl px-5 sm:px-8">
            <SectionLabel dark>Campus Ecosystem</SectionLabel>
            <div className="mt-6 grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-end">
              <h2 className="font-display text-3xl leading-tight font-semibold text-white sm:text-4xl lg:text-5xl">
                More Than a Home - An Integrated Address
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

        {/* ── AMENITIES ──────────────────────────────────────────────────── */}
        <section className="bg-cream">
          <div data-reveal className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
            <SectionLabel>Our Amenities</SectionLabel>
            <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-end">
              <h2 className="font-display text-3xl leading-tight font-semibold text-black sm:text-4xl lg:text-5xl">
                Exceptional amenities for residents&apos; comfort
              </h2>
              <p className="max-w-md text-base leading-relaxed text-muted lg:text-lg">
                Carefully designed facilities ensuring safety, relaxation, wellness and daily
                conveniences.
              </p>
            </div>

            <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
              {AMENITIES.map((item) => (
                <article
                  key={item.title}
                  className="group relative overflow-hidden bg-white p-7 sm:p-9"
                >
                  {/* Dotted texture in the corner, echoing the reference */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-2 right-3 size-24 opacity-60 [background-image:radial-gradient(var(--color-line)_1.2px,transparent_1.2px)] [background-size:9px_9px]"
                  />
                  <span className="relative grid size-12 place-items-center rounded-xl bg-cream text-black transition group-hover:bg-gold-tint">
                    <AmenityIcon name={item.icon} className="size-6" />
                  </span>
                  <h3 className="font-display mt-8 text-lg font-semibold text-black">
                    {item.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 5 · LOCATION & CONNECTIVITY ────────────────────────── */}
        <section className="bg-white">
          <div data-reveal className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
            <SectionLabel>Location</SectionLabel>
            <h2 className="font-display mt-6 text-3xl leading-tight font-semibold text-black sm:text-4xl lg:text-5xl">
              Where Ghansoli Stands
            </h2>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-black/70 lg:text-lg">
              Adjacent to Reliance Corporate Park, close to the upcoming 100-acre Adani
              Commercial Park and a strong IT and corporate catchment.
            </p>

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
                      <span className="text-sm leading-relaxed text-black sm:text-base">
                        {point}
                      </span>
                    </li>
                  ))}
                </ul>
                <ActionButton href="#lead-form" className="mt-8 w-full justify-between">
                  Ask About Connectivity
                </ActionButton>
              </div>
            </div>
          </div>
        </section>

        {/* ── NEARBY · what's around the property ─────────────────────────── */}
        <section className="bg-white">
          <div data-reveal className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
            <SectionLabel>Neighbourhood</SectionLabel>
            <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-end">
              <h2 className="font-display text-3xl leading-tight font-semibold text-black sm:text-4xl lg:text-5xl">
                Everything you need, close by
              </h2>
              <p className="max-w-md text-base leading-relaxed text-muted lg:text-lg">
                Highways, business parks, shopping, schools and healthcare within easy reach of
                Ghansoli.
              </p>
            </div>

            <div className="mt-12 grid gap-[30px] sm:grid-cols-2 lg:grid-cols-3">
              {NEARBY.map((item) => (
                <article
                  key={item.title}
                  className="flex items-start gap-4 rounded-2xl border border-line bg-cream p-6 transition hover:border-gold/60 sm:p-7"
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white text-black">
                    <Icon name={item.icon} className="size-6" />
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-black">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 6 · CONTACT CARD ───────────────────────────────────── */}
        <section data-reveal className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
          <SectionLabel>Your Point of Contact</SectionLabel>

          <div className="mt-10 grid gap-10 rounded-3xl bg-black p-8 sm:p-12 lg:grid-cols-[1fr_auto] lg:items-center">
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

            <ActionButton href="#lead-form" className="w-fit">
              Request a Callback
            </ActionButton>
          </div>
        </section>

        {/* ── SECTION 7 · LEAD FORM ──────────────────────────────────────── */}
        <section id="lead-form" className="scroll-mt-24 bg-black py-16 lg:py-24">
          <div data-reveal className="mx-auto w-full max-w-3xl px-5 text-center sm:px-8">
            <SectionLabel dark>Enquire Now</SectionLabel>
            <h2 className="font-display mt-6 text-3xl leading-tight font-semibold text-white sm:text-4xl lg:text-5xl">
              Get Pre-Launch Price &amp; Floor Plans
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/60 lg:text-lg">
              Exact pricing and floor plans are shared on enquiry only - pre-launch rates are
              available for a limited period.
            </p>

            <div className="mt-10 text-left">
              <LeadForm
                id="main-form"
                tone="light"
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
                    className="font-display flex items-center gap-8 px-8 text-sm font-medium tracking-wide text-black uppercase sm:text-base"
                  >
                    {item}
                    <span className="size-1.5 rounded-full bg-black/40" />
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>

        {/* ── SECTION 8 · FAQ ────────────────────────────────────────────── */}
        <section className="bg-white">
          <div data-reveal className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14 lg:py-24">
            <div>
              <SectionLabel>FAQ</SectionLabel>
              <h2 className="font-display mt-6 text-3xl leading-tight font-semibold text-black sm:text-4xl lg:text-5xl">
                Find answers to common questions about this project
              </h2>
              <p className="mt-5 max-w-3xl text-base leading-relaxed text-black/70 lg:text-lg">
                Configurations, the 47.5-acre campus, launch timing and how to get started.
              </p>
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
                    <span className="font-display text-base font-semibold text-black sm:text-lg">
                      {faq.q}
                    </span>
                    <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line text-black transition group-open:rotate-45 group-open:border-gold group-open:bg-gold">
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
              <ActionButton href={whatsappLink()} external icon="phone" className="mt-3 w-fit">
                Chat on WhatsApp
              </ActionButton>
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
        aria-label="Call us"
        className="fixed bottom-5 left-5 z-50 grid size-14 place-items-center rounded-full bg-black text-gold shadow-lg transition hover:bg-black/85 lg:hidden"
      >
        <Icon name="phone" className="size-6" />
      </a>
    </>
  );
}
