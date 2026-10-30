import type { LucideIcon } from 'lucide-react';
import { GRADIENTS, type Accent } from './palette';

const SIZES = {
  sm: 'h-9 w-9 rounded-lg [&>svg]:h-4 [&>svg]:w-4',
  md: 'h-12 w-12 rounded-xl [&>svg]:h-6 [&>svg]:w-6',
  lg: 'h-14 w-14 rounded-2xl [&>svg]:h-7 [&>svg]:w-7',
};

/** Gradient square with a white icon. Add `group` to a parent for the hover pop. */
export function IconTile({
  icon: Icon,
  accent = 'blue',
  size = 'md',
}: {
  icon: LucideIcon;
  accent?: Accent;
  size?: keyof typeof SIZES;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center bg-gradient-to-br ${GRADIENTS[accent]} text-white shadow-md transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 ${SIZES[size]}`}
    >
      <Icon />
    </span>
  );
}
