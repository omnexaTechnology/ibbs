import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();
const createClientMock = vi.fn((config: Record<string, unknown>) => {
  void config;
  return { fetch: fetchMock };
});
vi.mock("next-sanity", () => ({ createClient: createClientMock, defineQuery: (q: string) => q }));

beforeEach(() => {
  vi.resetModules();
  fetchMock.mockReset().mockResolvedValue([{ ok: true }]);
  createClientMock.mockClear();
});
afterEach(() => vi.unstubAllEnvs());

describe("read client (T-003 / T-006)", () => {
  it("is configured for published content only, with the server-side token", async () => {
    vi.stubEnv("NEXT_PUBLIC_SANITY_PROJECT_ID", "proj123");
    vi.stubEnv("NEXT_PUBLIC_SANITY_DATASET", "production");
    vi.stubEnv("SANITY_API_READ_TOKEN", "read-token-value");
    const { createReadClient } = await import("./client");
    createReadClient();
    expect(createClientMock).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: "proj123",
        dataset: "production",
        perspective: "published",
        useCdn: false,
        token: "read-token-value",
      }),
    );
  });

  it("throws a clear error when Sanity is not configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_SANITY_PROJECT_ID", "");
    const { createReadClient, SanityNotConfiguredError } = await import("./client");
    expect(() => createReadClient()).toThrow(SanityNotConfiguredError);
  });

  it("the token is server-only: no NEXT_PUBLIC_ token, module marked server-only", async () => {
    const { readFileSync } = await import("node:fs");
    const src = readFileSync("src/sanity/client.ts", "utf8");
    expect(src).toContain("process.env.SANITY_API_READ_TOKEN");
    expect(src).not.toMatch(/NEXT_PUBLIC_[A-Z_]*TOKEN/);
    expect(src.startsWith('import "server-only"')).toBe(true);
  });
});

describe("sanityFetch", () => {
  it("passes tags and a safety-net revalidate to Next's data cache", async () => {
    vi.stubEnv("NEXT_PUBLIC_SANITY_PROJECT_ID", "proj123");
    const { sanityFetch, SAFETY_REVALIDATE_SECONDS } = await import("./fetch");
    const result = await sanityFetch({ query: "*[_type == 1]", params: { a: 1 }, tags: ["project"] });
    expect(result).toEqual([{ ok: true }]);
    expect(fetchMock).toHaveBeenCalledWith(
      "*[_type == 1]",
      { a: 1 },
      { next: { revalidate: SAFETY_REVALIDATE_SECONDS, tags: ["project"] } },
    );
  });
});

describe("sanityFetch signal (R2-02)", () => {
  it("passes an abort signal through to the client", async () => {
    vi.stubEnv("NEXT_PUBLIC_SANITY_PROJECT_ID", "proj123");
    const { sanityFetch } = await import("./fetch");
    const signal = new AbortController().signal;
    await sanityFetch({ query: "*", tags: ["project"], signal });
    expect(fetchMock.mock.calls[0][2].signal).toBe(signal);
  });
});

describe("content API", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SANITY_PROJECT_ID", "proj123");
  });

  it("getHomeContent is ONE query tagged with hero and project (NFR-001)", async () => {
    fetchMock.mockResolvedValue({ hero: null, projects: [] });
    const { getHomeContent } = await import("./content");
    const home = await getHomeContent();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][2].next.tags).toEqual(["heroSlides", "project"]);
    expect(home.hero).toHaveLength(4);
    expect(home.projects).toEqual([]);
  });

  it("getProjectSlugs is one project-tagged query returning plain slugs", async () => {
    fetchMock.mockResolvedValue([{ slug: "a" }, { slug: "b" }]);
    const { getProjectSlugs } = await import("./content");
    expect(await getProjectSlugs()).toEqual(["a", "b"]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][2].next.tags).toEqual(["project"]);
  });

  it("getProjectBySlug is ONE project-tagged query that also asks for same-category related (max 3, not itself)", async () => {
    fetchMock.mockResolvedValue(null);
    const { getProjectBySlug } = await import("./content");
    await getProjectBySlug("x");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const groq = fetchMock.mock.calls[0][0] as string;
    expect(groq).toContain('"related"');
    expect(groq).toContain("category == ^.category");
    expect(groq).toContain("_id != ^._id");
    expect(groq).toContain("[0...3]");
    expect(fetchMock.mock.calls[0][2].next.tags).toEqual(["project"]);
  });

  it("getProjectBySlug passes the slug as a query parameter, never string-concatenated", async () => {
    fetchMock.mockResolvedValue(null);
    const { getProjectBySlug } = await import("./content");
    expect(await getProjectBySlug('x"] || true')).toBeNull();
    expect(fetchMock.mock.calls[0][1]).toEqual({ slug: 'x"] || true' });
    expect(fetchMock.mock.calls[0][0]).not.toContain("|| true");
  });

  it("queries never read drafts or leads", async () => {
    const q = await import("./queries");
    const all = [q.PROJECTS_QUERY, q.PROJECT_BY_SLUG_QUERY, q.PROJECT_SLUGS_QUERY, q.HOME_QUERY, q.HERO_SLIDES_QUERY, q.SITE_SETTINGS_QUERY];
    for (const query of all) {
      expect(query).not.toContain("drafts");
      expect(query).not.toContain('"lead"');
    }
  });
});

describe("content API without Sanity configuration (R-07)", () => {
  it("returns empty results and never calls Sanity, so pages build without env vars", async () => {
    vi.stubEnv("NEXT_PUBLIC_SANITY_PROJECT_ID", "");
    const c = await import("./content");
    expect(await c.getProjects()).toEqual([]);
    expect(await c.getProjectBySlug("x")).toBeNull();
    expect(await c.getProjectSlugs()).toEqual([]);
    expect(await c.getHeroSlides()).toHaveLength(4);
    const home = await c.getHomeContent();
    expect(home.projects).toEqual([]);
    expect(home.hero.every((s) => s.image === null)).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(createClientMock).not.toHaveBeenCalled();
  });
});
