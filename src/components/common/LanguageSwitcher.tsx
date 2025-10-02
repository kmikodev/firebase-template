/**
 * Language switcher component - Toggle between Spanish and English
 */
import { useTranslation } from 'react-i18next';

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'es' ? 'en' : 'es';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      title={t('profile.form.language')}
    >
      <span className="text-lg">🌐</span>
      <span className="hidden sm:inline">
        {i18n.language === 'es' ? 'ES' : 'EN'}
      </span>
    </button>
  );
}
