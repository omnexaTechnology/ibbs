import { vi } from "vitest";

/** Make the reduced-motion media query match (or not) for the following render. */
export function setReducedMotion(reduce: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduce && query.includes("prefers-reduced-motion"),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

type Callback = (entries: Partial<IntersectionObserverEntry>[], observer: IntersectionObserver) => void;

export type IOHandle = {
  /** Report all observed elements as intersecting (or not). */
  fire: (isIntersecting: boolean) => void;
  observed: () => Element[];
  restore: () => void;
};

/**
 * Replace IntersectionObserver. With `auto: true` every observed element is reported as intersecting at once;
 * otherwise tests call `fire()`.
 */
export function mockIntersectionObserver({ auto = false }: { auto?: boolean } = {}): IOHandle {
  const original = globalThis.IntersectionObserver;
  const live = new Set<MockIO>();

  class MockIO {
    elements = new Set<Element>();
    constructor(private cb: Callback) {
      live.add(this);
    }
    observe = (el: Element) => {
      this.elements.add(el);
      if (auto) this.emit(true);
    };
    unobserve = (el: Element) => void this.elements.delete(el);
    disconnect = () => {
      this.elements.clear();
      live.delete(this);
    };
    takeRecords = () => [];
    emit(isIntersecting: boolean) {
      if (!this.elements.size) return;
      this.cb([...this.elements].map((target) => ({ target, isIntersecting, intersectionRatio: isIntersecting ? 1 : 0 })), this as unknown as IntersectionObserver);
    }
  }
  globalThis.IntersectionObserver = MockIO as unknown as typeof IntersectionObserver;

  return {
    fire: (v) => [...live].forEach((io) => io.emit(v)),
    observed: () => [...live].flatMap((io) => [...io.elements]),
    restore: () => {
      globalThis.IntersectionObserver = original;
    },
  };
}
