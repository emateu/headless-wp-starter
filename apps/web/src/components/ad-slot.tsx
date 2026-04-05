import { type AdSlotPosition, adSlots } from "~/lib/config/ad-slots";
import { labels } from "~/lib/config/labels";
import { cn } from "~/lib/utils";

interface AdSlotProps {
  slot: AdSlotPosition;
  className?: string;
}

export function AdSlot({ slot, className }: AdSlotProps) {
  const config = adSlots[slot];

  return (
    <aside
      className={cn(
        "mx-auto flex items-center justify-center border-2 border-dashed border-muted-foreground/25 bg-muted/50 text-xs text-muted-foreground",
        className,
      )}
      style={{ maxWidth: config.width, height: config.height }}
      aria-label={labels.ads.label}
    >
      <span>
        {labels.ads.label} — {config.width}x{config.height}
      </span>
    </aside>
  );
}
