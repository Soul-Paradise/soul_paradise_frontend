/**
 * Navigation item configuration
 */
export interface NavItemConfig {
  id: string;
  label: string;
  href: string;
  icon: string; // Icon name instead of component
}

/**
 * Bottom navbar component props
 */
export interface BottomNavbarProps {
  items: NavItemConfig[];
  className?: string;
}

/**
 * Nav item component props
 */
export interface NavItemProps {
  item: NavItemConfig;
  isActive: boolean;
  onClick?: () => void;
}
