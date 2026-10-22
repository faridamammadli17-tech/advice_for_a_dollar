import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SafetyInterstitial } from './SafetyInterstitial';
import { EMERGENCY_LINK } from '../content/crisis';

/**
 * The safety screen's one emergency resource is a link (owner, 2026-10-22):
 * no phone numbers at all. These tests are the executable half of the gate
 * in scripts/preflight.ts: the address is a real https:// one, the screen
 * renders it as a link that opens in a new tab, and nothing on the screen
 * looks like a phone number.
 */

function screenHtml(category: Parameters<typeof SafetyInterstitial>[0]['category']): string {
  return renderToStaticMarkup(createElement(SafetyInterstitial, { category, onBack: () => {} }));
}

describe('the emergency link', () => {
  it('is a non-empty https:// address', () => {
    expect(EMERGENCY_LINK.url).toMatch(/^https:\/\/[^\s/]+\.[^\s/]+/);
    expect(EMERGENCY_LINK.label.trim().length).toBeGreaterThan(0);
  });

  it('is rendered by the safety screen as a link that opens in a new tab', () => {
    const html = screenHtml('self_harm');
    expect(html).toContain(`href="${EMERGENCY_LINK.url}"`);
    expect(html).toMatch(/<a[^>]*href="https:\/\/emergencynumbers\.org"[^>]*target="_blank"/);
    expect(html).toMatch(
      /<a[^>]*href="https:\/\/emergencynumbers\.org"[^>]*rel="noopener noreferrer"/,
    );
    expect(html).toContain(EMERGENCY_LINK.label);
    // The address itself is the visible text, so it can be read out or typed.
    expect(html.replace(/<wbr\s*\/?>/g, '')).toContain(`>${EMERGENCY_LINK.url}<`);
  });

  it('shows no phone numbers, placeholder or otherwise', () => {
    for (const category of ['self_harm', 'medical_emergency', 'minor_safety', null] as const) {
      const text = screenHtml(category).replace(/<[^>]+>/g, ' ');
      expect(text).not.toMatch(/\d[\d\s-]{5,}\d/);
      expect(text).not.toMatch(/tel:/);
      expect(text).not.toMatch(/placeholder/i);
    }
  });

  it('still keeps the visitor’s words and the way back', () => {
    const html = screenHtml('imminent_danger');
    expect(html).toContain('What you wrote is still here.');
    expect(html).toContain('Go back to what I wrote');
  });
});
