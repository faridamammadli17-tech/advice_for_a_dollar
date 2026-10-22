import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { SiteFooter } from './SiteFooter';
import { copy } from '../../content/placeholder';

/**
 * The help address in the footer (owner, 2026-10-22): one mailto link and one
 * line saying it is for trouble with the website, not for advice. No page,
 * no form, no route. The same day the Terms link and the "Get advice" link
 * left the footer, so those are checked here too.
 */

function footerHtml(): string {
  return renderToStaticMarkup(
    createElement(StaticRouter, { location: '/' }, createElement(SiteFooter)),
  );
}

describe('the footer help address', () => {
  it('is a mailto link to the help address', () => {
    const html = footerHtml();
    expect(copy.footer.helpEmail).toBe('help@adviceforadollar.org');
    expect(html).toContain(`href="mailto:${copy.footer.helpEmail}"`);
    expect(html).toContain(`>${copy.footer.helpEmail}<`);
  });

  it('says next to it that the address is not where advice is asked for', () => {
    const html = footerHtml();
    expect(html).toContain(copy.footer.helpNote);
    expect(copy.footer.helpNote.length).toBeGreaterThan(20);
    expect(copy.footer.helpNote.toLowerCase()).toContain('not');
    expect(copy.footer.helpNote.toLowerCase()).toContain('advice');
  });

  it('adds no help page, form or route: the address is the whole feature', () => {
    const html = footerHtml();
    expect(html).not.toMatch(/href="\/help/);
    expect(html).not.toContain('<form');
  });

  it('no longer links to Terms or to a separate Get advice page', () => {
    const html = footerHtml();
    expect(html).not.toContain('href="/terms"');
    expect(html).not.toContain('Get advice');
    expect(html).toContain('href="/privacy"');
    expect(html).toContain('href="/community-guidelines"');
  });
});
