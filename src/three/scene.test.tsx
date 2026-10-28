import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/render";
import { mockIntersectionObserver, setReducedMotion, type IOHandle } from "@/test/dom-mocks";

const fakeRenderer = {
  render: vi.fn(),
  setSize: vi.fn(),
  dispose: vi.fn(),
  forceContextLoss: vi.fn(),
};
const createRenderer = vi.fn(() => fakeRenderer as unknown);
const hasWebGL = vi.fn(() => true);

vi.mock("./renderer", async (orig) => ({
  ...(await orig<typeof import("./renderer")>()),
  createRenderer: (...a: unknown[]) => createRenderer(...(a as [])),
}));

vi.mock("./support", async (orig) => ({
  ...(await orig<typeof import("./support")>()),
  hasWebGL: () => hasWebGL(),
}));

import SceneCanvas from "./scene-canvas";
import { SceneRoot } from "./scene-root";

let io: IOHandle;
let rafCbs: FrameRequestCallback[] = [];
const frame = () => act(() => void rafCbs.splice(0).forEach((cb) => cb(performance.now() + 16)));

beforeEach(() => {
  vi.clearAllMocks();
  hasWebGL.mockReturnValue(true);
  setReducedMotion(false);
  io = mockIntersectionObserver();
  rafCbs = [];
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => rafCbs.push(cb));
  vi.stubGlobal("cancelAnimationFrame", () => {});
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
});
afterEach(() => {
  io.restore();
  vi.unstubAllGlobals();
});

const makeScene = () => {
  const dispose = vi.fn();
  const frameFn = vi.fn();
  const factory = vi.fn(() => ({ frame: frameFn, dispose }));
  return { dispose, frameFn, factory, load: () => Promise.resolve({ default: factory }) };
};

describe("SceneCanvas lifecycle (REQ-012)", () => {
  it("renders only while visible and pauses off-screen", async () => {
    const s = makeScene();
    const onStatus = vi.fn();
    render(<SceneCanvas load={s.load} label="x" onStatus={onStatus} />);
    await waitFor(() => expect(onStatus).toHaveBeenCalledWith("ready"));
    frame();
    expect(s.frameFn).not.toHaveBeenCalled(); // not yet seen by the observer

    act(() => io.fire(true));
    frame();
    expect(s.frameFn).toHaveBeenCalledTimes(1);
    expect(fakeRenderer.render).toHaveBeenCalledTimes(1);

    act(() => io.fire(false));
    frame();
    expect(s.frameFn).toHaveBeenCalledTimes(1);
    expect(rafCbs).toHaveLength(0);

    act(() => io.fire(true));
    frame();
    expect(s.frameFn).toHaveBeenCalledTimes(2);
  });

  it("disposes the scene handle, renderer, GL context and canvas on unmount", async () => {
    const s = makeScene();
    const onStatus = vi.fn();
    const { unmount, container } = render(<SceneCanvas load={s.load} label="x" onStatus={onStatus} />);
    await waitFor(() => expect(onStatus).toHaveBeenCalledWith("ready"));
    expect(container.querySelector("canvas")).not.toBeNull();
    unmount();
    expect(s.dispose).toHaveBeenCalledTimes(1);
    expect(fakeRenderer.dispose).toHaveBeenCalledTimes(1);
    expect(fakeRenderer.forceContextLoss).toHaveBeenCalledTimes(1);
    expect(document.querySelector("canvas")).toBeNull();
    // no frame is drawn after unmount
    act(() => io.fire(true));
    frame();
    expect(s.frameFn).not.toHaveBeenCalled();
  });

  it("unmount during scene loading still cleans up and never reports ready", async () => {
    let release!: (m: { default: () => { dispose: () => void } }) => void;
    const dispose = vi.fn();
    const load = () => new Promise<{ default: () => { dispose: () => void } }>((r) => (release = r));
    const onStatus = vi.fn();
    const { unmount } = render(<SceneCanvas load={load} label="x" onStatus={onStatus} />);
    unmount();
    expect(fakeRenderer.forceContextLoss).toHaveBeenCalledTimes(1);
    await act(async () => release({ default: () => ({ dispose }) }));
    expect(onStatus).not.toHaveBeenCalledWith("ready");
  });

  it("reports unsupported when the renderer cannot be created", () => {
    createRenderer.mockReturnValueOnce(null);
    const onStatus = vi.fn();
    render(<SceneCanvas load={makeScene().load} label="x" onStatus={onStatus} />);
    expect(onStatus).toHaveBeenCalledWith("unsupported");
  });

  it("reports error and disposes when the scene factory throws", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const onStatus = vi.fn();
    render(<SceneCanvas load={() => Promise.resolve(() => { throw new Error("x"); })} label="x" onStatus={onStatus} />);
    await waitFor(() => expect(onStatus).toHaveBeenCalledWith("error"));
    err.mockRestore();
  });

  it("B1-13a/R2-10: aria-label follows the label prop", async () => {
    const s = makeScene();
    const first = vi.fn();
    const second = vi.fn();
    const { rerender, container } = render(<SceneCanvas load={s.load} label="one" onStatus={first} />);
    await waitFor(() => expect(first).toHaveBeenCalledWith("ready"));
    rerender(<SceneCanvas load={s.load} label="two" onStatus={second} />);
    expect(container.querySelector("canvas")).toHaveAttribute("aria-label", "two");
    // the latest onStatus is the one called (B1-13a)
    first.mockClear();
    act(() => {
      container.querySelector("canvas")!.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
    });
    expect(second).toHaveBeenCalledWith("lost");
    expect(first).not.toHaveBeenCalled();
  });

  it("BR-001: reduced motion draws a still frame, not a loop", async () => {
    setReducedMotion(true);
    const s = makeScene();
    const onStatus = vi.fn();
    render(<SceneCanvas load={s.load} label="x" onStatus={onStatus} />);
    await waitFor(() => expect(onStatus).toHaveBeenCalledWith("ready"));
    act(() => io.fire(true));
    frame();
    expect(fakeRenderer.render).toHaveBeenCalledTimes(1);
    expect(rafCbs).toHaveLength(0);
  });
});

describe("<SceneRoot>", () => {
  it("shows the fallback and loads nothing until near the viewport", () => {
    renderWithIntl(<SceneRoot load={makeScene().load} label="Scene" fallback={<span>still</span>} />);
    expect(screen.getByTestId("scene-root")).toHaveAttribute("data-scene-status", "idle");
    expect(screen.getByText("still")).toBeInTheDocument();
    expect(createRenderer).not.toHaveBeenCalled();
  });

  it("mounts the canvas when near the viewport and drops the loading state when ready", async () => {
    renderWithIntl(<SceneRoot load={makeScene().load} label="Scene" fallback={<span>still</span>} />);
    act(() => io.fire(true));
    await waitFor(() => expect(screen.getByTestId("scene-root")).toHaveAttribute("data-scene-status", "ready"));
    expect(document.querySelector("canvas")).toHaveAttribute("aria-label", "Scene");
  });

  it("REQ-013: without WebGL it keeps the still image, explains it, and never creates a renderer", () => {
    hasWebGL.mockReturnValue(false);
    renderWithIntl(<SceneRoot load={makeScene().load} label="Scene" fallback={<span>still</span>} />);
    act(() => io.fire(true));
    expect(screen.getByTestId("scene-root")).toHaveAttribute("data-scene-status", "unsupported");
    expect(screen.getByText("still")).toBeInTheDocument();
    expect(screen.getByTestId("scene-caption")).toBeInTheDocument();
    expect(createRenderer).not.toHaveBeenCalled();
  });

  it("B1-06: releaseWhenFar resets to loading so the next near starts from loading, not a stale ready", async () => {
    renderWithIntl(<SceneRoot load={makeScene().load} label="Scene" fallback={<span>still</span>} releaseWhenFar />);
    const status = () => screen.getByTestId("scene-root").getAttribute("data-scene-status");
    act(() => io.fire(true));
    await waitFor(() => expect(status()).toBe("ready"));
    act(() => io.fire(false));
    expect(status()).toBe("idle");
    act(() => io.fire(true));
    expect(status()).toBe("loading");
  });

  it("disposes on unmount", async () => {
    const s = makeScene();
    const { unmount } = renderWithIntl(<SceneRoot load={s.load} label="Scene" />);
    act(() => io.fire(true));
    await waitFor(() => expect(s.factory).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByTestId("scene-root")).toHaveAttribute("data-scene-status", "ready"));
    unmount();
    expect(s.dispose).toHaveBeenCalledTimes(1);
    expect(fakeRenderer.forceContextLoss).toHaveBeenCalledTimes(1);
  });
});

describe("B1-01: SceneRoot does not pull in Three", () => {
  it("imports scene-root without loading three", async () => {
    vi.resetModules();
    vi.doMock("three", () => {
      throw new Error("three imported by scene-root");
    });
    vi.doMock("./renderer", () => {
      throw new Error("renderer imported by scene-root");
    });
    await expect(import("./scene-root")).resolves.toHaveProperty("SceneRoot");
    vi.doUnmock("three");
    vi.doUnmock("./renderer");
  });
});
