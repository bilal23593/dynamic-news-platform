type AdCreativeLike = {
  codeHtml?: string | null;
  imageUrl?: string | null;
  enabled?: boolean | null;
};

export function hasConfiguredAdCreative(slot: AdCreativeLike | null | undefined) {
  if (!slot) return false;

  return Boolean(slot.codeHtml?.trim() || slot.imageUrl?.trim());
}

export function isRenderableAdSlot(slot: AdCreativeLike | null | undefined) {
  if (!slot) return false;
  if (slot.enabled === false) return false;

  return hasConfiguredAdCreative(slot);
}
