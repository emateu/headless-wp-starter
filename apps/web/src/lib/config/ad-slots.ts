export type AdSlotPosition =
  | "header-leaderboard"
  | "sidebar-top"
  | "sidebar-bottom"
  | "between-sections"
  | "article-mid"
  | "article-bottom";

export interface AdSlotConfig {
  width: number;
  height: number;
}

export const adSlots: Record<AdSlotPosition, AdSlotConfig> = {
  "header-leaderboard": { width: 728, height: 90 },
  "sidebar-top": { width: 300, height: 250 },
  "sidebar-bottom": { width: 300, height: 600 },
  "between-sections": { width: 728, height: 90 },
  "article-mid": { width: 728, height: 90 },
  "article-bottom": { width: 728, height: 90 },
};

/** Insert an ad after this many slices in article body */
export const articleAdInsertAfterSlice = 3;
