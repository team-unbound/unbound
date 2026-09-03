"use client";

import { useActionState } from "react";
import {
  sendPairingRequest,
  type PairingFormState,
} from "@/app/community/actions";
import { Field, SubmitButton, TextArea } from "@/components/ui/field";

const initialState: PairingFormState = { status: "idle" };

export function PairingRequestForm({
  recipientProfileId,
  recipientName,
  onDone,
}: {
  recipientProfileId: string;
  recipientName: string;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    sendPairingRequest,
    initialState,
  );

  if (state.status === "success") {
    return (
      <div role="status" className="mt-5 border-t border-line pt-5">
        <p className="text-body-sm text-fg">Request sent.</p>
        <p className="mt-1 text-body-sm text-fg-muted text-pretty">
          {state.recipientName} will see your reason and can accept or decline.
          You&rsquo;ll both get each other&rsquo;s email if they accept.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-5 border-t border-line pt-5">
      <input
        type="hidden"
        name="recipientProfileId"
        value={recipientProfileId}
      />

      <Field
        label={`Why do you want to pair with ${recipientName.split(" ")[0]}?`}
        htmlFor={`reason-${recipientProfileId}`}
        error={state.status === "error" ? state.fieldErrors?.reason : undefined}
        hint="They'll read this before deciding. Be specific."
      >
        <TextArea
          id={`reason-${recipientProfileId}`}
          name="reason"
          rows={3}
          required
          minLength={20}
          maxLength={600}
          placeholder="I'm building a study-group app and need someone who's actually shipped a design system…"
          invalid={
            state.status === "error" && Boolean(state.fieldErrors?.reason)
          }
        />
      </Field>

      {state.status === "error" && !state.fieldErrors ? (
        <p role="alert" className="mt-3 text-body-sm text-fg-muted">
          {state.message}
        </p>
      ) : null}

      <div className="mt-5 flex items-center gap-3">
        <SubmitButton pending={pending}>Send request</SubmitButton>
        <button
          type="button"
          onClick={onDone}
          className="text-body-sm text-fg-muted transition-colors hover:text-fg"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
