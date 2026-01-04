import zhCN from './zh-CN';
import en from './en';

export type Locale = 'zh-CN' | 'en';
export type Messages = typeof zhCN;

export const locales: Record<Locale, Messages> = {
  'zh-CN': zhCN,
  en,
};

export const SUPPORTED_LOCALES: Locale[] = ['zh-CN', 'en'];

export { zhCN, en };
