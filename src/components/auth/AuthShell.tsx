import Image from 'next/image';
import { LanguageToggle } from '@/components/layout/LanguageToggle';

interface AuthShellProps {
  photo: string;
  photoAlt: string;
  children: React.ReactNode;
}

// Figma 1590:1364 — 1920-wide frame: 23px page padding, two 930×1033 rounded-12
// panels with a 14px gap (left photo on #FFD0B0, right white form column).
// Text/input sizes use clamp() so they hit the exact Figma px at 1920 and scale
// down gracefully on tablets.
//
// `photo` points at the Figma export of the photo panel itself (already cropped
// exactly as Figma fills it), so a plain cover reproduces the design 1:1.
export default function AuthShell({ photo, photoAlt, children }: AuthShellProps) {
  return (
    <div className="relative min-h-screen w-full bg-white">
      <div className="absolute end-[16px] top-[16px] z-20 lg:end-[23px] lg:top-[23px]">
        <LanguageToggle />
      </div>
      <div className="flex min-h-screen flex-col items-stretch lg:flex-row lg:gap-[14px] lg:p-[23px]">
        <div className="relative hidden w-[49.63%] max-w-[930px] shrink-0 overflow-hidden rounded-[12px] bg-[#FFD0B0] lg:block">
          <Image src={photo} alt={photoAlt} fill priority sizes="48vw" className="object-cover" />
        </div>
        <div className="flex min-h-screen min-w-0 flex-1 items-center justify-center bg-white lg:min-h-0">
          <div className="w-full min-w-0 max-w-[617px] px-6 py-20 sm:px-10 lg:px-0 lg:py-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
