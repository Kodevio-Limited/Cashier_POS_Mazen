'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import AuthShell from '@/components/auth/AuthShell';
import { AuthHeader, AuthField, AuthInput, AuthButton } from '@/components/auth/AuthFields';
import { getAuthSession, setAuthSession } from '@/lib/auth-session';
import { getActiveShift } from '@/lib/shift-session';

export default function LoginPage() {
  const t = useTranslations('auth.login');
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Already signed in → skip the login screen.
  useEffect(() => {
    if (getAuthSession()) {
      router.replace(getActiveShift() ? '/floor-plan' : '/shift');
    }
  }, [router]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Mock auth: any non-empty credentials sign the cashier in.
    setAuthSession(email.trim());
    // A running shift goes straight to the floor plan; otherwise start one.
    router.replace(getActiveShift() ? '/floor-plan' : '/shift');
  }

  return (
    <AuthShell
      photo="/images/figma/auth/signin.webp"
      photoAlt="Waiter taking an order at a restaurant table"
    >
      <form
        onSubmit={handleSubmit}
        className="flex w-full flex-col gap-[clamp(32px,3.13vw,60.34px)]"
      >
        <div className="flex w-full flex-col items-center gap-[clamp(36px,3.49vw,67px)]">
          <AuthHeader title={t('title')} subtitle={t('subtitle')} />

          <div className="flex w-full flex-col gap-[clamp(18px,1.57vw,30.223px)]">
            <AuthField label={t('emailLabel')}>
              <AuthInput
                icon="/images/figma/auth/mail.svg"
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder={t('emailPlaceholder')}
                autoComplete="email"
              />
            </AuthField>

            <AuthField label={t('passwordLabel')}>
              <AuthInput
                icon="/images/figma/auth/lock.svg"
                type="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder={t('passwordPlaceholder')}
                toggle
                autoComplete="current-password"
              />
            </AuthField>
          </div>
        </div>

        <button type="submit" className="group flex w-full">
          <AuthButton>{t('signIn')}</AuthButton>
        </button>
      </form>
    </AuthShell>
  );
}
