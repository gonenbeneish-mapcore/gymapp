import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** Bottom sheet with a dimmed backdrop. Tap the backdrop or press Escape to close. */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 animate-fade"
        style={{ background: "var(--scrim)" }}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-md animate-sheet rounded-t-[28px] bg-surface px-5 pt-2.5 pb-[calc(20px+env(safe-area-inset-bottom))] shadow-float"
      >
        <div className="mx-auto mb-3 h-[5px] w-10 rounded-full bg-surface-3" />
        {children}
      </div>
    </div>,
    document.body,
  );
}
