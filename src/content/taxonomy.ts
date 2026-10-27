import type { LocalizedString } from "@/types/site-settings";

/** Project categories (sectors), as used by the project filter and the footer. */
export const PROJECT_CATEGORY_KEYS = ["hq", "exec", "health", "mosque", "school", "uni"] as const;
export type ProjectCategoryKey = (typeof PROJECT_CATEGORY_KEYS)[number];

export type ProjectCategory = {
  key: ProjectCategoryKey;
  label: LocalizedString;
  /** Bootstrap Icons name from the design (e.g. "bi-buildings"). */
  icon: string;
};

export const projectCategories: ProjectCategory[] = [
  { key: "hq", icon: "bi-buildings", label: { en: "Companies", ar: "الشركات" } },
  { key: "exec", icon: "bi-briefcase", label: { en: "Offices", ar: "المكاتب" } },
  { key: "health", icon: "bi-hospital", label: { en: "Medical centres", ar: "المراكز الطبية" } },
  { key: "mosque", icon: "bi-moon-stars", label: { en: "Mosques", ar: "المساجد" } },
  { key: "school", icon: "bi-backpack", label: { en: "Schools", ar: "المدارس" } },
  { key: "uni", icon: "bi-mortarboard", label: { en: "Universities", ar: "الجامعات" } },
];

/** Scope-of-furnishing items listed on project pages. */
export const SCOPE_KEYS = ["exec", "chairs", "meet", "ws", "recep", "store", "lounge"] as const;
export type ScopeKey = (typeof SCOPE_KEYS)[number];

export type ScopeItem = {
  key: ScopeKey;
  label: LocalizedString;
  description: LocalizedString;
  /** The design uses one check-circle icon for every scope item. */
  icon: string;
};

export const scopeItems: ScopeItem[] = [
  {
    key: "exec",
    icon: "bi-check-circle",
    label: { en: "Executive desks", ar: "مكاتب تنفيذية" },
    description: { en: "L-shaped desks with returns and storage", ar: "مكاتب على شكل L مع وحدات تخزين" },
  },
  {
    key: "chairs",
    icon: "bi-check-circle",
    label: { en: "Ergonomic chairs", ar: "كراسي Ergonomic" },
    description: { en: "Mesh task and leather executive seating", ar: "كراسي شبكية وكراسي تنفيذية جلدية" },
  },
  {
    key: "meet",
    icon: "bi-check-circle",
    label: { en: "Meeting tables", ar: "طاولات اجتماعات" },
    description: { en: "Boardroom and huddle tables with power", ar: "طاولات مجالس إدارة واجتماعات مزودة بالكهرباء" },
  },
  {
    key: "ws",
    icon: "bi-check-circle",
    label: { en: "Workstations", ar: "قواطع ومحطات عمل" },
    description: { en: "Clustered desks with fabric privacy screens", ar: "مكاتب مجمّعة مع شاشات قماش للخصوصية" },
  },
  {
    key: "recep",
    icon: "bi-check-circle",
    label: { en: "Reception counter", ar: "كاونتر استقبال" },
    description: { en: "Custom counter with integrated LED", ar: "كاونتر مصمم خصيصاً بإضاءة مدمجة" },
  },
  {
    key: "store",
    icon: "bi-check-circle",
    label: { en: "Storage & shelving", ar: "وحدات تخزين وأرفف" },
    description: { en: "Full-height cabinets and display shelving", ar: "خزائن بطول الجدار وأرفف عرض" },
  },
  {
    key: "lounge",
    icon: "bi-check-circle",
    label: { en: "Lounge seating", ar: "جلسات انتظار" },
    description: { en: "Sofas, poufs and soft seating", ar: "كنب ومقاعد ناعمة وطاولات جانبية" },
  },
];
