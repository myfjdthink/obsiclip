import { ref, computed } from 'vue';
import { locales, SUPPORTED_LOCALES, type Locale, type Messages } from '@/locales';
import { getLocale as getStoredLocale, saveLocale as saveStoredLocale } from '@/utils/storage';

// 当前语言
const currentLocale = ref<Locale>('zh-CN');
let initialized = false;

// 检测浏览器语言
export function detectBrowserLocale(): Locale {
  const browserLang = navigator.language;

  // 中文优先匹配
  if (browserLang.startsWith('zh')) {
    return 'zh-CN';
  }

  // 其他语言默认英文
  return 'en';
}

// 获取当前语言
export function getLocale(): Locale {
  return currentLocale.value;
}

// 设置语言
export function setLocale(locale: Locale): void {
  if (SUPPORTED_LOCALES.includes(locale)) {
    currentLocale.value = locale;
  }
}

// 设置语言并保存到存储
export async function setLocaleAndSave(locale: Locale): Promise<void> {
  setLocale(locale);
  await saveStoredLocale(locale);
}

// 初始化语言（从存储或浏览器检测）
export async function initLocale(): Promise<Locale> {
  if (initialized) {
    return currentLocale.value;
  }

  const storedLocale = await getStoredLocale();
  if (storedLocale) {
    setLocale(storedLocale);
  } else {
    // 首次安装，检测浏览器语言
    const detected = detectBrowserLocale();
    setLocale(detected);
    await saveStoredLocale(detected);
  }

  initialized = true;
  return currentLocale.value;
}

// 获取当前语言包
function getMessages(): Messages {
  return locales[currentLocale.value];
}

// 翻译函数 - 支持嵌套 key
export function t(key: string): string {
  const messages = getMessages();
  const keys = key.split('.');

  let result: unknown = messages;
  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = (result as Record<string, unknown>)[k];
    } else {
      console.warn(`[i18n] Missing translation: ${key}`);
      return key;
    }
  }

  return typeof result === 'string' ? result : key;
}

// Vue composable
export function useI18n() {
  const locale = computed(() => currentLocale.value);

  return {
    locale,
    t,
    setLocale,
    setLocaleAndSave,
    getLocale,
    initLocale,
    SUPPORTED_LOCALES,
  };
}
