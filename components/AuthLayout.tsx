'use client';

import Link from 'next/link';
import BackgroundVideo from '@/components/BackgroundVideo';

/**
 * Shared frame for the login and registration pages so they read as one flow:
 * the video alone on the left, and on the right a card with the same header
 * (title, subtitle), the page's form, and a footer for the
 * "already have an account / register instead" links.
 *
 * The form panel scrolls on its own, so long forms (partner signup) work on
 * short screens without moving the video.
 */
export default function AuthLayout({
  video,
  title,
  subtitle,
  footer,
  children,
}: {
  video: string;
  title: string;
  subtitle: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen max-h-screen bg-(--color-background)">
      {/* Video, dimmed evenly so the logo reads clearly on any frame */}
      <div className="relative hidden overflow-hidden lg:flex lg:flex-3">
        <BackgroundVideo src={video} />
        <div className="pointer-events-none absolute inset-0 bg-black/35" aria-hidden="true" />
        <LogoLink
          className="absolute left-8 top-6 z-10"
          imgClassName="h-28 xl:h-32 [filter:drop-shadow(0_0_3px_rgba(255,255,255,0.95))_drop-shadow(0_0_12px_rgba(255,255,255,0.8))]"
        />
      </div>

      <div className="relative flex-2 overflow-y-auto">
        {/* Soft colour behind the card, clipped to the panel: unclipped, the
            off-edge blobs add empty scroll area to the panel. */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <span className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-400/15 blur-3xl" />
          <span className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-orange-400/10 blur-3xl" />
        </div>

        {/* No video on small screens, so the logo sits above the form there */}
        <LogoLink className="absolute left-4 top-3 z-10 sm:left-6 sm:top-4 lg:hidden" />

        {/* Spacing is kept tight on purpose: every form must fit a laptop
            screen without the panel scrolling. */}
        <div className="relative flex min-h-full items-center justify-center px-4 pb-4 pt-16 sm:px-8 lg:py-3">
          <div className="animate-fade-up w-full max-w-[460px] rounded-2xl bg-(--color-peace) px-6 py-5 shadow-xl ring-1 ring-(--color-tertiary-button) sm:px-7">
            <div className="mb-4">
              <h1 className="text-2xl font-extrabold tracking-tight text-(--color-foreground) xl:text-3xl">{title}</h1>
              <p className="mt-1 text-sm text-(--color-inactive)">{subtitle}</p>
            </div>

            {children}

            {footer && (
              <div className="mt-4 space-y-0.5 border-t border-(--color-tertiary-button) pt-3 text-center">{footer}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LogoLink({
  className,
  imgClassName = 'h-10 sm:h-12',
}: {
  className: string;
  imgClassName?: string;
}) {
  return (
    // Clickable (goes home) but not draggable, and the image takes no pointer
    // events, so it behaves like part of the page rather than a loose picture
    // that can be dragged out or opened on its own in a new tab.
    <Link
      href="/"
      aria-label="Soul Paradise home"
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      className={`block w-fit select-none transition-transform duration-200 hover:scale-105 active:scale-95 ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- same plain logo as components/Logo */}
      <img
        src="/logo.png"
        alt="Soul Paradise"
        draggable={false}
        className={`pointer-events-none w-auto ${imgClassName}`}
      />
    </Link>
  );
}

/** The "Or" rule between Google sign-in and the email form. */
export function AuthDivider() {
  return (
    <div className="relative py-2">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-(--color-tertiary-button)" />
      </div>
      <div className="relative flex justify-center text-xs">
        <span className="bg-(--color-peace) px-2 font-medium text-(--color-inactive)">Or</span>
      </div>
    </div>
  );
}

/** Footer line like "Already have an account? Sign in". */
export function AuthFooterLink({ question, href, action }: { question: string; href: string; action: string }) {
  return (
    <p className="text-sm text-(--color-foreground)">
      {question}{' '}
      <Link href={href} className="font-semibold text-(--color-links) transition-colors duration-200 hover:opacity-80">
        {action}
      </Link>
    </p>
  );
}
