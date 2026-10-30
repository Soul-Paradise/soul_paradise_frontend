/**
 * Stands in for a page hero the admin has hidden, so the first section does
 * not sit flush under the navbar (it would otherwise overlap the missing photo).
 */
export function HeroSpacer() {
  return <div className="h-10 sm:h-14" aria-hidden="true" />;
}
