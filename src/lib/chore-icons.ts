import {
  Sparkles,
  ShowerHead,
  CookingPot,
  Shirt,
  Trash2,
  Wind,
  Droplets,
  Flower2,
  Dog,
  ShoppingCart,
  Wrench,
  Paintbrush,
  Bug,
  Bed,
  Sofa,
  Car,
  Baby,
  Refrigerator,
  Flame,
  Scissors,
  type LucideIcon,
} from 'lucide-react'

export interface ChoreIconOption {
  name: string
  label: string
  icon: LucideIcon
}

export const CHORE_ICONS: ChoreIconOption[] = [
  { name: 'sparkles', label: 'Pulizia generale', icon: Sparkles },
  { name: 'shower-head', label: 'Bagno', icon: ShowerHead },
  { name: 'cooking-pot', label: 'Cucina', icon: CookingPot },
  { name: 'shirt', label: 'Bucato', icon: Shirt },
  { name: 'trash-2', label: 'Spazzatura', icon: Trash2 },
  { name: 'wind', label: 'Finestre', icon: Wind },
  { name: 'droplets', label: 'Pavimenti', icon: Droplets },
  { name: 'flower-2', label: 'Giardino', icon: Flower2 },
  { name: 'dog', label: 'Animali', icon: Dog },
  { name: 'shopping-cart', label: 'Spesa', icon: ShoppingCart },
  { name: 'wrench', label: 'Manutenzione', icon: Wrench },
  { name: 'paintbrush', label: 'Pittura', icon: Paintbrush },
  { name: 'bug', label: 'Disinfestazione', icon: Bug },
  { name: 'bed', label: 'Camera da letto', icon: Bed },
  { name: 'sofa', label: 'Soggiorno', icon: Sofa },
  { name: 'car', label: 'Auto', icon: Car },
  { name: 'baby', label: 'Bambini', icon: Baby },
  { name: 'refrigerator', label: 'Frigorifero', icon: Refrigerator },
  { name: 'flame', label: 'Camino/Stufa', icon: Flame },
  { name: 'scissors', label: 'Giardinaggio', icon: Scissors },
]

export function getChoreIcon(name: string): LucideIcon {
  const found = CHORE_ICONS.find((i) => i.name === name)
  return found?.icon ?? Sparkles
}
