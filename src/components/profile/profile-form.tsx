"use client";

import { useActionState } from "react";
import {
  saveProfile,
  type ProfileFormState,
} from "@/app/onboarding/actions";
import { Field, SubmitButton, TextArea, TextInput } from "@/components/ui/field";
import { MAX_TAGS } from "@/lib/validation";
import type { Profile } from "@/db/schema";

const initialState: ProfileFormState = { status: "idle" };

export function ProfileForm({
  profile,
  submitLabel = "Save profile",
  redirectTo,
}: {
  profile?: Profile | null;
  submitLabel?: string;
  /** Where to send the user after a successful save (must be a local path). */
  redirectTo?: string;
}) {
  const [state, formAction, pending] = useActionState(
    saveProfile,
    initialState,
  );
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={formAction} noValidate className="flex flex-col gap-6">
      {redirectTo ? (
        <input type="hidden" name="redirectTo" value={redirectTo} />
      ) : null}

      <Field label="Full name" htmlFor="fullName" error={errors.fullName}>
        <TextInput
          id="fullName"
          name="fullName"
          required
          defaultValue={profile?.fullName ?? ""}
          autoComplete="name"
          placeholder="Ada Lovelace"
          invalid={Boolean(errors.fullName)}
        />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          label="Grade / year"
          htmlFor="gradeYear"
          optional
          error={errors.gradeYear}
        >
          <TextInput
            id="gradeYear"
            name="gradeYear"
            defaultValue={profile?.gradeYear ?? ""}
            placeholder="2nd year"
            invalid={Boolean(errors.gradeYear)}
          />
        </Field>

        <Field
          label="School or university"
          htmlFor="school"
          optional
          error={errors.school}
        >
          <TextInput
            id="school"
            name="school"
            defaultValue={profile?.school ?? ""}
            placeholder="University of Toronto"
            invalid={Boolean(errors.school)}
          />
        </Field>
      </div>

      <Field
        label="What are you building?"
        htmlFor="profession"
        optional
        hint="Your profession, side project, or the thing you can't stop thinking about."
        error={errors.profession}
      >
        <TextInput
          id="profession"
          name="profession"
          defaultValue={profile?.profession ?? ""}
          placeholder="Designer — building a study-group app"
          invalid={Boolean(errors.profession)}
        />
      </Field>

      <Field
        label="Short bio"
        htmlFor="bio"
        optional
        hint="A few lines. What you're into, what you want out of this."
        error={errors.bio}
      >
        <TextArea
          id="bio"
          name="bio"
          rows={4}
          maxLength={600}
          defaultValue={profile?.bio ?? ""}
          invalid={Boolean(errors.bio)}
        />
      </Field>

      <Field
        label="Fun facts"
        htmlFor="funFacts"
        optional
        hint="Something people wouldn't guess."
        error={errors.funFacts}
      >
        <TextArea
          id="funFacts"
          name="funFacts"
          rows={3}
          maxLength={400}
          defaultValue={profile?.funFacts ?? ""}
          invalid={Boolean(errors.funFacts)}
        />
      </Field>

      <Field
        label="Tags"
        htmlFor="tags"
        optional
        hint={`Comma separated, up to ${MAX_TAGS}. e.g. react, design, fintech`}
        error={errors.tags}
      >
        <TextInput
          id="tags"
          name="tags"
          defaultValue={profile?.tags?.join(", ") ?? ""}
          placeholder="react, design, fintech"
          invalid={Boolean(errors.tags)}
        />
      </Field>

      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-surface p-5">
        <input
          type="checkbox"
          name="openToPairing"
          defaultChecked={profile?.openToPairing ?? true}
          className="mt-1 h-4 w-4 accent-white"
        />
        <span>
          <span className="block text-body-sm">
            Open to pairing up for events
          </span>
          <span className="mt-1 block text-body-sm text-fg-muted">
            Other members can send you a pairing request. You choose whether to
            accept — your email is only shared if you do.
          </span>
        </span>
      </label>

      {state.status === "error" && !state.fieldErrors ? (
        <p role="alert" className="text-body-sm text-fg-muted">
          {state.message}
        </p>
      ) : null}

      {state.status === "success" ? (
        <p role="status" className="text-body-sm text-fg">
          Saved.
        </p>
      ) : null}

      <div>
        <SubmitButton pending={pending}>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
