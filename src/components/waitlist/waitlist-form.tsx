"use client";

import { useEffect, useRef, useState, type SubmitEvent } from "react";
import {
  Field,
  SelectInput,
  SubmitButton,
  TextArea,
  TextInput,
} from "@/components/ui/field";
import {
  PHONE_LABELS,
  PHONE_TYPES,
  WAITLIST_LABELS as LABELS,
  WAITLIST_MAX,
  type WaitlistResponse,
} from "@/lib/waitlist";

const COPY = {
  success: "you're in. we'll hit you up when the app's ready.",
  already: "you're already on the list. nothing else to do.",
  invalidEmail: "that email doesn't look right.",
  missingName: "we need your name.",
  rateLimited: "slow down a sec. try again in a few minutes.",
  error: "something broke on our end. try again in a bit.",
} as const;

type Done = "success" | "already";

export function WaitlistForm() {
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState<Done | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  // When the form became usable, for the server's minimum-fill-time check.
  const loadedAt = useRef(0);
  const doneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadedAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (done) doneRef.current?.focus();
  }, [done]);

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const value = (name: string) => String(data.get(name) ?? "");

    // noValidate is on so errors render in the site's own style; these are
    // the two checks that would otherwise have been the browser's. Lengths
    // are already held by maxLength on each control.
    const errors: Record<string, string> = {};
    const emailInput = form.elements.namedItem("email") as HTMLInputElement;
    if (!value("email").trim() || !emailInput.validity.valid) {
      errors.email = COPY.invalidEmail;
    }
    if (!value("fullName").trim()) errors.fullName = COPY.missingName;

    setFieldErrors(errors);
    setMessage(null);
    if (Object.keys(errors).length > 0) {
      form.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: value("email"),
          fullName: value("fullName"),
          roleText: value("roleText"),
          building: value("building"),
          city: value("city"),
          school: value("school"),
          heardFrom: value("heardFrom"),
          phoneType: value("phoneType"),
          is17Plus: data.get("is17Plus") === "on",
          website: value("website"),
          loadedAt: loadedAt.current,
          sentAt: Date.now(),
        }),
      });
      const result = (await response.json()) as WaitlistResponse;

      switch (result.status) {
        case "success":
        case "already":
          setDone(result.status);
          return;
        case "rate_limited":
          setMessage(COPY.rateLimited);
          return;
        case "invalid":
          if (result.field === "email") {
            setFieldErrors({ email: COPY.invalidEmail });
          } else if (result.field === "fullName") {
            setFieldErrors({ fullName: COPY.missingName });
          } else {
            // Only reachable past the form's own limits; no copy for it, so
            // the field is marked without a message.
            setFieldErrors({ [result.field]: "" });
          }
          return;
        default:
          setMessage(COPY.error);
      }
    } catch {
      setMessage(COPY.error);
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <div
        ref={doneRef}
        role="status"
        tabIndex={-1}
        className="rounded-2xl border border-line bg-surface p-8 focus:outline-none lg:p-10"
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
        <p className="mt-6 text-h3 font-medium text-pretty">
          {done === "success" ? COPY.success : COPY.already}
        </p>
      </div>
    );
  }

  const invalid = (name: string) => name in fieldErrors;
  const errorFor = (name: string) => fieldErrors[name] || undefined;

  return (
    <form
      onSubmit={submit}
      // Before hydration a submit falls through to a plain POST of the page,
      // which keeps the answers out of the URL.
      method="post"
      noValidate
      className="rounded-2xl border border-line bg-surface p-8 lg:p-10"
    >
      <div className="flex flex-col gap-5">
        <Field label={LABELS.email} htmlFor="email" error={errorFor("email")}>
          <TextInput
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            maxLength={WAITLIST_MAX.email}
            invalid={invalid("email")}
          />
        </Field>

        <Field label={LABELS.fullName} htmlFor="fullName" error={errorFor("fullName")}>
          <TextInput
            id="fullName"
            name="fullName"
            required
            autoComplete="name"
            maxLength={WAITLIST_MAX.fullName}
            invalid={invalid("fullName")}
          />
        </Field>

        <Field label={LABELS.roleText} htmlFor="roleText">
          <TextInput
            id="roleText"
            name="roleText"
            maxLength={WAITLIST_MAX.roleText}
            placeholder="founder, student, investor, whatever fits"
            invalid={invalid("roleText")}
          />
        </Field>

        <Field label={LABELS.building} htmlFor="building">
          <TextArea
            id="building"
            name="building"
            rows={3}
            maxLength={WAITLIST_MAX.building}
            placeholder="nothing yet is a valid answer"
            invalid={invalid("building")}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={LABELS.city} htmlFor="city">
            <TextInput
              id="city"
              name="city"
              autoComplete="address-level2"
              maxLength={WAITLIST_MAX.city}
              invalid={invalid("city")}
            />
          </Field>

          <Field label={LABELS.school} htmlFor="school">
            <TextInput
              id="school"
              name="school"
              autoComplete="organization"
              maxLength={WAITLIST_MAX.school}
              invalid={invalid("school")}
            />
          </Field>
        </div>

        <Field label={LABELS.heardFrom} htmlFor="heardFrom">
          <TextInput
            id="heardFrom"
            name="heardFrom"
            maxLength={WAITLIST_MAX.heardFrom}
            invalid={invalid("heardFrom")}
          />
        </Field>

        <Field label={LABELS.phoneType} htmlFor="phoneType">
          <SelectInput
            id="phoneType"
            name="phoneType"
            defaultValue=""
            invalid={invalid("phoneType")}
          >
            <option value="" />
            {PHONE_TYPES.map((type) => (
              <option key={type} value={type}>
                {PHONE_LABELS[type]}
              </option>
            ))}
          </SelectInput>
        </Field>
      </div>

      <label className="mt-8 flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-canvas p-5">
        <input
          type="checkbox"
          name="is17Plus"
          className="mt-1 h-4 w-4 shrink-0 accent-white"
        />
        <span className="text-body-sm text-pretty">{LABELS.is17Plus}</span>
      </label>

      {/* Honeypot. Off-screen rather than display:none, so bots that skip
          hidden inputs still fill it; out of the tab order and the
          accessibility tree, so no real visitor ever reaches it. */}
      <div
        aria-hidden="true"
        className="absolute -left-[9999px] h-px w-px overflow-hidden"
      >
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {message ? (
        <p role="alert" className="mt-5 text-body-sm text-fg-muted">
          {message}
        </p>
      ) : null}

      <div className="mt-8">
        <SubmitButton pending={pending} pendingLabel="Join the waitlist">
          Join the waitlist
        </SubmitButton>
      </div>
    </form>
  );
}
