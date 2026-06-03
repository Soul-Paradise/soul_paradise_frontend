'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { NavbarProps } from './types';
import { UserMenu } from './UserMenu';

/**
 * Navbar Component
 *
 * A professional, responsive top navigation bar
 * Features:
 * - Left: Logo/Icon
 * - Center: Navigation links
 * - Right: Login/Register or Logout buttons
 * - Fully responsive with mobile hamburger menu
 * - Active state highlighting
 * - Smooth animations and transitions
 */
export const Navbar = ({ items, className = '' }: NavbarProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);

  /**
   * Prevent body scroll when mobile menu is open
   */
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  /**
   * Determines if a nav item is currently active
   */
  const isActiveRoute = (href: string): boolean => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  /**
   * Close mobile menu when navigating
   */
  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav
      className={`
        fixed top-0 left-0 right-0 z-50
        bg-(--color-peace) border-b border-(--color-tertiary-button)
        ${className}
      `}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: Hamburger (mobile, hard left) + Logo */}
          <div className="flex items-center gap-1">
            {/* Mobile Menu Button - hard left */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="
                md:hidden p-2 -ml-2 rounded-lg
                text-(--color-foreground) hover:bg-(--color-background)
                transition-colors duration-200
              "
              aria-label="Toggle mobile menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            <div className="shrink-0">
              <Link
                href="/"
                className="flex items-center transition-transform duration-200 hover:scale-105"
                aria-label="Soul Paradise Home"
              >
                <img
                  src="/logo.png"
                  alt="Soul Paradise"
                  className="h-15 w-auto"
                />
              </Link>
            </div>
          </div>

          {/* Center: Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {items.map((item) => {
              const isActive = isActiveRoute(item.href);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`
                    flex items-center px-4 py-2 rounded-lg
                     transition-all duration-200 ease-in-out
                    ${
                      isActive
                        ? 'font-bold text-(--color-active)'
                        : 'font-semibold text-(--color-inactive) hover:text-(--color-active)'
                    }
                  `}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right: Auth Buttons (Desktop) */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <UserMenu />
            ) : (
              <>
                <Link
                  href="/login"
                  className="
                    px-4 py-2 rounded-lg
                    text-sm font-semibold
                    border border-(--color-tertiary-button)
                    text-(--color-secondary-button) hover:text-(--color-primary-button)
                    hover:border-(--color-secondary-button)
                    bg-transparent
                    transition-colors duration-200
                  "
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="
                    px-4 py-2 rounded-lg
                    text-sm font-semibold
                    bg-(--color-secondary-button) text-(--color-peace)
                    hover:bg-(--color-primary-button)
                    transition-colors duration-200
                  "
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Right: Mobile user profile (its own account dropdown) */}
          <div className="md:hidden">
            {user ? (
              <UserMenu compact />
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="
                    px-3 py-1.5 rounded-lg
                    text-sm font-semibold
                    text-(--color-secondary-button) hover:text-(--color-primary-button)
                    transition-colors duration-200
                  "
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="
                    px-3 py-1.5 rounded-lg
                    text-sm font-semibold
                    bg-(--color-secondary-button) text-(--color-peace)
                    hover:bg-(--color-primary-button)
                    transition-colors duration-200
                  "
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Backdrop & Menu */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop with blur effect - starts below navbar */}
          <div
            className="fixed top-16 left-0 right-0 bottom-0 bg-black/1 backdrop-blur-sm md:hidden z-40"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Mobile Menu */}
          <div className="md:hidden fixed top-16 left-0 right-0 border-t border-(--color-tertiary-button) bg-(--color-peace) z-50 shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="px-4 pt-2 pb-4 space-y-1">
              {/* Mobile Navigation Links */}
              {items.map((item) => {
                const isActive = isActiveRoute(item.href);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={handleNavClick}
                    className={`
                      flex items-center px-4 py-3 rounded-lg
                      text-base transition-all duration-200
                      ${
                        isActive
                          ? 'font-bold text-(--color-active)'
                          : 'font-medium text-(--color-inactive) hover:bg-(--color-background) hover:text-(--color-active)'
                      }
                    `}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </nav>
  );
};
