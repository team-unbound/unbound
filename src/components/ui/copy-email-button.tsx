"use client";

import type { ReactNode } from "react";
import { useToast } from "./toast";

/**
 * `navigator.clipboard` needs a secure context and isn't there in every
 * in-app browser (Instagram's, notably, which is where a lot of our traffic
 * lands). Falls back to the old selection trick before giving up.
 */
async function copy(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the textarea path.
    }
  }

  const scratch = document.createElement("textarea");
  scratch.value = text;
  scratch.setAttribute("readonly", "");
  scratch.style.position = "fixed";
  scratch.style.opacity = "0";
  document.body.appendChild(scratch);
  scratch.select();
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    scratch.remove();
  }
}

export function CopyEmailButton({
  email,
  children,
  className = "",
  copiedMessage = "Email copied to your clipboard",
}: {
  email: string;
  children: ReactNode;
  className?: string;
  copiedMessage?: string;
}) {
  const showToast = useToast();

  return (
    <button
      type="button"
      onClick={async () => {
        const ok = await copy(email);
        showToast(ok ? copiedMessage : `Copy failed. Our address is ${email}`);
      }}
      className={className}
    >
      {children}
    </button>
  );
}
