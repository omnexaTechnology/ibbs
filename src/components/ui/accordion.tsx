"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Plus } from "react-bootstrap-icons";
import { cn } from "@/lib/utils";

export type AccordionItem = {
  id: string;
  question: ReactNode;
  answer: ReactNode;
};

type Props = {
  items: AccordionItem[];
  /** Index open at first (design: the first one). -1 for none. */
  defaultOpen?: number;
  /** Heading level wrapped around each question button. */
  headingLevel?: 2 | 3 | 4;
  className?: string;
};

/**
 * Single-open FAQ accordion (WAI-ARIA accordion pattern): each question is a button inside a heading with
 * aria-expanded / aria-controls; the answer is a labelled region, inert while closed. Up/Down/Home/End
 * move between questions.
 */
export function Accordion({ items, defaultOpen = 0, headingLevel = 3, className }: Props) {
  const base = useId();
  const [open, setOpen] = useState(defaultOpen);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const last = items.length - 1;
    const target = e.key === "ArrowDown" ? (i + 1) % items.length : e.key === "ArrowUp" ? (i - 1 + items.length) % items.length : e.key === "Home" ? 0 : e.key === "End" ? last : -1;
    if (target < 0) return;
    e.preventDefault();
    buttons.current[target]?.focus();
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {items.map((item, i) => {
        const isOpen = open === i;
        const qid = `${base}-q-${i}`;
        const pid = `${base}-p-${i}`;
        return (
          <div key={item.id} className={cn("ui-acc-item", isOpen && "open")} data-testid="accordion-item">
            <Heading>
              <button
                ref={(el) => {
                  buttons.current[i] = el;
                }}
                id={qid}
                type="button"
                className="ui-acc-q"
                aria-expanded={isOpen}
                aria-controls={pid}
                onClick={() => setOpen(isOpen ? -1 : i)}
                onKeyDown={(e) => onKeyDown(e, i)}
              >
                {item.question}
                <span className="ui-acc-ic" aria-hidden="true">
                  <Plus className="size-5" />
                </span>
              </button>
            </Heading>
            <div id={pid} role="region" aria-labelledby={qid} className="ui-acc-a">
              <div inert={!isOpen}>
                <div className="ui-acc-body">{item.answer}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
