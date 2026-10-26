import { describe, expect, it } from "vitest";
import { HERO_SLIDE_COUNT, PROJECT_CATEGORY_KEYS, SCOPE_KEYS } from "../../content/taxonomy";
import { NO_CREATE_TYPES, SINGLETON_TYPES, schemaTypes } from "./index";
import { hasBothLocales, isKebabSlug, isWhatsappNumber } from "./validation";

type AnyField = { name: string; type: string; options?: { list?: { value: string }[] }; description?: string; readOnly?: boolean };
type AnyType = { name: string; type: string; fields?: AnyField[] };

const byName = (name: string) => {
  const t = (schemaTypes as unknown as AnyType[]).find((x) => x.name === name);
  if (!t) throw new Error(`schema type ${name} missing`);
  return t;
};
const field = (typeName: string, fieldName: string) => {
  const f = byName(typeName).fields?.find((x) => x.name === fieldName);
  if (!f) throw new Error(`${typeName}.${fieldName} missing`);
  return f;
};

describe("schema registry", () => {
  it("registers the four documents and the building blocks", () => {
    const names = (schemaTypes as unknown as AnyType[]).map((t) => t.name);
    expect(names).toEqual(
      expect.arrayContaining(["project", "heroSlides", "siteSettings", "lead", "localeString", "localeText", "imageHotspot"]),
    );
    expect(new Set(names).size).toBe(names.length);
  });

  it("compiles with the Sanity schema compiler (no structural errors)", async () => {
    const { Schema } = await import("@sanity/schema");
    expect(() => Schema.compile({ name: "default", types: schemaTypes })).not.toThrow();
  });

  it("hides singletons and leads from the create menu", () => {
    expect([...NO_CREATE_TYPES]).toEqual(expect.arrayContaining([...SINGLETON_TYPES, "lead"]));
  });
});

describe("REQ-003 localisation", () => {
  it("localeString and localeText have en and ar side by side", () => {
    for (const name of ["localeString", "localeText"]) {
      expect(byName(name).fields?.map((f) => f.name)).toEqual(["en", "ar"]);
    }
  });
});

describe("REQ-004 project", () => {
  it("has every field of the spec", () => {
    const names = byName("project").fields?.map((f) => f.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "title", "slug", "category", "cover", "gallery", "areaM2", "durationDays", "year", "city",
        "client", "challenge", "solution", "hotspots", "scope", "featured", "order",
      ]),
    );
  });

  it("offers exactly the category keys from taxonomy (BR-005)", () => {
    const values = field("project", "category").options?.list?.map((o) => o.value);
    expect(values).toEqual([...PROJECT_CATEGORY_KEYS]);
  });

  it("offers exactly the scope keys from taxonomy (BR-005)", () => {
    const values = field("project", "scope").options?.list?.map((o) => o.value);
    expect(values).toEqual([...SCOPE_KEYS]);
  });

  it("hotspots are objects with x, y, tag, title, description", () => {
    expect(byName("imageHotspot").fields?.map((f) => f.name)).toEqual(["x", "y", "tag", "title", "description"]);
  });
});

describe("REQ-005 hero", () => {
  it("has exactly 4 slide slots, each warning about the fixed hotspots (BR-008)", () => {
    const fields = byName("heroSlides").fields ?? [];
    expect(HERO_SLIDE_COUNT).toBe(4);
    expect(fields.map((f) => f.name)).toEqual(["slide1", "slide2", "slide3", "slide4"]);
    for (const f of fields) expect(f.type).toBe("heroSlideImage");
    for (const f of fields) expect(f.description).toMatch(/dots?/i);
  });

  it("a slot is an image plus alt en/ar", () => {
    expect(byName("heroSlideImage").fields?.map((f) => f.name)).toEqual(["image", "alt"]);
    expect(field("heroSlideImage", "alt").type).toBe("localeString");
  });
});

describe("REQ-005b site settings", () => {
  it("has contacts, social, whatsapp and lead notification emails", () => {
    expect(byName("siteSettings").fields?.map((f) => f.name)).toEqual([
      "phones", "emails", "website", "whatsappNumber", "whatsappMessage", "workingHours", "address", "mapUrl", "social",
      "leadNotificationEmails",
    ]);
  });
});

describe("REQ-006 lead", () => {
  it("everything is read-only for editors except the handled flag", () => {
    const fields = byName("lead").fields ?? [];
    const editable = fields.filter((f) => !f.readOnly).map((f) => f.name);
    expect(editable).toEqual(["handled"]);
    expect(fields.map((f) => f.name)).toEqual(
      expect.arrayContaining(["formType", "name", "company", "email", "phone", "spaceType", "area", "message", "locale", "pageUrl", "createdAt", "emailDelivered"]),
    );
  });
});

describe("validation helpers", () => {
  it("BR-004: title needs both languages", () => {
    expect(hasBothLocales({ en: "Office", ar: "مكتب" })).toBe(true);
    expect(hasBothLocales({ en: "Office" })).toBe(false);
    expect(hasBothLocales({ en: "  ", ar: "x" })).toBe(false);
    expect(hasBothLocales(undefined)).toBe(false);
  });

  it("BR-001: slug is lowercase kebab", () => {
    for (const ok of ["exec-hq", "a", "ops-floor-2"]) expect(isKebabSlug(ok)).toBe(true);
    for (const bad of ["Exec-HQ", "exec_hq", "exec--hq", "-exec", "exec-", "exec hq", "", undefined]) {
      expect(isKebabSlug(bad as string | undefined)).toBe(false);
    }
  });

  it("WhatsApp number is digits with country code, or empty", () => {
    expect(isWhatsappNumber("")).toBe(true);
    expect(isWhatsappNumber(undefined)).toBe(true);
    expect(isWhatsappNumber("966501234567")).toBe(true);
    for (const bad of ["+966501234567", "966 50 123", "0501234567", "abc", "123"]) expect(isWhatsappNumber(bad)).toBe(false);
  });
});
