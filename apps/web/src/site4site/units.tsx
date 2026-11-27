// The building's units: every public page of site4site is a unit with an address, an icon and a
// number (floor + unit) shown on its brass plate. The home page, the menu and the footer read this list.

export type UnitKey = "templates" | "pricing" | "about" | "blog" | "support" | "contact";

export type Unit = {
  key: UnitKey;
  label: string;
  path: string;
  plate: string;
  floor: 1 | 2 | 3;
  icon: string;
};

/** Icon paths drawn in a 24-unit box centred on 0,0 (the same marks engraved on the building). */
export const ICON = {
  templates: "M0 -9l9 5-9 5-9-5z M-9 1l9 5 9-5 M-9 5l9 5 9-5",
  pricing: "M-9 -2v-7h7l9 9-7 7z M-5 -5h.5",
  about: "M-5 -4a5 5 0 1 1 7 4c-2 1-2 2-2 4 M0 9v.5",
  blog: "M6 -9l3 3-11 11-4 1 1-4z M3 -6l3 3",
  support: "M-9 2a9 9 0 0 1 18 0 M-9 2v5h4V1h-4 M9 2v5h-4V1h4 M5 9c0 3-2 4-5 4",
  contact: "M-7 -8h4l2 5-3 2a10 10 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1-9-6a2 2 0 0 1 2-2z",
  login: "M2 -9h6v18h-6 M-9 0h11 M-2 -5l5 5-5 5",
  register: "M-2 -6a4 4 0 1 0 .1 0 M-9 9a7 7 0 0 1 14 0 M6 -4v8 M2 0h8",
  menu: "M-8 -6h16 M-8 0h16 M-8 6h16",
  close: "M-6 -6l12 12 M6 -6l-12 12",
  desktop: "M-9.5 -7.5h19v12h-19z M-11 8h22",
  phone: "M-5.5 -9.5h11v19h-11z M-1.5 6.5h3",
  search: "M-2 -2m-6.5 0a6.5 6.5 0 1 0 13 0a6.5 6.5 0 1 0 -13 0 M3 3l5.5 5.5",
  prev: "M-3 -7l7 7-7 7",
  next: "M3 -7l-7 7 7 7",
  instagram: "M-8 -8h16v16h-16z M0 0m-3.6 0a3.6 3.6 0 1 0 7.2 0a3.6 3.6 0 1 0 -7.2 0 M4.6 -4.8h.1",
  telegram: "M-9 -1l17-7-3 16-5-4-3 3v-5l8-6-10 5z",
  whatsapp: "M-7 8l1.3-4A8 8 0 1 1-3 7z M-3 -3c0 3 3 6 6 6l1.5-1.5-2-1-1 1c-1-.5-2-1.5-2.5-2.5l1-1-1-2z",
} as const;

export type IconName = keyof typeof ICON;

export function Icon({ name }: { name: IconName }) {
  return (
    <svg className="s4-icon" viewBox="-12 -12 24 24" aria-hidden="true">
      <path d={ICON[name]} />
    </svg>
  );
}

/** Menu order: what a visitor looks for first comes first. */
export const UNITS: readonly Unit[] = [
  {
    key: "templates",
    label: "قالب‌ها",
    path: "/templates",
    plate: "واحد ۱۲",
    floor: 1,
    icon: ICON.templates,
  },
  {
    key: "pricing",
    label: "تعرفه‌ها",
    path: "/pricing",
    plate: "واحد ۲۲",
    floor: 2,
    icon: ICON.pricing,
  },
  {
    key: "about",
    label: "درباره‌ی ما",
    path: "/about",
    plate: "واحد ۲۱",
    floor: 2,
    icon: ICON.about,
  },
  {
    key: "blog",
    label: "بلاگ",
    path: "/blog",
    plate: "واحد ۱۱",
    floor: 1,
    icon: ICON.blog,
  },
  {
    key: "support",
    label: "پشتیبانی",
    path: "/support",
    plate: "واحد ۳۱",
    floor: 3,
    icon: ICON.support,
  },
  {
    key: "contact",
    label: "تماس با ما",
    path: "/contact",
    plate: "واحد ۳۲",
    floor: 3,
    icon: ICON.contact,
  },
];

export const unitByKey = (key: UnitKey): Unit => UNITS.find((u) => u.key === key)!;
