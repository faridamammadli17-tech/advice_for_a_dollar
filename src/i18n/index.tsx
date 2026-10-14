import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { uiEn, type Ui } from './ui.en';
import { uiAz } from './ui.az';
import { copy, type Copy } from '../content/placeholder';
import { copyAz } from '../content/placeholder.az';
import {
  about,
  communityGuidelines,
  faq,
  howItWorks,
  privacy,
  terms,
  type StaticPage,
} from '../content/pages';
import {
  aboutAz,
  communityGuidelinesAz,
  faqAz,
  howItWorksAz,
  privacyAz,
  termsAz,
} from '../content/pages.az';

/**
 * Two languages, English and Azerbaijani, chosen from the switch at the top
 * right of every page. The choice is remembered in the browser; a first
 * visit follows the browser's language. Everything a visitor reads comes
 * through `useT()`; the owner's dashboard stays in English, being hers.
 */
export type Lang = 'en' | 'az';

export type PageSlug =
  | 'how-it-works'
  | 'about'
  | 'faq'
  | 'community-guidelines'
  | 'privacy'
  | 'terms';

export type Translation = {
  readonly lang: Lang;
  readonly ui: Ui;
  readonly copy: Copy;
  readonly pages: Readonly<Record<PageSlug, StaticPage>>;
  /** A category's label, or "Uncategorised" in the language. */
  readonly categoryLabel: (id: string | null) => string;
  readonly formatDate: (iso: string) => string;
};

const PAGES: Readonly<Record<Lang, Readonly<Record<PageSlug, StaticPage>>>> = {
  en: {
    'how-it-works': howItWorks,
    about,
    faq,
    'community-guidelines': communityGuidelines,
    privacy,
    terms,
  },
  az: {
    'how-it-works': howItWorksAz,
    about: aboutAz,
    faq: faqAz,
    'community-guidelines': communityGuidelinesAz,
    privacy: privacyAz,
    terms: termsAz,
  },
};

const STORAGE_KEY = 'afad:lang';

function readStoredLang(): Lang | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'en' || stored === 'az' ? stored : null;
  } catch {
    return null;
  }
}

function initialLang(): Lang {
  const stored = readStoredLang();
  if (stored !== null) return stored;
  const browser = typeof navigator === 'undefined' ? '' : navigator.language.toLowerCase();
  return browser.startsWith('az') ? 'az' : 'en';
}

function build(lang: Lang): Translation {
  const ui = lang === 'az' ? uiAz : uiEn;
  const categories = ui.categories as Readonly<Record<string, string>>;
  return {
    lang,
    ui,
    copy: lang === 'az' ? copyAz : copy,
    pages: PAGES[lang],
    categoryLabel: (id) =>
      id === null ? ui.categories.uncategorised : (categories[id] ?? ui.categories.uncategorised),
    formatDate: (iso) => new Date(iso).toLocaleDateString(ui.locale),
  };
}

type LanguageContextValue = { readonly t: Translation; readonly setLang: (lang: Lang) => void };

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private browsing can refuse; the choice simply will not survive a reload.
    }
  }, []);

  const value = useMemo(() => ({ t: build(lang), setLang }), [lang, setLang]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useT(): Translation {
  const context = useContext(LanguageContext);
  if (context === null) throw new Error('useT needs a LanguageProvider above it.');
  return context.t;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (context === null) throw new Error('useLanguage needs a LanguageProvider above it.');
  return context;
}
