import type { LocalizedString } from "@/types/site-settings";

/** The four Design Process stages (design `stepsData` / `P3L`). Real copy from the design, not placeholders. */
export type ProcessStep = { tab: LocalizedString; tag: LocalizedString; title: LocalizedString; text: LocalizedString };

export const processSteps: ProcessStep[] = [
  {
    tab: { en: "Discover", ar: "اكتشاف" },
    tag: { en: "Stage 01 · Discover", ar: "المرحلة 01 · اكتشاف" },
    title: { en: "Understanding your requirements", ar: "فهم متطلباتكم" },
    text: {
      en: "We begin by learning how your team works, what the space needs to support, and the requirements and timeline you have in mind.",
      ar: "نبدأ بالتعرّف على طبيعة عمل فريقكم، وما ينبغي أن توفّره المساحة، والمتطلبات والجدول الزمني الذي تستهدفونه.",
    },
  },
  {
    tab: { en: "Plan", ar: "تخطيط" },
    tag: { en: "Stage 02 · Plan", ar: "المرحلة 02 · تخطيط" },
    title: { en: "Planning the space and its furnishing needs", ar: "تخطيط المساحة واحتياجات التأثيث" },
    text: {
      en: "Together we define what each area needs (workstations, meeting rooms, reception and storage) and the quantities that suit your space.",
      ar: "نحدد معًا احتياجات كل منطقة من محطات العمل وغرف الاجتماعات والاستقبال ووحدات التخزين، والكميات المناسبة لمساحتكم.",
    },
  },
  {
    tab: { en: "Furnish", ar: "تأثيث" },
    tag: { en: "Stage 03 · Furnish", ar: "المرحلة 03 · تأثيث" },
    title: { en: "Selecting and coordinating furniture", ar: "اختيار الأثاث وتنسيقه" },
    text: {
      en: "We recommend furniture and equipment suited to your use, budget and identity, and coordinate finishes so every area works together.",
      ar: "نقترح الأثاث والتجهيزات الملائمة لطبيعة الاستخدام والميزانية وهوية المنشأة، وننسّق الخامات والألوان لتتكامل جميع المساحات.",
    },
  },
  {
    tab: { en: "Deliver", ar: "تسليم" },
    tag: { en: "Stage 04 · Deliver", ar: "المرحلة 04 · تسليم" },
    title: { en: "Presenting your completed workspace", ar: "تقديم مساحة العمل المكتملة" },
    text: {
      en: "Your furnished workspace is presented as agreed, ready to welcome your team.",
      ar: "نقدّم لكم مساحة العمل مؤثثة وفق ما تم الاتفاق عليه، وجاهزة لاستقبال فريقكم.",
    },
  },
];
