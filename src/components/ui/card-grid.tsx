import type { ReactNode } from "react";

/**
 * Cards laid out on a hairline grid.
 *
 * The dividers are the container's own background showing through 1px gaps,
 * which has one consequence worth naming: a cell that an incomplete final row
 * leaves empty shows the divider colour across its whole area, reading as a
 * solid grey block rather than a hairline. Three cards in the two-column
 * layout did exactly that for the entire 640-1023px range. The spacers below
 * fill whatever the final row leaves over, per layout.
 */
export function CardGrid({
  count,
  children,
  className = "",
}: {
  count: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      // [&>*]:min-w-0 is what actually lets a card hold long unbroken user
      // content. Grid items default to min-width:auto, so a 120-character name
      // or a bare URL sets the column's min-content width and widens the track
      // — and because the container clips, the overflow is silently cut off
      // rather than scrolling. break-words on the card alone can't fix that:
      // overflow-wrap doesn't feed back into intrinsic sizing.
      className={`grid gap-px overflow-hidden rounded-2xl border border-line bg-line [&>*]:min-w-0 sm:grid-cols-2 lg:grid-cols-3 ${className}`}
    >
      {children}
      {Array.from({ length: (2 - (count % 2)) % 2 }, (_, i) => (
        <div
          key={`two-col-${i}`}
          aria-hidden="true"
          className="hidden bg-canvas sm:block lg:hidden"
        />
      ))}
      {Array.from({ length: (3 - (count % 3)) % 3 }, (_, i) => (
        <div
          key={`three-col-${i}`}
          aria-hidden="true"
          className="hidden bg-canvas lg:block"
        />
      ))}
    </div>
  );
}
