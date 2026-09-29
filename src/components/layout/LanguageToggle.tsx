'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { useTransition } from 'react';
import { cn } from '@/lib/utils';

export function LanguageToggle({ className }: { className?: string }) {
  const t = useTranslations('languageToggle');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function switchLocale(next: 'en' | 'ar') {
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-full bg-[#F2F2F2] p-1',
        isPending && 'opacity-60 pointer-events-none',
        className,
      )}
      role="group"
      aria-label="Language selector"
    >
      <button
        onClick={() => switchLocale('en')}
        aria-pressed={locale === 'en'}
        aria-label={t('switchToEn')}
        className={cn(
          'rounded-full px-3 py-1 text-[13px] font-medium transition-all',
          locale === 'en'
            ? 'bg-[#026F4F] text-white shadow-sm'
            : 'text-[#686868] hover:text-[#2D2F33]',
        )}
      >
        {t('english')}
      </button>
      <button
        onClick={() => switchLocale('ar')}
        aria-pressed={locale === 'ar'}
        aria-label={t('switchToAr')}
        className={cn(
          'rounded-full px-3 py-1 text-[13px] font-medium transition-all',
          locale === 'ar'
            ? 'bg-[#026F4F] text-white shadow-sm'
            : 'text-[#686868] hover:text-[#2D2F33]',
        )}
      >
        {t('arabic')}
      </button>
    </div>
  );
}
