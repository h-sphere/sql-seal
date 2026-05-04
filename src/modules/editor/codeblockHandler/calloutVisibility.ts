/**
 * Returns the nearest collapsed callout ancestor of `el`, or null if `el` is
 * not inside a collapsed callout. Used to gate query execution until the user
 * expands the callout.
 */
export function findCollapsedCallout(el: Element): Element | null {
	const callout = el.closest('.callout');
	return callout?.classList.contains('is-collapsed') ? callout : null;
}
