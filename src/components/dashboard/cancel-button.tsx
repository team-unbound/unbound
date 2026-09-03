"use client";

import { useActionState } from "react";
import {
  cancelPairingRequest,
  type CancelState,
} from "@/app/community/actions";

const initialState: CancelState = { status: "idle" };

export function CancelButton({ requestId }: { requestId: string }) {
  const [state, formAction, pending] = useActionState(
    cancelPairingRequest,
    initialState,
  );

  if (state.status === "success") {
    return <p className="text-body-sm text-fg-subtle">Cancelled.</p>;
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="requestId" value={requestId} />
      <button
        type="submit"
        disabled={pending}
        className="text-body-sm text-fg-muted underline underline-offset-4 transition-colors hover:text-fg disabled:opacity-60"
      >
        Cancel request
      </button>
      {state.status === "error" ? (
        <span role="alert" className="text-body-sm text-fg-subtle">
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
