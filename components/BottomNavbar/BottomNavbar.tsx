'use client';

import { usePathname } from 'next/navigation';
import { BottomNavbarProps } from './types';
import { NavItem } from './NavItem';

/**
 * BottomNavbar Component
 *
 * A modern, capsule-style bottom navigation bar
 * Features:
 * - Responsive design with mobile-first approach
 * - Active state highlighting
 * - Smooth animations and transitions
 * - Accessibility compliant (ARIA labels, semantic HTML)
 * - Follows Open/Closed Principle (easy to extend with new items)
 *
 * Design Principles:
 * - Single Responsibility: Only handles navigation rendering
 * - Open/Closed: Open for extension (new nav items), closed for modification
 * - Dependency Inversion: Depends on NavItemConfig abstraction
 * - Interface Segregation: Props are minimal and focused
 *
 * @param items - Array of navigation items to render
 * @param className - Optional additional CSS classes
 */
export const BottomNavbar = ({ items, className = '' }: BottomNavbarProps) => {
  const pathname = usePathname();

  /**
   * Determines if a nav item is currently active
   * Handles both exact matches and nested routes
   */
  const isActiveRoute = (href: string): boolean => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav
      className={`
        fixed bottom-6 left-1/2 -translate-x-1/2 z-50
        ${className}
      `}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Capsule Container */}
      <div
        className="
          flex items-center gap-3
          bg-white
          px-8 py-4
          rounded-full
          shadow-2xl
          border border-gray-200
          transition-all duration-300
        "
      >
        {/* Render Navigation Items */}
        {items.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            isActive={isActiveRoute(item.href)}
          />
        ))}
      </div>

      {/* Subtle Shadow Effect */}
      <div
        className="
          absolute inset-0 -z-10
          bg-gradient-to-b from-transparent to-gray-200/30
          rounded-full blur-2xl
          opacity-60
        "
        aria-hidden="true"
      />
    </nav>
  );
};
