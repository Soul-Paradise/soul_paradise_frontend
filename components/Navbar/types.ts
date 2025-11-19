/**
 * Navigation item configuration
 */
export interface NavItemConfig {
  id: string;
  label: string;
  href: string;
  icon: string;
}

/**
 * Navbar component props
 */
export interface NavbarProps {
  items: NavItemConfig[];
  className?: string;
}
