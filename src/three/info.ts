/** Names and descriptions of the furniture pieces (EN + AR). Source: the design IBSS3D kit. */
export type Localized = { en: string; ar: string };
export type PieceInfo = { name: Localized; detail: Localized };

const I = (en: string, ar: string, den: string, dar: string): PieceInfo => ({ name: { en, ar }, detail: { en: den, ar: dar } });

export const INFO = {
  desk: I("Office desk", "مكتب عمل", "Laminate worktop on a powder-coated steel frame, with a modesty panel.", "سطح عمل من القشرة على هيكل معدني مطلي، مع لوح أمامي."),
  execDesk: I("Executive desk", "مكتب تنفيذي", "Walnut-finish worktop on panel legs, with a drawer pedestal.", "سطح عمل بلمسة خشب الجوز على أرجل لوحية، مع وحدة أدراج."),
  taskChair: I("Ergonomic task chair", "كرسي عمل مريح", "Mesh back, upholstered seat, armrests and a five-star base on castors.", "ظهر شبكي ومقعد منجّد ومساند للذراعين وقاعدة خماسية بعجلات."),
  execChair: I("Executive chair", "كرسي تنفيذي", "High-back upholstered chair on a five-star base.", "كرسي منجّد بظهر مرتفع على قاعدة خماسية."),
  guestChair: I("Visitor chair", "كرسي زائر", "Upholstered seat and back on a cantilever steel frame.", "مقعد وظهر منجّدان على هيكل معدني معلّق."),
  confTable: I("Conference table", "طاولة اجتماعات", "Oak-finish top on twin steel pedestals, with a central cable port.", "سطح بلمسة خشب البلوط على قاعدتين معدنيتين، مع منفذ أسلاك في المنتصف."),
  confChair: I("Meeting chair", "كرسي اجتماعات", "Upholstered meeting chair on a five-star base.", "كرسي اجتماعات منجّد على قاعدة خماسية."),
  credenza: I("Storage credenza", "وحدة تخزين منخفضة", "Low storage unit with hinged doors on a steel base.", "وحدة تخزين منخفضة بأبواب مفصلية على قاعدة معدنية."),
  tallCabinet: I("Storage cabinet", "خزانة تخزين", "Full-height cabinet with two hinged doors and internal shelves.", "خزانة بارتفاع كامل ببابين مفصليين ورفوف داخلية."),
  shelving: I("Open shelving unit", "وحدة رفوف مفتوحة", "Open shelves for files, books and display items.", "رفوف مفتوحة للملفات والكتب وقطع العرض."),
  pedestal: I("Mobile pedestal", "وحدة أدراج متنقلة", "Three-drawer pedestal on castors that sits under the desk.", "وحدة بثلاثة أدراج على عجلات توضع أسفل المكتب."),
  monitor: I("Monitor", "شاشة حاسوب", "Flat-panel display on a desk stand.", "شاشة مسطحة على حامل مكتبي."),
  screen: I("Desk screen", "حاجز مكتبي", "Fabric-covered privacy screen between facing desks.", "حاجز مغطى بالقماش بين المكاتب المتقابلة."),
  tv: I("Display screen", "شاشة عرض", "Wall-mounted screen for presentations and video calls.", "شاشة مثبتة على الجدار للعروض التقديمية ومكالمات الفيديو."),
  reception: I("Reception counter", "كاونتر استقبال", "Slatted oak-finish front, stone-look top and a lower work surface.", "واجهة بشرائح بلمسة البلوط وسطح بمظهر الحجر وسطح عمل منخفض."),
  sofa: I("Sofa", "أريكة", "Upholstered three-seat sofa on slim metal legs.", "أريكة منجّدة بثلاثة مقاعد على أرجل معدنية رفيعة."),
  lounge: I("Lounge armchair", "كرسي استرخاء", "Upholstered armchair for waiting and informal meetings.", "كرسي منجّد للانتظار والاجتماعات غير الرسمية."),
  coffee: I("Coffee table", "طاولة قهوة", "Round stone-look top on a steel base.", "سطح دائري بمظهر الحجر على قاعدة معدنية."),
  plant: I("Indoor plant", "نبات داخلي", "Potted indoor plant.", "نبات داخلي في أصيص."),
  glass: I("Glass partition", "قاطع زجاجي", "Full-height glazed partition with slim frames.", "قاطع زجاجي بارتفاع كامل بإطارات رفيعة."),
  acoustic: I("Acoustic panel", "لوح صوتي", "Fabric-wrapped wall panel that softens room acoustics.", "لوح جداري مغطى بالقماش يحسّن الصوتيات في الغرفة."),
  linear: I("Linear pendant light", "إضاءة معلّقة خطية", "Suspended linear LED luminaire.", "وحدة إضاءة LED خطية معلّقة."),
  dome: I("Pendant light", "إضاءة معلّقة", "Suspended dome pendant.", "إضاءة معلّقة على شكل قبة."),
  floorLamp: I("Floor lamp", "مصباح أرضي", "Free-standing floor lamp with a fabric shade.", "مصباح أرضي قائم بغطاء من القماش."),
  logoWall: I("IBSS Innovations brand wall", "جدار هوية آي بي إس إس إنوفيشنز", "Wall panel carrying the IBSS Innovations logo.", "لوح جداري يحمل شعار آي بي إس إس إنوفيشنز."),
  bench: I("Waiting bench", "مقعد انتظار", "Upholstered bench seating for visitors.", "مقعد منجّد للزوار."),
} satisfies Record<string, PieceInfo>;

export type PieceType = keyof typeof INFO;

/** Walk-through zones: camera position, look-at target and names (design ZONES). */
export type Vec3 = [number, number, number];
export type Zone = { id: string; en: string; ar: string; pos: Vec3; look: Vec3 };

export const ZONES: Zone[] = [
  { id: "entrance", en: "Entrance", ar: "المدخل", pos: [-6, 1.6, 6.2], look: [-1, 1.3, 1.5] },
  { id: "reception", en: "Reception", ar: "الاستقبال", pos: [-4.4, 1.6, 5.4], look: [-6.6, 1.15, 3.4] },
  { id: "work", en: "Workstations", ar: "محطات العمل", pos: [1.8, 1.6, 5.95], look: [1.8, 0.95, 3.4] },
  { id: "meeting", en: "Meeting room", ar: "غرفة الاجتماعات", pos: [-2.4, 1.6, -1.6], look: [-5.4, 0.9, -4.0] },
  { id: "exec", en: "Executive office", ar: "المكتب التنفيذي", pos: [2.4, 1.6, -2.4], look: [5.8, 1.0, -5.0] },
  { id: "lounge", en: "Lounge", ar: "منطقة الاستراحة", pos: [5.0, 1.6, 5.4], look: [7.4, 0.8, 3.6] },
];

export const ZONE_NAMES: Record<string, [string, string]> = {
  entrance: ["Entrance", "المدخل"],
  reception: ["Reception", "الاستقبال"],
  work: ["Workstations", "محطات العمل"],
  storage: ["Storage", "التخزين"],
  meeting: ["Meeting room", "غرفة الاجتماعات"],
  exec: ["Executive office", "المكتب التنفيذي"],
  lounge: ["Lounge", "منطقة الاستراحة"],
};

/** Yaw (rotation about Y) that makes a camera at `from` look toward `to`. */
export const yawTo = (from: Vec3, to: Vec3) => Math.atan2(-(to[0] - from[0]), -(to[2] - from[2]));
