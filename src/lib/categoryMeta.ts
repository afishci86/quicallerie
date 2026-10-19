import {
  Hammer, Wrench, Plug, PaintRoller, HardHat, Lock, Cog, Drill, Lightbulb,
  type LucideIcon,
} from 'lucide-react';
import type { CategoryColor } from '@/types';

interface CategoryMeta {
  icon: LucideIcon;
  color: CategoryColor;
}

const SLUG_MAP: Record<string, CategoryMeta> = {
  'gros-oeuvre':     { icon: Hammer,      color: 'orange' },
  'plomberie':       { icon: Wrench,      color: 'blue' },
  'electricite':     { icon: Plug,        color: 'yellow' },
  'peinture':        { icon: PaintRoller, color: 'violet' },
  'outillage':       { icon: Hammer,      color: 'turquoise' },
  'serrurerie':      { icon: Lock,        color: 'red' },
  'materiel-lourd':  { icon: Cog,         color: 'slate' },
  'electroportatif': { icon: Drill,       color: 'cyan' },
  'luminaires':      { icon: Lightbulb,   color: 'amber' },
};

const DEFAULT_META: CategoryMeta = { icon: HardHat, color: 'blue' };

export function categoryMeta(slug: string | null | undefined): CategoryMeta {
  if (!slug) return DEFAULT_META;
  return SLUG_MAP[slug] ?? DEFAULT_META;
}
