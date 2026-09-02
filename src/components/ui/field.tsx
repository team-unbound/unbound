import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

const controlClass =
  "w-full rounded-lg border border-line bg-surface px-4 py-3 text-body text-fg placeholder:text-fg-subtle transition-colors hover:border-line-strong focus:border-fg focus:outline-none disabled:opacity-50 aria-[invalid=true]:border-fg-muted";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  optional,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="flex items-baseline gap-2 text-body-sm">
        {label}
        {optional ? (
          <span className="text-body-sm text-fg-subtle">Optional</span>
        ) : null}
      </label>
      {children}
      {hint && !error ? (
        <p className="text-body-sm text-fg-subtle">{hint}</p>
      ) : null}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-body-sm text-fg">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TextInput({
  invalid,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      {...props}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? `${props.id}-error` : undefined}
      className={`${controlClass} ${className}`}
    />
  );
}

export function TextArea({
  invalid,
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      {...props}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? `${props.id}-error` : undefined}
      className={`${controlClass} resize-y ${className}`}
    />
  );
}

export function SubmitButton({
  pending,
  children,
  className = "",
}: {
  pending: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center justify-center gap-2 rounded-full bg-fg px-7 py-3 text-body-sm font-medium text-canvas transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {pending ? "Working…" : children}
    </button>
  );
}
