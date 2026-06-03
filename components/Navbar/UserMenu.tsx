'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

/**
 * UserMenu Component
 *
 * Authenticated-user control for the navbar:
 * - Static avatar (profile picture or initials fallback) + user name
 * - Opens a dropdown menu on hover OR click
 * - Menu: account header, Profile, My Orders, (Admin), Logout
 * - Closes on outside click, Escape, or route change
 * - Keyboard & screen-reader accessible
 */

/**
 * Derive up-to-two-letter initials from a display name.
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ProfileIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const OrdersIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export const Avatar = ({
  src,
  name,
  size = 'md',
}: {
  src: string | null;
  name: string;
  size?: 'md' | 'lg';
}) => {
  const dimensions = size === 'lg' ? 'h-10 w-10 text-sm' : 'h-9 w-9 text-xs';
  const [errored, setErrored] = useState(false);

  // Reset the error flag if the source changes (e.g. after re-login)
  useEffect(() => {
    setErrored(false);
  }, [src]);

  if (src && !errored) {
    return (
      <img
        src={src}
        alt={name}
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={() => setErrored(true)}
        className={`${dimensions} rounded-full object-cover border border-(--color-tertiary-button)`}
      />
    );
  }
  return (
    <div
      className={`${dimensions} rounded-full flex items-center justify-center font-bold bg-(--color-secondary-button) text-(--color-peace) select-none shrink-0`}
      aria-hidden="true"
    >
      {getInitials(name)}
    </div>
  );
};

export const UserMenu = ({ compact = false }: { compact?: boolean } = {}) => {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close the menu whenever the route changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on outside click / Escape while open
  useEffect(() => {
    if (!open) return;

    const handlePointer = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  // Clear any pending hover timer on unmount
  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  if (!user) return null;

  const openMenu = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setOpen(true);
  };

  // Small delay on mouse-leave prevents flicker when crossing the gap
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  };

  const handleLogout = async () => {
    setOpen(false);
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const menuItemClass =
    'flex items-center gap-3 px-4 py-2.5 text-sm text-(--color-foreground) hover:bg-(--color-background) hover:text-(--color-active) transition-colors duration-150';

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={compact ? undefined : openMenu}
      onMouseLeave={compact ? undefined : scheduleClose}
    >
      {compact ? (
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="
            flex items-center rounded-full
            border border-(--color-tertiary-button)
            hover:border-(--color-secondary-button)
            transition-colors duration-200
          "
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Account menu"
        >
          <Avatar src={user.profilePicture} name={user.name} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="
            flex items-center gap-2 pl-1 pr-2 py-1 rounded-full
            border border-(--color-tertiary-button)
            hover:border-(--color-secondary-button)
            transition-colors duration-200
          "
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label="Account menu"
        >
          <Avatar src={user.profilePicture} name={user.name} />
          <span className="text-sm font-semibold text-(--color-foreground) max-w-[10rem] truncate">
            {user.name}
          </span>
          <span className="text-(--color-inactive)">
            <ChevronIcon open={open} />
          </span>
        </button>
      )}

      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="
            absolute right-0 mt-2 w-64
            bg-(--color-peace) border border-(--color-tertiary-button)
            rounded-xl shadow-lg overflow-hidden
            origin-top-right z-50
          "
        >
          {/* Account header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-(--color-tertiary-button)">
            <Avatar src={user.profilePicture} name={user.name} size="lg" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-(--color-foreground) truncate">
                {user.name}
              </p>
              <p className="text-xs text-(--color-inactive) truncate">{user.email}</p>
            </div>
          </div>

          {/* Links */}
          <div className="py-1">
            <Link href="/profile" role="menuitem" className={menuItemClass}>
              <ProfileIcon />
              <span>Profile</span>
            </Link>
            <Link href="/orders" role="menuitem" className={menuItemClass}>
              <OrdersIcon />
              <span>My Orders</span>
            </Link>
          </div>

          {/* Logout */}
          <div className="py-1 border-t border-(--color-tertiary-button)">
            <button
              type="button"
              onClick={handleLogout}
              role="menuitem"
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-(--color-danger) hover:bg-(--color-danger)/10 transition-colors duration-150"
            >
              <LogoutIcon />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
