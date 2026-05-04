/**
 * @jest-environment jsdom
 *
 * Tests for the callout visibility gate.
 *
 * We test two things:
 *  1. findCollapsedCallout() — pure DOM logic that detects collapsed callouts
 *  2. MutationObserver integration — verifies that removing .is-collapsed
 *     triggers the deferred callback (proves the observer wiring works)
 */

import { jest } from '@jest/globals';
import { findCollapsedCallout } from './calloutVisibility';

// ─── DOM helpers ─────────────────────────────────────────────────────────────

function makeEl(parent?: HTMLElement): HTMLElement {
	const el = document.createElement('div');
	(parent ?? document.body).appendChild(el);
	return el;
}

function makeCallout(collapsed: boolean): { callout: HTMLElement; el: HTMLElement } {
	const callout = document.createElement('div');
	callout.classList.add('callout');
	if (collapsed) callout.classList.add('is-collapsed');
	document.body.appendChild(callout);
	const content = makeEl(callout);
	const el = makeEl(content);
	return { callout, el };
}

afterEach(() => {
	document.body.innerHTML = '';
});

// ─── findCollapsedCallout ─────────────────────────────────────────────────────

describe('findCollapsedCallout()', () => {
	it('returns null for element not inside any callout', () => {
		const el = makeEl();
		expect(findCollapsedCallout(el)).toBeNull();
	});

	it('returns null when inside an expanded callout', () => {
		const { el } = makeCallout(false);
		expect(findCollapsedCallout(el)).toBeNull();
	});

	it('returns the callout element when inside a collapsed callout', () => {
		const { callout, el } = makeCallout(true);
		expect(findCollapsedCallout(el)).toBe(callout);
	});

	it('returns null after .is-collapsed is removed', () => {
		const { callout, el } = makeCallout(true);
		callout.classList.remove('is-collapsed');
		expect(findCollapsedCallout(el)).toBeNull();
	});

	it('handles deeply nested elements inside collapsed callout', () => {
		const { callout, el } = makeCallout(true);
		const deep = makeEl(makeEl(makeEl(el)));
		expect(findCollapsedCallout(deep)).toBe(callout);
	});
});

// ─── MutationObserver wiring (integration) ───────────────────────────────────

describe('MutationObserver deferred-render pattern', () => {
	it('fires callback when .is-collapsed is removed from callout', async () => {
		const { callout, el } = makeCallout(true);

		const callback = jest.fn();

		// Replicate the wiring from CodeblockProcessor.onload()
		const observer = new MutationObserver(() => {
			if (!callout.classList.contains('is-collapsed')) {
				observer.disconnect();
				callback();
			}
		});
		observer.observe(callout, { attributes: true, attributeFilter: ['class'] });

		expect(callback).not.toHaveBeenCalled();

		callout.classList.remove('is-collapsed');
		await new Promise(r => setTimeout(r, 0));

		expect(callback).toHaveBeenCalledTimes(1);
	});

	it('does NOT fire callback when observer is disconnected before expansion', async () => {
		const { callout } = makeCallout(true);

		const callback = jest.fn();
		const observer = new MutationObserver(() => {
			if (!callout.classList.contains('is-collapsed')) {
				observer.disconnect();
				callback();
			}
		});
		observer.observe(callout, { attributes: true, attributeFilter: ['class'] });

		observer.disconnect(); // simulates component unload

		callout.classList.remove('is-collapsed');
		await new Promise(r => setTimeout(r, 0));

		expect(callback).not.toHaveBeenCalled();
	});

	it('fires callback only once even if class toggles multiple times', async () => {
		const { callout } = makeCallout(true);

		const callback = jest.fn();
		const observer = new MutationObserver(() => {
			if (!callout.classList.contains('is-collapsed')) {
				observer.disconnect(); // disconnect immediately — one-shot
				callback();
			}
		});
		observer.observe(callout, { attributes: true, attributeFilter: ['class'] });

		callout.classList.remove('is-collapsed');
		await new Promise(r => setTimeout(r, 0));

		callout.classList.add('is-collapsed');
		callout.classList.remove('is-collapsed');
		await new Promise(r => setTimeout(r, 0));

		expect(callback).toHaveBeenCalledTimes(1);
	});
});
