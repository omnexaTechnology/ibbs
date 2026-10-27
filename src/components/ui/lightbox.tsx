"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, XLg } from "react-bootstrap-icons";
import { useSwipe } from "@/hooks/use-swipe";

export type LightboxImage = { src: string; alt: string; width?: number; height?: number };

type Props = {
  images: LightboxImage[];
  /** Index shown, or -1 when closed. */
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
  /** Dialog name, e.g. the project title. */
  label?: string;
};

const FOCUSABLE = "button, [href], [tabindex]:not([tabindex=\"-1\"])";

/**
 * Full-screen image viewer: Esc closes, Left/Right (and swipe) navigate, Tab stays inside, focus returns to the
 * opener on close, page scroll is locked while open. The overlay is always LTR like the design, so Left = previous.
 */
export function Lightbox({ images, index, onIndexChange, onClose, label }: Props) {
  const t = useTranslations("ui");
  const open = index >= 0 && index < images.length;
  const root = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);
  const count = images.length;
  const go = (i: number) => onIndexChange(((i % count) + count) % count);
  const swipe = useSwipe((d) => go(d === "left" ? index + 1 : index - 1));

  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    root.current?.querySelector<HTMLElement>("button")?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      if (opener.current instanceof HTMLElement) opener.current.focus();
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;
  const img = images[index];

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      go(index - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      go(index + 1);
    } else if (e.key === "Tab") {
      const f = Array.from(root.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  return createPortal(
    <div
      ref={root}
      className="ui-lb"
      role="dialog"
      aria-modal="true"
      aria-label={label ?? t("viewerLabel")}
      data-testid="lightbox"
      onKeyDown={onKeyDown}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      {...swipe}
    >
      <button type="button" className="ui-lb-btn ui-lb-x" aria-label={t("closeLightbox")} onClick={onClose}>
        <XLg className="size-5" aria-hidden="true" />
      </button>
      {count > 1 ? (
        <>
          <button type="button" className="ui-lb-btn ui-lb-p" aria-label={t("prevImage")} onClick={() => go(index - 1)}>
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <button type="button" className="ui-lb-btn ui-lb-n" aria-label={t("nextImage")} onClick={() => go(index + 1)}>
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        </>
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element -- full-size viewer: the URL is already sized by the Sanity image CDN */}
      <img key={index} className="ui-lb-img" src={img.src} alt={img.alt} width={img.width} height={img.height} draggable={false} />
      {count > 1 ? (
        <div className="ui-lb-c" aria-live="polite">
          {t("imageCount", { current: index + 1, total: count })}
        </div>
      ) : null}
    </div>,
    document.body,
  );
}
