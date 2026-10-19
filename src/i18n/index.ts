import pl from '../../data/i18n/pl.json';
import en from '../../data/i18n/en.json';
export type Language = 'pl' | 'en';
const dictionaries = { pl, en };
export type TranslationKey = keyof typeof pl;
export function translate(language: Language, key: TranslationKey): string {
  return dictionaries[language][key];
}
