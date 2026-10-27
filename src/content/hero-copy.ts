import type { LocalizedString } from "@/types/site-settings";

export type HeroHotspot = { x: number; y: number; tag: LocalizedString; title: LocalizedString; desc: LocalizedString };

export type HeroCopy = {
  /** Used when the editor left the Sanity slot empty (BR-006). Pixel size is needed for the pin aspect ratio. */
  fallback: { src: string; width: number; height: number; alt: LocalizedString };
  kick: LocalizedString;
  l1: LocalizedString;
  l2: LocalizedString;
  /** null: use the shared `home.heroSub` message (slide 1 in the design). */
  sub: LocalizedString | null;
  /** Positions in percent of the unflipped image (the hero mirrors them in RTL). */
  hotspots: HeroHotspot[];
};

const ls = (en: string, ar: string): LocalizedString => ({ en, ar });

/** Texts and hotspots of the 4 home hero slides, from the design (REQ-001). Images come from Sanity (`getHomeContent().hero`). */
export const heroCopy: HeroCopy[] = [
  {
    fallback: { src: "/images/home/hero.jpg", width: 1800, height: 1290, alt: ls("Executive office with oak desk and warm hidden LED", "مكتب تنفيذي بمكتب بلوط وإضاءة مخفية دافئة") },
    kick: ls("Executive offices", "المكاتب التنفيذية"),
    l1: ls("Spaces Designed", "مساحات تُصمَّم"),
    l2: ls("Around Your Business.", "لتواكب طموحات أعمالك."),
    sub: null,
    hotspots: [
      { x: 74, y: 16, tag: ls("Lighting", "الإضاءة"), title: ls("Warm hidden LED lighting", "إضاءة LED دافئة مخفية"), desc: ls("Recessed linear LED in the ceiling cove and shelving — soft, glare-free light.", "إضاءة خطية مدمجة في السقف والأرفف — ضوء ناعم بلا وهج.") },
      { x: 66, y: 70, tag: ls("Finish", "التشطيب"), title: ls("Natural oak wood finish", "تشطيب خشب البلوط الطبيعي"), desc: ls("Light oak executive desk with off-white modesty panel.", "مكتب تنفيذي من البلوط الفاتح مع لوح أمامي أبيض.") },
      { x: 88, y: 52, tag: ls("Biophilia", "النباتات"), title: ls("Indoor planters", "نباتات داخلية"), desc: ls("Greenery that softens the space and improves wellbeing.", "خضرة تمنح المساحة نعومة وتعزز راحة الموظفين.") },
    ],
  },
  {
    fallback: { src: "/images/home/meet.jpg", width: 1530, height: 751, alt: ls("Boardroom with two-tone conference table", "قاعة اجتماعات بطاولة بلونين") },
    kick: ls("Boardrooms & meeting spaces", "قاعات الاجتماعات"),
    l1: ls("Meeting rooms", "قاعات اجتماعات"),
    l2: ls("built for decisions.", "تليق بصناعة القرار."),
    sub: ls("Conference tables, seating and lighting for every meeting space, from small huddle rooms to the boardroom.", "طاولات اجتماعات ومقاعد وإضاءة لكل مساحة اجتماعات، من غرف النقاش الصغيرة إلى قاعة مجلس الإدارة."),
    hotspots: [
      { x: 62, y: 60, tag: ls("Table", "الطاولة"), title: ls("Two-tone conference table", "طاولة اجتماعات بلونين"), desc: ls("Oak top on a sculpted base with integrated power.", "سطح بلوط على قاعدة منحوتة مع منافذ كهرباء مدمجة.") },
      { x: 76, y: 38, tag: ls("Seating", "الجلوس"), title: ls("Leather meeting chairs", "كراسي اجتماعات جلدية"), desc: ls("Tan leather with polished swivel base.", "جلد بني مع قاعدة دوّارة لامعة.") },
      { x: 90, y: 26, tag: ls("Lighting", "الإضاءة"), title: ls("Backlit shelving", "أرفف بإضاءة خلفية"), desc: ls("Warm LED strips inside display niches.", "شرائط LED دافئة داخل فتحات العرض.") },
    ],
  },
  {
    fallback: { src: "/images/home/ws.jpg", width: 1800, height: 622, alt: ls("Open-plan workstations with fabric screens", "محطات عمل مفتوحة بشاشات قماش") },
    kick: ls("Corporate offices", "مكاتب الشركات"),
    l1: ls("Open floors", "مساحات مفتوحة"),
    l2: ls("that support focus.", "تعزّز تركيز الفرق."),
    sub: ls("Workstations, acoustic screens and storage planned around the way your teams work.", "محطات عمل وقواطع عازلة للصوت ووحدات تخزين مصممة وفق طريقة عمل فرقك."),
    hotspots: [
      { x: 70, y: 36, tag: ls("Acoustics", "الصوتيات"), title: ls("Acoustic fabric partition", "قاطع قماش عازل للصوت"), desc: ls("Desk-mounted screens reduce noise and add privacy.", "شاشات مثبتة على المكتب تقلل الضوضاء وتمنح خصوصية.") },
      { x: 62, y: 72, tag: ls("Seating", "الجلوس"), title: ls("Ergonomic mesh chair", "كرسي شبكي مريح"), desc: ls("Breathable mesh with adjustable lumbar support.", "شبك يسمح بالتهوية مع دعم قطني قابل للتعديل.") },
      { x: 86, y: 60, tag: ls("Storage", "التخزين"), title: ls("Mobile pedestals", "أدراج متحركة"), desc: ls("Lockable drawer units on castors.", "وحدات أدراج بقفل وعجلات.") },
    ],
  },
  {
    fallback: { src: "/images/home/lounge.jpg", width: 1530, height: 869, alt: ls("Calm waiting lounge with soft seating", "صالة انتظار هادئة بجلسات مريحة") },
    kick: ls("Medical facilities", "المنشآت الطبية"),
    l1: ls("Medical spaces,", "بيئات طبية هادئة"),
    l2: ls("calm and practical.", "وعملية في الاستخدام."),
    sub: ls("Waiting areas, clinics and administrative offices furnished with durable materials that are easy to maintain.", "صالات انتظار وعيادات ومكاتب إدارية مجهّزة بخامات متينة وسهلة العناية."),
    hotspots: [],
  },
];
