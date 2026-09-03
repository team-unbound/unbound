"use client";

import { useActionState } from "react";
import {
  respondToPairingRequest,
  type RespondState,
} from "@/app/community/actions";

const initialState: RespondState = { status: "idle" };

export function RespondButtons({ requestId }: { requestId: string }) {
  const [state, formAction, pending] = useActionState(
    respondToPairingRequest,
    initialState,
  );

  if (state.status === "success") {
    return (
      <p role="status" className="text-body-sm text-fg-muted">
        {state.decision === "accepted"
          ? "Accepted — their email is below."
          : "Declined."}
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <input type="hidden" name="requestId" value={requestId} />

      <button
        type="submit"
        name="decision"
        value="accepted"
        disabled={pending}
        className="rounded-full bg-fg px-5 py-2 text-body-sm font-medium text-canvas transition-opacity hover:opacity-85 disabled:opacity-60"
      >
        Accept
      </button>

      <button
        type="submit"
        name="decision"
        value="declined"
        disabled={pending}
        className="rounded-full border border-line-strong px-5 py-2 text-body-sm font-medium transition-colors hover:border-fg disabled:opacity-60"
      >
        Decline
      </button>

      {state.status === "error" ? (
        <span role="alert" className="text-body-sm text-fg-muted">
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
