import { useLanguage, type Lang } from '../i18n';

/** ENG / AZE, at the right end of the menu on every page. */
export function LanguageSwitch() {
  const { t, setLang } = useLanguage();
  return (
    <label className="lang-switch">
      <span className="sr-only">{t.ui.language.label}</span>
      <select
        className="lang-select"
        value={t.lang}
        onChange={(event) => setLang(event.target.value as Lang)}
      >
        <option value="en">{t.ui.language.en}</option>
        <option value="az">{t.ui.language.az}</option>
      </select>
    </label>
  );
}
