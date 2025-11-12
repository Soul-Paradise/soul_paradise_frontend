import { NavItemConfig } from './types';

/**
 * Navigation Configuration
 *
 * Centralized configuration following the Single Responsibility Principle
 * Makes it easy to add/remove/modify navigation items without touching component code
 *
 * Benefits:
 * - Easy to maintain and update
 * - Type-safe configuration
 * - Separation of concerns (data vs presentation)
 * - Can be easily moved to CMS or API in future
 */
export const NAV_ITEMS: NavItemConfig[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/',
    icon: 'home',
  },
  {
    id: 'hall-of-fame',
    label: 'Fame',
    href: '/hall-of-fame',
    icon: 'trophy',
  },
  {
    id: 'service',
    label: 'Service',
    href: '/service',
    icon: 'service',
  },
  {
    id: 'about',
    label: 'About',
    href: '/about',
    icon: 'info',
  },
];
