import { useTranslation } from 'react-i18next';

function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language;
  return (
    <div className="language-switcher" role="group" aria-label={t('Language')}>
      <button type="button" className={language === 'en' ? 'active' : ''} onClick={() => i18n.changeLanguage('en')} aria-pressed={language === 'en'}>EN</button>
      <span aria-hidden="true">/</span>
      <button type="button" className={language === 'bg' ? 'active' : ''} onClick={() => i18n.changeLanguage('bg')} aria-pressed={language === 'bg'}>BG</button>
    </div>
  );
}

export default LanguageSwitcher;
