import type { ComponentType } from "react";
import type { ResumeData, Theme, Visitor } from "@rb/schema";

/**
 * Templates render resume data with a theme. They must be pure (no data fetching,
 * no browser-only APIs) so the same component can render in the editor preview
 * and on the server for published sites and HTML export.
 */
export type TemplateProps = {
  data: ResumeData;
  theme: Theme;
  /** Multi-page website templates: the path being shown ("/", "/about", "/projects/<id>"). */
  page?: string;
  /** Turns a page path into the href for this site (published sites live under a base path in development). */
  link?: (path: string) => string;
  /** Editor preview with click-to-edit on: empty optional fields show a small "+ add" button. */
  editing?: boolean;
  /** Shop templates: the visitor's cart, wishlist and query string. */
  visitor?: Visitor;
};

/** Style tags used to filter the template gallery. */
export type TemplateTag = "formal" | "creative" | "sidebar" | "dark" | "photo";

export type TemplateDefinition = {
  id: string;
  name: string;
  kind: "PDF" | "PORTFOLIO";
  component: ComponentType<TemplateProps>;
  tags?: readonly TemplateTag[];
  /** Multi-page website templates: every page path this content has. Single-page templates leave it out. */
  pages?: (data: ResumeData) => string[];
  /** Own example content (persona, pictures) for previews; the shared sample resume otherwise. */
  sample?: (locale: ResumeData["locale"]) => ResumeData;
  /** Pages the user may switch off (stored in site.hiddenPages). */
  optionalPages?: readonly { path: string; label: string }[];
  /** Sections the user may switch off (stored in site.hiddenBlocks). */
  blocks?: readonly { key: string; label: string }[];
  /** An online shop: has products, a cart and orders, managed in the shop panel. */
  shop?: boolean;
  /**
   * A menu site (cafe, restaurant): the shop panel manages the menu (products and categories), the
   * page texts and pictures and a printable QR code; it has no cart, orders or customer accounts.
   */
  menu?: boolean;
  /** A menu site that also sells the categories marked "sold online" (cart, checkout, orders, accounts). */
  sells?: boolean;
  /**
   * A service business (beauty salon): categories not sold online are its services and their items the
   * price list; the panel says "services and products" and has no menu QR code.
   */
  services?: boolean;
  /** The site has a booking form (salon appointment, restaurant table): the inbox shows a bookings list. */
  bookings?: boolean;
  /** A photo studio: the shop panel manages the price packages (no cart), the blog and the inbox; no menu QR code. */
  studio?: boolean;
  /** A practice with online booking (working hours, capacity, events): its own manager tabs. */
  clinic?: boolean;
  /** An escape room: rooms booked one group at a time (a clinic-like manager with rooms). */
  escape?: boolean;
  /** Studios rented by the hour (a recording studio): a clinic-like manager with studios and services. */
  rental?: boolean;
  /**
   * Shop manager pieces this template shows on its pages; a manager tab for content the template has
   * no place for is left out. "extras" lists the sections of that tab, each with the heading it gets.
   */
  panel?: {
    extras?: { perks?: string; stats?: string; brands?: string; trust?: string };
    /** Tabs of content this template does not show (e.g. "banners", "quotes"). */
    hide?: string[];
    /** The template groups its questions by category (the FAQ editor then asks for one). */
    faqCategories?: boolean;
  };
};
