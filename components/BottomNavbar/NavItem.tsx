'use client';

import Link from 'next/link';
import { NavItemProps } from './types';
import { Icon } from './icons';

/**
 * NavItem Component
 *
 * Reusable navigation item fragment following Single Responsibility Principle
 * Handles individual nav item rendering with active state styling
 *
 * @param item - Navigation item configuration
 * @param isActive - Whether this item is currently active
 * @param onClick - Optional click handler
 */
export const NavItem = ({ item, isActive, onClick }: NavItemProps) => {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`
        group relative flex items-center gap-2
        px-5 py-2.5 rounded-full transition-all duration-300 ease-in-out
        ${
          isActive
            ? 'bg-black text-white shadow-lg'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
        }
      `}
      aria-label={item.label}
      aria-current={isActive ? 'page' : undefined}
    >
      {/* Icon */}
      <Icon
        name={item.icon}
        className={`
          w-5 h-5 transition-all duration-300
          ${isActive ? 'stroke-[2.5]' : 'stroke-2'}
        `}
      />

      {/* Label - Only visible when active */}
      {isActive && (
        <span className="text-sm font-medium whitespace-nowrap">
          {item.label}
        </span>
      )}
    </Link>
  );
};
