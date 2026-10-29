import type { SiteImage } from "@/sanity/image";
import type { LocalizedString } from "@/types/site-settings";

/** One card of the "Trusted across sectors" marquee. */
export type ClientCard = { id: string; name: LocalizedString; logo: SiteImage | null };
/** One sector tab: Sanity `client` documents grouped by sector, or the placeholders below. */
export type ClientSector = { label: LocalizedString; clients: ClientCard[] };

/**
 * Placeholder client names for the home "Trusted across sectors" section, from the design (`CL2`).
 * They are generic descriptions, not real clients: shown only while the Studio has no `client` documents.
 * `rows[lang]` = two lists of 8 labels each, shown together as one marquee row.
 */
const placeholderRows: { label: LocalizedString; rows: { en: string[][]; ar: string[][] } }[] = [
  { label: { en: "Companies", ar: "الشركات" }, rows: {
    en: [["Corporate HQ", "Holding group", "Banking & finance", "Technology", "Retail", "Logistics", "Energy", "Real estate"], ["Telecom", "Consulting", "Manufacturing", "Hospitality", "Construction", "Media", "Insurance", "Investment"]],
    ar: [["مقر شركة", "مجموعة قابضة", "بنوك ومالية", "تقنية", "تجزئة", "لوجستيات", "طاقة", "عقارات"], ["اتصالات", "استشارات", "صناعة", "ضيافة", "مقاولات", "إعلام", "تأمين", "استثمار"]] } },
  { label: { en: "Offices", ar: "المكاتب" }, rows: {
    en: [["Executive offices", "Government entity", "Administrative offices", "Training centre", "Coworking hub", "Regional office", "Law firm", "Engineering office"], ["Education", "Municipality", "Authority", "Chamber of commerce", "Non-profit", "Academy", "Research centre", "Representative office"]],
    ar: [["مكاتب تنفيذية", "جهة حكومية", "مكاتب إدارية", "مركز تدريب", "مساحة عمل مشتركة", "مكتب إقليمي", "مكتب محاماة", "مكتب هندسي"], ["تعليم", "بلدية", "هيئة", "غرفة تجارية", "جمعية", "أكاديمية", "مركز أبحاث", "مكتب تمثيلي"]] } },
  { label: { en: "Medical centres", ar: "المراكز الطبية" }, rows: {
    en: [["Hospital", "Medical centre", "Dental clinic", "Specialist clinic", "Pharmacy", "Laboratory", "Rehabilitation centre", "Day surgery"], ["Dermatology", "Eye centre", "Physiotherapy", "Radiology", "Paediatrics", "Women’s health", "Medical administration", "Home care"]],
    ar: [["مستشفى", "مركز طبي", "عيادة أسنان", "عيادة تخصصية", "صيدلية", "مختبر", "مركز تأهيل", "جراحة اليوم الواحد"], ["جلدية", "مركز عيون", "علاج طبيعي", "أشعة", "أطفال", "صحة المرأة", "إدارة طبية", "رعاية منزلية"]] } },
  { label: { en: "Schools", ar: "المدارس" }, rows: {
    en: [["International school", "Private school", "Kindergarten", "Primary school", "Secondary school", "Girls’ school", "Boys’ school", "Special-needs school"], ["Classrooms", "Science labs", "Libraries", "Staff rooms", "Multipurpose halls", "Computer labs", "Admin offices", "Reception"]],
    ar: [["مدرسة دولية", "مدرسة أهلية", "روضة أطفال", "مدرسة ابتدائية", "مدرسة ثانوية", "مدرسة بنات", "مدرسة بنين", "مدرسة تربية خاصة"], ["الفصول الدراسية", "معامل العلوم", "المكتبات", "غرف المعلمين", "القاعات متعددة الأغراض", "معامل الحاسب", "المكاتب الإدارية", "الاستقبال"]] } },
  { label: { en: "Universities", ar: "الجامعات" }, rows: {
    en: [["Public university", "Private university", "College", "Technical institute", "Medical college", "Research centre", "Training institute", "Campus administration"], ["Lecture halls", "Libraries", "Laboratories", "Faculty offices", "Study lounges", "Meeting rooms", "Student services", "Auditoriums"]],
    ar: [["جامعة حكومية", "جامعة أهلية", "كلية", "معهد تقني", "كلية طب", "مركز أبحاث", "معهد تدريب", "إدارة الحرم الجامعي"], ["قاعات المحاضرات", "المكتبات", "المختبرات", "مكاتب أعضاء هيئة التدريس", "صالات المذاكرة", "قاعات الاجتماعات", "خدمات الطلاب", "المسارح"]] } },
  { label: { en: "Mosques", ar: "المساجد" }, rows: {
    en: [["Grand mosque", "Jama mosque", "Neighbourhood mosque", "Campus mosque", "Hospital prayer room", "Office prayer room", "Women’s prayer hall", "Quran school"], ["Prayer halls", "Libraries", "Imam’s office", "Meeting rooms", "Classrooms", "Ablution areas", "Shoe storage", "Reception"]],
    ar: [["جامع كبير", "جامع", "مسجد حي", "مسجد حرم جامعي", "مصلى مستشفى", "مصلى مكاتب", "مصلى النساء", "مدرسة تحفيظ"], ["قاعات الصلاة", "المكتبات", "مكتب الإمام", "قاعات الاجتماعات", "الفصول", "أماكن الوضوء", "خزائن الأحذية", "الاستقبال"]] } }
];

export const placeholderClientSectors: ClientSector[] = placeholderRows.map(({ label, rows }) => {
  const ar = rows.ar.flat();
  return { label, clients: rows.en.flat().map((en, i) => ({ id: `${label.en}-${i}`, name: { en, ar: ar[i] }, logo: null })) };
});
