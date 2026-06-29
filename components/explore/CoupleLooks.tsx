import { COUPLE_LOOKS } from '@/lib/couple-looks';

// Inspiration gallery of real couple looks (images from the prototype's couples folder).
// Purely presentational — shown when a couple-combo session is active, above the grid.
export function CoupleLooks() {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="font-display text-lg font-semibold text-ink">Couple Look Inspiration</h2>
        <p className="text-xs text-ink-muted">Coordinated bride & groom outfits to spark ideas.</p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {COUPLE_LOOKS.map((look) => (
          <div key={look.img} className="overflow-hidden rounded-[--radius-card] border border-border bg-surface">
            <div className="aspect-[3/4] w-full overflow-hidden bg-surface-soft">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={look.img} alt="Couple look" className="h-full w-full object-cover" />
            </div>
            <div className="flex flex-col gap-1 p-2.5 text-xs text-ink-secondary">
              <span>
                <span className="font-semibold text-ink">Bride:</span> {look.bride.color} {look.bride.garment}
              </span>
              <span>
                <span className="font-semibold text-ink">Groom:</span> {look.groom.color} {look.groom.garment}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
