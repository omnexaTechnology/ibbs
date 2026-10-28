import type { LocalizedString } from "@/types/site-settings";

/**
 * Placeholder client names for the home "Organizations we work with" section, from the design (`CL2`).
 * They are generic descriptions, not real clients; real names and logos arrive once approved (FEAT-005).
 * `rows[lang]` = two marquee rows of 8 labels each.
 */
export type ClientSector = { label: LocalizedString; rows: { en: string[][]; ar: string[][] } };

export const clientSectors: ClientSector[] = [
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
