import type { ResumeData } from "@rb/schema";

/** Complete example resumes for previews and template development. Valid against resumeDataSchema. */
export function sampleResume(locale: ResumeData["locale"]): ResumeData {
  return locale === "fa" ? SAMPLE_FA : SAMPLE_EN;
}

const SAMPLE_FA: ResumeData = {
  version: 1,
  locale: "fa",
  basics: {
    fullName: "سارا محمدی",
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
      images: [],
    },
    {
      id: "p2",
      title: "کتابخانه‌ی کامپوننت",
      description: "مجموعه‌ی کامپوننت‌های قابل استفاده‌ی مجدد با پشتیبانی کامل از راست‌به‌چپ.",
      technologies: ["React", "Storybook", "CSS Modules"],
      repoUrl: "https://github.com/example/ui",
      images: [],
    },
  ],
  languages: [
    { id: "lg1", name: "فارسی", level: "native" },
    { id: "lg2", name: "انگلیسی", level: "advanced" },
  ],
  certificates: [
    { id: "c1", title: "Meta Front-End Developer", issuer: "Coursera", date: "2021-05" },
  ],
  customSections: [
    {
      id: "cs1",
      title: "افتخارات",
      items: [{ id: "ci1", title: "رتبه‌ی اول هکاتون فناوری", subtitle: "تهران", date: "2023-11" }],
    },
  ],
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
