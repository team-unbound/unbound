"use client";

import { useActionState, useState } from "react";
import { signUpForEvent, type EventSignupState } from "@/app/events/actions";
import { Field, SubmitButton, TextInput } from "@/components/ui/field";

const initialState: EventSignupState = { status: "idle" };

/** The exact wording that gets stored as consent, kept in one place. */
const COMMITMENT_LABEL =
  "I'm genuinely committed to attending and will do my best to show up unless something important comes up";

export function EventSignupForm({
  eventId,
  eventTitle,
}: {
  eventId: string;
  eventTitle: string;
}) {
  const [state, formAction, pending] = useActionState(
    signUpForEvent,
    initialState,
  );

  // Controlled on purpose. React resets an uncontrolled form once its action
  // resolves, so a server-side validation error would hand back an empty form
  // and make the reader retype everything they just typed.
  const [values, setValues] = useState({
    fullName: "",
    email: "",
    age: "",
    gradeYear: "",
  });
  const [commitError, setCommitError] = useState<string | null>(null);

  const set = (field: keyof typeof values) => (event: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [field]: event.target.value }));

  /**
   * The box gates submission here as well as in the action. noValidate is on
   * (so field errors render in the app's own style rather than as browser
   * tooltips), which means `required` alone would not stop the post.
   *
   * Read straight off the FormData rather than from a piece of React state
   * mirroring it. React resets the form once an action resolves, which
   * unticks the rendered box while a mirrored `committed` state stayed true —
   * so a retry after a validation error submitted affirmative consent while
   * the reader was looking at an empty checkbox. The form data is what the
   * server receives, so checking it is the only version that cannot drift.
   */
  function submit(formData: FormData) {
    if (formData.get("committed") !== "on") {
      setCommitError("Please confirm you're planning to show up.");
      return;
    }
    setCommitError(null);
    formAction(formData);
  }

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
          {returning ? "You're already signed up." : "You're in."}
        </h2>
        <p className="mt-3 text-body-sm text-fg-muted text-pretty">
          {returning ? (
            <>
              <span className="text-fg">{state.email}</span> is already on the
              list for {eventTitle}, so there&rsquo;s nothing else to do. See
              you there.
            </>
          ) : (
            <>
              We&rsquo;ve got you down for {eventTitle}, {state.fullName}.
              We&rsquo;ll send the details to{" "}
              <span className="text-fg">{state.email}</span> before the day.
            </>
          )}
        </p>
        <p className="mt-5 text-body-sm text-fg-subtle text-pretty">
          Something come up? Reply to that email and tell us — a seat you
          can&rsquo;t use is more useful to someone else.
        </p>
      </div>
    );
  }

  const fieldErrors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const commitMessage = commitError ?? fieldErrors.committed;

  return (
    <form
      action={submit}
      noValidate
      className="rounded-2xl border border-line bg-surface p-8 lg:p-10"
    >
      <input type="hidden" name="eventId" value={eventId} />

      <h2 className="text-h3 font-medium">Save your spot</h2>
      <p className="mt-2 text-body-sm text-fg-muted text-pretty">
        Free, and you don&rsquo;t need an Unbound account.
      </p>

      <div className="mt-8 flex flex-col gap-5">
        <Field label="Full name" htmlFor="fullName" error={fieldErrors.fullName}>
          <TextInput
            id="fullName"
            name="fullName"
            required
            autoComplete="name"
            placeholder="Ada Lovelace"
            value={values.fullName}
            onChange={set("fullName")}
            invalid={Boolean(fieldErrors.fullName)}
          />
        </Field>

        <Field label="Email" htmlFor="email" error={fieldErrors.email}>
          <TextInput
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@university.edu"
            value={values.email}
            onChange={set("email")}
            invalid={Boolean(fieldErrors.email)}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Age" htmlFor="age" error={fieldErrors.age}>
            <TextInput
              id="age"
              name="age"
              type="number"
              inputMode="numeric"
              min={10}
              max={120}
              required
              placeholder="17"
              value={values.age}
              onChange={set("age")}
              invalid={Boolean(fieldErrors.age)}
            />
          </Field>

          <Field
            label="Grade or year"
            htmlFor="gradeYear"
            error={fieldErrors.gradeYear}
          >
            <TextInput
              id="gradeYear"
              name="gradeYear"
              required
              placeholder="Grade 12"
              value={values.gradeYear}
              onChange={set("gradeYear")}
              invalid={Boolean(fieldErrors.gradeYear)}
            />
          </Field>
        </div>
      </div>

      {/* required on the input is what blocks submission in the browser; the
          action re-checks it, since a form post can skip the browser. */}
      <label className="mt-8 flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-canvas p-5">
        <input
          type="checkbox"
          name="committed"
          onChange={(event) => {
            if (event.target.checked) setCommitError(null);
          }}
          aria-describedby={commitMessage ? "committed-error" : undefined}
          className="mt-1 h-4 w-4 shrink-0 accent-white"
        />
        <span className="text-body-sm text-pretty">{COMMITMENT_LABEL}</span>
      </label>

      {commitMessage ? (
        <p
          id="committed-error"
          role="alert"
          className="mt-3 text-body-sm text-fg"
        >
          {commitMessage}
        </p>
      ) : null}

      {state.status === "error" && !state.fieldErrors ? (
        <p role="alert" className="mt-5 text-body-sm text-fg-muted">
          {state.message}
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <SubmitButton pending={pending}>Sign me up</SubmitButton>
        <p className="text-body-sm text-fg-subtle">
          We only use this to run the event.
        </p>
      </div>
    </form>
  );
}
