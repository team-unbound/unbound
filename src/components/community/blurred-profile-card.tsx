/**
 * Purely decorative placeholder — no member data is fetched for these, so
 * there's nothing here for devtools to read. The blur is applied to generic
 * skeleton shapes, not to real content.
 */
export function BlurredProfileCard({ variant = 0 }: { variant?: number }) {
  // A little shape variation so the row doesn't look identically stamped out.
  const bioLines = variant % 3 === 0 ? 2 : variant % 3 === 1 ? 3 : 1;
  const nameWidth = ["w-32", "w-28", "w-36"][variant % 3];

  return (
    <article
      aria-hidden="true"
      className="relative flex h-full flex-col overflow-hidden bg-canvas p-8 lg:p-10"
    >
      <div className="flex select-none flex-col blur-md">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 shrink-0 rounded-full border border-line-strong bg-surface" />
          <div className="min-w-0 flex-1">
            <div className={`h-4 rounded-full bg-line-strong ${nameWidth}`} />
            <div className="mt-2 h-3 w-24 rounded-full bg-line" />
            <div className="mt-2 h-3 w-20 rounded-full bg-line" />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          {Array.from({ length: bioLines }).map((_, i) => (
            <div
              key={i}
              className="h-3 rounded-full bg-line"
              style={{ width: `${85 - i * 18}%` }}
            />
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <div className="h-6 w-16 rounded-full border border-line" />
          <div className="h-6 w-12 rounded-full border border-line" />
        </div>
      </div>

      {/* Scrim keeps the blurred shapes from reading as legible content. */}
      <div className="pointer-events-none absolute inset-0 bg-canvas/40" />
    </article>
  );
}
