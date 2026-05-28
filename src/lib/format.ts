export const toTitleCase = (s: string | null | undefined): string =>
  (s ?? "").replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
