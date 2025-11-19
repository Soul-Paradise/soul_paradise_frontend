import { NavItemConfig } from './types';

/**
 * Navigation Configuration
 *
 * Centralized configuration for navbar items
 */
export const NAV_ITEMS: NavItemConfig[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/',
    icon: 'home',
  },
  {
    id: 'about',
    label: 'About Us',
    href: '/about',
    icon: 'info',
  },
  {
    id: 'hall-of-fame',
    label: 'Hall of Fame',
    href: '/hall-of-fame',
    icon: 'trophy',
  },
  {
    id: 'service',
    label: 'Services',
    href: '/service',
    icon: 'service',
  },
  {
    id: 'contact',
    label: 'Contact Us',
    href: '/contact',
    icon: 'info',
  },
];
