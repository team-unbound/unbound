"use client";

import { useActionState } from "react";
import {
  subscribeToNewsletter,
  type SubscribeState,
} from "@/app/newsletter/actions";
import { Field, SubmitButton, TextInput } from "@/components/ui/field";

const initialState: SubscribeState = { status: "idle" };

export function NewsletterForm() {
  const [state, formAction, pending] = useActionState(
    subscribeToNewsletter,
    initialState,
  );

  if (state.status === "success" || state.status === "already") {
    const returning = state.status === "already";
    return (
      <div
        role="status"
        className="rounded-2xl border border-line bg-surface p-8 lg:p-10"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-fg">
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              d="m5 12.5 4.5 4.5L19 7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="mt-6 text-h3 font-medium">
          {returning ? "You're already subscribed." : "You're on the list."}
        </h2>
        <p className="mt-3 text-body-sm text-fg-muted text-pretty">
          {returning ? (
            <>
              <span className="text-fg">{state.email}</span> is already on the
              list, so there is nothing to do. The next issue will reach you.
            </>
          ) : (
            <>
              We&rsquo;ll send the next issue to{" "}
              <span className="text-fg">{state.email}</span>. Build notes,
              events, and what the community is shipping. Nothing else.
            </>
          )}
        </p>
      </div>
    );
  }

  const fieldErrors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <form
      action={formAction}
      noValidate
      className="rounded-2xl border border-line bg-surface p-8 lg:p-10"
    >
      <div className="flex flex-col gap-5">
        <Field label="Email" htmlFor="email" error={fieldErrors.email}>
          <TextInput
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@university.edu"
            invalid={Boolean(fieldErrors.email)}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="First name"
            htmlFor="firstName"
            optional
            error={fieldErrors.firstName}
          >
            <TextInput
              id="firstName"
              name="firstName"
              autoComplete="given-name"
              placeholder="Ada"
              invalid={Boolean(fieldErrors.firstName)}
            />
          </Field>

          <Field
            label="Last name"
            htmlFor="lastName"
            optional
            error={fieldErrors.lastName}
          >
            <TextInput
              id="lastName"
              name="lastName"
              autoComplete="family-name"
              placeholder="Lovelace"
              invalid={Boolean(fieldErrors.lastName)}
            />
          </Field>
        </div>
      </div>

      {state.status === "error" && !state.fieldErrors ? (
        <p role="alert" className="mt-5 text-body-sm text-fg-muted">
          {state.message}
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <SubmitButton pending={pending}>Subscribe</SubmitButton>
        <p className="text-body-sm text-fg-subtle">
          Unsubscribe any time. We never share your email.
        </p>
      </div>
    </form>
  );
}
