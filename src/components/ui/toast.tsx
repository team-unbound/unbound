"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "motion/react";

/**
 * One toast at a time, bottom-centre. Replacing the message rather than
 * stacking keeps the surface small: nothing here fires in bursts, and a stack
 * would sit on top of the footer links people are usually aiming for.
 */

type Toast = { id: number; message: string };

const ToastContext = createContext<((message: string) => void) | null>(null);

const VISIBLE_MS = 2600;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextId = useRef(0);

  const showToast = useCallback((message: string) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ id: nextId.current++, message });
    timer.current = setTimeout(() => setToast(null), VISIBLE_MS);
  }, []);

  const value = useMemo(() => showToast, [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* The live region is always mounted, so screen readers announce the
          message instead of the region's arrival. */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex justify-center px-gutter pb-8"
      >
        <AnimatePresence>
          {toast ? (
            <motion.p
              key={toast.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-full border border-line-strong bg-surface-raised px-5 py-2.5 text-body-sm text-fg shadow-lg shadow-black/40"
            >
              {toast.message}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const showToast = useContext(ToastContext);
  if (!showToast) {
    throw new Error("useToast must be used inside <ToastProvider>.");
  }
  return showToast;
}
