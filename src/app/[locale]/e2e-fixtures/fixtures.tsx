"use client";

import { Accordion } from "@/components/ui/accordion";
import { Carousel } from "@/components/ui/carousel";
import { Counter } from "@/components/ui/counter";
import { HotspotImage } from "@/components/ui/hotspot";
import { SectionHeading } from "@/components/ui/section-heading";
import { SceneRoot } from "@/three/scene-root";

const slides = ["One", "Two", "Three"].map((s) => (
  <div key={s} className="grid size-full place-items-center bg-navy text-cream">
    {s}
  </div>
));

export function Fixtures({ dir }: { dir: "ltr" | "rtl" }) {
  return (
    <div className="mx-auto max-w-3xl space-y-16 p-8">
      <SectionHeading eyebrow="Fixtures" title="UI primitives" lead="Test page" />
      <Carousel items={slides} label="Demo carousel" dir={dir} autoAdvance={false} className="h-48" />
      <p>
        <Counter to={120} suffix="+" className="text-4xl" />
      </p>
      <Accordion items={[{ id: "a", question: "Q1", answer: "A1" }, { id: "b", question: "Q2", answer: "A2" }]} />
      <HotspotImage aspect={2} dir={dir} hotspots={[{ x: 20, y: 40, title: "Pin" }]} className="bg-cyan/30">
        <div />
      </HotspotImage>
      <SceneRoot
        load={() => import("@/three/demo-scene")}
        label="Demo 3D scene"
        className="h-80 w-full bg-cream"
        fallback={<div data-testid="still" className="grid size-full place-items-center bg-cream">Still image</div>}
      />
    </div>
  );
}
