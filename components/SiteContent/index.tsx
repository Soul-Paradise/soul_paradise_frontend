import { Fragment, createElement } from 'react';
import {
  Award,
  Baby,
  BadgeCheck,
  Briefcase,
  Building2,
  Bus,
  CalendarDays,
  Camera,
  Car,
  Circle,
  Clock,
  Coffee,
  Compass,
  CreditCard,
  Crown,
  FileText,
  Gem,
  Gift,
  Globe,
  Globe2,
  Handshake,
  Headphones,
  Heart,
  HeartHandshake,
  Hotel,
  Landmark,
  Leaf,
  Lock,
  Luggage,
  Mail,
  Map,
  MapPin,
  MessageCircle,
  Mountain,
  Navigation,
  Palmtree,
  Percent,
  Phone,
  Plane,
  Rocket,
  Route,
  Search,
  ShieldCheck,
  Ship,
  Smile,
  Sparkles,
  Stamp,
  Star,
  Store,
  Sun,
  Tag,
  ThumbsUp,
  Ticket,
  TrainFront,
  Trophy,
  Umbrella,
  Users,
  Utensils,
  Wallet,
  Waves,
  Wifi,
  Zap,
  type LucideIcon,
} from 'lucide-react';

/**
 * Lucide icons an admin can pick for CMS content. Keep in step with
 * ICON_NAMES in the backend's src/site-content/registry.ts.
 */
const ICONS: Record<string, LucideIcon> = {
  Award, Baby, BadgeCheck, Briefcase, Building2, Bus, CalendarDays, Camera, Car, Clock, Coffee, Compass,
  CreditCard, Crown, FileText, Gem, Gift, Globe, Globe2, Handshake, Headphones, Heart, HeartHandshake, Hotel,
  Landmark, Leaf, Lock, Luggage, Mail, Map, MapPin, MessageCircle, Mountain, Navigation, Palmtree, Percent,
  Phone, Plane, Rocket, Route, Search, ShieldCheck, Ship, Smile, Sparkles, Stamp, Star, Store, Sun, Tag,
  ThumbsUp, Ticket, TrainFront, Trophy, Umbrella, Users, Utensils, Wallet, Waves, Wifi, Zap,
};

/** Lucide component for a CMS icon name; a neutral circle for unknown names. */
export const iconFor = (name: string | undefined): LucideIcon => (name && ICONS[name]) || Circle;

export function CmsIcon({ name, className }: { name: string | undefined; className?: string }) {
  // createElement on a looked-up (module-level) icon: nothing is created per render.
  return createElement(iconFor(name), { className });
}

/** Renders CMS text where `**word**` marks highlighted spans. */
export function RichText({ text, boldClassName = 'font-semibold text-(--color-foreground)' }: { text: string; boldClassName?: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <span key={i} className={boldClassName}>
            {part.slice(2, -2)}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}
