import type { ResumeData } from "@rb/schema";

/** Free stock photo (Lorem Picsum, Unsplash license); the seed keeps the same picture every time. */
const img = (seed: string, w: number, h: number) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

/** Complete example resumes for previews and template development. Valid against resumeDataSchema. */
export function sampleResume(locale: ResumeData["locale"]): ResumeData {
  return locale === "fa" ? SAMPLE_FA : SAMPLE_EN;
}

const SAMPLE_FA: ResumeData = {
  version: 1,
  locale: "fa",
  basics: {
    fullName: "سارا محمدی",
    personal: { birthDate: "1372/06/15", marital: "single" },
    jobTitle: "توسعه‌دهنده‌ی فرانت‌اند",
    email: "sara@example.com",
    phone: "0912 000 0000",
    location: "تهران",
    summary:
      "توسعه‌دهنده‌ی فرانت‌اند با ۵ سال تجربه در ساخت رابط‌های کاربری سریع و دسترس‌پذیر با React و TypeScript. به طراحی سیستم‌های قابل نگهداری و همکاری نزدیک با تیم طراحی علاقه دارم.",
    links: [
      { id: "l1", type: "github", url: "https://github.com/example" },
      { id: "l2", type: "linkedin", url: "https://linkedin.com/in/example" },
      { id: "l3", type: "website", url: "https://example.com" },
    ],
  },
  experience: [
    {
      id: "e1",
      company: "شرکت فناوری نمونه",
      position: "توسعه‌دهنده‌ی ارشد فرانت‌اند",
      location: "تهران",
      period: { start: "2022-03", current: true },
      description: "مسئول معماری فرانت‌اند پنل مدیریت فروشگاه‌ها با بیش از ۲۰ هزار کاربر فعال.",
      highlights: [
        "کاهش زمان بارگذاری صفحه‌ی اصلی از ۴ به ۱.۵ ثانیه",
        "راه‌اندازی کتابخانه‌ی کامپوننت مشترک بین سه محصول",
        "منتورینگ چهار توسعه‌دهنده‌ی جونیور",
      ],
    },
    {
      id: "e2",
      company: "استودیو طراحی وب",
      position: "توسعه‌دهنده‌ی فرانت‌اند",
      period: { start: "2019-09", end: "2022-02", current: false },
      description: "پیاده‌سازی بیش از ۱۵ وب‌سایت شرکتی و فروشگاهی.",
      highlights: [],
    },
  ],
  education: [
    {
      id: "ed1",
      institution: "دانشگاه صنعتی شریف",
      degree: "کارشناسی",
      field: "مهندسی کامپیوتر",
      period: { start: "2015-09", end: "2019-07", current: false },
      grade: "۱۷٫۲",
      description: "پروژه‌ی پایانی: سامانه‌ی رزرو آنلاین با React و Node.js",
    },
  ],
  skills: [
    { id: "s1", name: "React", level: 5, category: "فرانت‌اند" },
    { id: "s2", name: "TypeScript", level: 5, category: "فرانت‌اند" },
    { id: "s3", name: "CSS", level: 4, category: "فرانت‌اند" },
    { id: "s4", name: "Next.js", level: 4, category: "فرانت‌اند" },
    { id: "s5", name: "Node.js", level: 3, category: "بک‌اند" },
    { id: "s6", name: "PostgreSQL", level: 3, category: "بک‌اند" },
    { id: "s7", name: "Git", level: 4, category: "ابزارها" },
    { id: "s8", name: "Figma", level: 3, category: "ابزارها" },
  ],
  projects: [
    {
      id: "p1",
      title: "پنل مدیریت فروشگاه",
      role: "توسعه‌دهنده‌ی اصلی",
      description: "داشبورد مدیریت سفارش‌ها و موجودی با گزارش‌های لحظه‌ای.",
      technologies: ["React", "TypeScript", "TanStack Query"],
      url: "https://example.com/dashboard",
      images: [img("rb-dashboard", 1200, 900), img("rb-dashboard-2", 1200, 900)],
      period: { start: "2025-02", current: false, end: "2025-09" },
    },
    {
      id: "p2",
      title: "کتابخانه‌ی کامپوننت",
      role: "طراحی و پیاده‌سازی",
      description: "مجموعه‌ی کامپوننت‌های قابل استفاده‌ی مجدد با پشتیبانی کامل از راست‌به‌چپ.",
      technologies: ["React", "Storybook", "CSS Modules"],
      repoUrl: "https://github.com/example/ui",
      images: [img("rb-components", 1200, 900)],
      period: { start: "2024-05", current: false, end: "2024-12" },
    },
    {
      id: "p3",
      title: "اپلیکیشن کشف موسیقی",
      role: "پروژه‌ی شخصی",
      description: "پیشنهاد آهنگ بر اساس حال‌وهوای کاربر، با رابط ساده و سریع.",
      technologies: ["Next.js", "Web Audio"],
      images: [img("rb-music", 1200, 900)],
      period: { start: "2024-01", current: false, end: "2024-03" },
    },
    {
      id: "p4",
      title: "سایت نمونه‌کار شخصی",
      role: "طراحی و توسعه",
      description: "سایت چندصفحه‌ای سبک و سریع برای معرفی کارها.",
      technologies: ["Astro", "CSS"],
      images: [img("rb-portfolio", 1200, 900)],
      period: { start: "2023-08", current: false, end: "2023-10" },
    },
  ],
  languages: [
    { id: "lg1", name: "فارسی", level: "native" },
    { id: "lg2", name: "انگلیسی", level: "advanced" },
  ],
  certificates: [
    { id: "c1", title: "Meta Front-End Developer", issuer: "Coursera", date: "2021-05", url: "https://coursera.org/verify/example" },
  ],
  customSections: [
    {
      id: "cs1",
      title: "افتخارات",
      items: [
        {
          id: "ci1",
          title: "رتبه‌ی اول هکاتون فناوری",
          subtitle: "تهران",
          date: "2023-11",
          description: "طراحی و ساخت نمونه‌ی اولیه‌ی اپلیکیشن در ۴۸ ساعت",
          url: "https://example.com/hackathon",
        },
      ],
    },
  ],
  site: {
    tagline: "توسعه‌دهنده‌ی فرانت‌اند؛ عاشق رابط‌های ساده، سریع و پر از جزئیات دقیق.",
    ctaPrimary: "آخرین کارهایم",
    ctaSecondary: "گفت‌وگو کنیم",
    aboutTitle: "توسعه‌دهنده‌ای که سادگی را از پیچیدگی بیرون می‌کشد",
    aboutText:
      "در تهران زندگی می‌کنم و روی محصولات وبی کار می‌کنم که باید هم ساده باشند و هم قابل اعتماد. بیشتر کارهایم پنل‌های مدیریتی و ابزارهای داخلی شرکت‌هاست؛ جایی که وضوح از تزئین مهم‌تر است.\n\nکارم را با طراحی سایت‌های شرکتی شروع کردم و کم‌کم سراغ سیستم‌های پیچیده‌تر رفتم. همین مسیر طرز فکرم را ساخت: اول ساختار، بعد ظاهر.\n\nبیرون از کار، عکاسی می‌کنم و پروژه‌های کوچک شخصی می‌سازم تا ایده‌های تازه را آزادانه امتحان کنم.",
    aboutImage: img("rb-about", 900, 1100),
    aboutCaption: "یک روز آفتابی در تهران",
    gallery: [
      { id: "g1", title: "بازی با تایپوگرافی", image: img("rb-g1", 800, 600) },
      { id: "g2", title: "آزمایش با رنگ", image: img("rb-g2", 800, 1000) },
      { id: "g3", title: "طراحی دیجیتال", image: img("rb-g3", 800, 800) },
      { id: "g4", title: "مجموعه‌ی گل‌ها", image: img("rb-g4", 800, 1050) },
      { id: "g5", title: "حال‌وهوا و بافت", image: img("rb-g5", 800, 700) },
      { id: "g6", title: "فرم‌های انتزاعی", image: img("rb-g6", 800, 1000) },
      { id: "g7", title: "شکل و سیستم رنگ", image: img("rb-g7", 800, 900) },
      { id: "g8", title: "عکاسی خیابانی", image: img("rb-g8", 800, 600) },
      { id: "g9", title: "طرح‌های اولیه", image: img("rb-g9", 800, 1000) },
    ],
  },
};

const SAMPLE_EN: ResumeData = {
  version: 1,
  locale: "en",
  basics: {
    fullName: "Sara Mohammadi",
    jobTitle: "Front-End Developer",
    email: "sara@example.com",
    location: "Tehran",
    summary:
      "Front-end developer with five years of experience building fast, accessible interfaces with React and TypeScript.",
    links: [
      { id: "l1", type: "github", url: "https://github.com/example" },
      { id: "l2", type: "linkedin", url: "https://linkedin.com/in/example" },
    ],
  },
  experience: [
    {
      id: "e1",
      company: "Example Tech",
      position: "Senior Front-End Developer",
      period: { start: "2022-03", current: true },
      description: "Front-end architecture for a store management dashboard with 20k+ active users.",
      highlights: ["Cut home page load time from 4s to 1.5s", "Built a component library shared by three products"],
    },
  ],
  education: [
    {
      id: "ed1",
      institution: "Sharif University of Technology",
      degree: "B.Sc.",
      field: "Computer Engineering",
      period: { start: "2015-09", end: "2019-07", current: false },
    },
  ],
  skills: [
    { id: "s1", name: "React", level: 5 },
    { id: "s2", name: "TypeScript", level: 5 },
    { id: "s3", name: "Node.js", level: 3 },
    { id: "s4", name: "PostgreSQL", level: 3 },
  ],
  projects: [
    {
      id: "p1",
      title: "Store Dashboard",
      description: "Order and inventory management with real-time reports.",
      technologies: ["React", "TypeScript"],
      url: "https://example.com/dashboard",
      images: [],
    },
  ],
  languages: [
    { id: "lg1", name: "Persian", level: "native" },
    { id: "lg2", name: "English", level: "advanced" },
  ],
  certificates: [],
  customSections: [],
};
