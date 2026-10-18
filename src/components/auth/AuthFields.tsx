'use client';

import { useState } from 'react';
import Image from 'next/image';

// Figma 1999:2606+ — label 28.712px Satoshi Medium, 12.089px gap, #E9E9E9
// pill input with 36.268px leading icon and 36.268px visibility toggle.
// Sizes clamp to the exact Figma px at a 1920 viewport.

export function AuthHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex w-full flex-col items-center gap-[clamp(8px,0.79vw,15.112px)] text-center">
      <h1 className="w-full font-satoshi text-[clamp(30px,2.6vw,49.869px)] font-bold leading-[1.4] text-[#2D2F33]">
        {title}
      </h1>
      <p className="w-full max-w-[545px] font-satoshi text-[clamp(15px,1.26vw,24.179px)] font-normal leading-[1.4] text-[#888888]">
        {subtitle}
      </p>
    </div>
  );
}

export function AuthField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex w-full flex-col gap-[clamp(7px,0.63vw,12.089px)]">
      <span className="font-satoshi text-[clamp(17px,1.5vw,28.712px)] font-medium leading-[1.4] text-[#2D2F33]">
        {label}
      </span>
      {children}
    </div>
  );
}

interface AuthInputProps {
  icon: string;
  type?: 'text' | 'email' | 'password';
  placeholder?: string;
  toggle?: boolean;
  autoComplete?: string;
  name?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}

export function AuthInput({
  icon,
  type = 'email',
  placeholder,
  toggle,
  autoComplete,
  name,
  value,
  onChange,
  required,
}: AuthInputProps) {
  const [show, setShow] = useState(false);
  const inputType = toggle ? (show ? 'text' : 'password') : type;

  return (
    <div className="flex w-full items-center gap-[clamp(8px,0.63vw,12.089px)] rounded-[clamp(24px,1.89vw,36.268px)] bg-[#E9E9E9] p-[clamp(14px,1.26vw,24.179px)]">
      <Image
        src={icon}
        alt=""
        aria-hidden="true"
        width={36}
        height={36}
        className="size-[clamp(22px,1.89vw,36.268px)] shrink-0"
      />
      <input
        type={inputType}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="min-w-0 flex-1 bg-transparent font-satoshi text-[clamp(15px,1.26vw,24.179px)] font-medium leading-[1.4] text-[#2D2F33] outline-none placeholder:text-[#989898]"
      />
      {toggle && (
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? 'Show password' : 'Hide password'}
          className="shrink-0 cursor-pointer"
        >
          <Image
            src="/images/figma/auth/visibility-off.svg"
            alt=""
            aria-hidden="true"
            width={36}
            height={36}
            className="size-[clamp(22px,1.89vw,36.268px)]"
          />
        </button>
      )}
    </div>
  );
}

// Figma 1999:2626 — h-89.005 rounded-30 #026F4F, Satoshi Medium 28.66px,
// drop-shadow 0 6.034 12.295 rgba(0,0,0,0.12).
export function AuthButton({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-[clamp(56px,4.64vw,89.005px)] w-full items-center justify-center rounded-[30px] bg-[#026F4F] px-6 font-satoshi text-[clamp(18px,1.49vw,28.66px)] font-medium leading-[1.4] text-white drop-shadow-[0px_6.034px_12.295px_rgba(0,0,0,0.12)] transition-colors group-hover:bg-[#025E43]">
      {children}
    </span>
  );
}
