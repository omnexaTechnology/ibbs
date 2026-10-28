import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

const WORDS = [
  { w: "INNOVATE", outline: true },
  { w: "INSPIRE", outline: false },
  { w: "ELEVATE", outline: true },
  { w: "IBSS Innovations", outline: false },
];

/** Kinetic words band (REQ-002). Decorative (the slogan is also in the footer), so hidden from assistive tech. */
export function Kinetic() {
  return (
    <div className="ui-mq overflow-hidden border-y border-line" dir="ltr" aria-hidden="true" data-testid="home-kinetic">
      <div className="ui-mq-track" style={{ "--mq-s": "38s" } as CSSProperties}>
        {[0, 1].map((copy) => (
          <div key={copy} className={cn("flex flex-none items-center gap-10 px-5 py-[26px] text-[clamp(40px,6vw,92px)] leading-none font-bold tracking-[-0.02em] whitespace-nowrap", copy === 1 && "ui-mq-dup")}>
            {[0, 1].map((rep) =>
              WORDS.map((x) => (
                <span key={`${rep}-${x.w}`} className="inline-flex items-center gap-10">
                  <span className={x.outline ? "text-transparent [-webkit-text-stroke:1.5px_var(--text)]" : "text-fg"}>{x.w}</span>
                  <span className="inline-flex gap-2">
                    <i className="block h-[.62em] w-5 -skew-x-[28deg] bg-blue" />
                    <i className="block h-[.62em] w-5 -skew-x-[28deg] bg-cyan" />
                    <i className="block h-[.62em] w-5 -skew-x-[28deg] bg-green" />
                  </span>
                </span>
              )),
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
