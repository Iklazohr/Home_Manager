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
  Utensils,
  Waves,
  Lamp,
  Warehouse,
  Package,
  Recycle,
  Leaf,
  TreePine,
  Sun,
  Thermometer,
  Key,
  Mail,
  Pill,
  Heart,
  Dumbbell,
  BookOpen,
  Monitor,
  Wifi,
  BatteryCharging,
  Lightbulb,
  DoorOpen,
  Armchair,
  Bath,
  WashingMachine,
  Microwave,
  Fan,
  Snowflake,
  Cat,
  Fish,
  Footprints,
  type LucideIcon,
} from 'lucide-react'

export interface ChoreIconOption {
  name: string
  label: string
  icon: LucideIcon
}

export const CHORE_ICONS: ChoreIconOption[] = [
  // Pulizia
  { name: 'sparkles', label: 'Pulizia generale', icon: Sparkles },
  { name: 'shower-head', label: 'Bagno', icon: ShowerHead },
  { name: 'bath', label: 'Vasca/Doccia', icon: Bath },
  { name: 'droplets', label: 'Pavimenti', icon: Droplets },
  { name: 'wind', label: 'Finestre', icon: Wind },
  { name: 'recycle', label: 'Riciclo', icon: Recycle },
  { name: 'trash-2', label: 'Spazzatura', icon: Trash2 },

  // Cucina
  { name: 'cooking-pot', label: 'Cucina', icon: CookingPot },
  { name: 'utensils', label: 'Piatti', icon: Utensils },
  { name: 'refrigerator', label: 'Frigorifero', icon: Refrigerator },
  { name: 'microwave', label: 'Microonde/Forno', icon: Microwave },
  { name: 'shopping-cart', label: 'Spesa', icon: ShoppingCart },

  // Bucato e vestiti
  { name: 'shirt', label: 'Bucato', icon: Shirt },
  { name: 'washing-machine', label: 'Lavatrice', icon: WashingMachine },
  { name: 'waves', label: 'Stirare', icon: Waves },

  // Stanze
  { name: 'bed', label: 'Camera da letto', icon: Bed },
  { name: 'sofa', label: 'Soggiorno', icon: Sofa },
  { name: 'armchair', label: 'Salotto', icon: Armchair },
  { name: 'door-open', label: 'Ingresso', icon: DoorOpen },
  { name: 'lamp', label: 'Illuminazione', icon: Lamp },

  // Esterno e giardino
  { name: 'flower-2', label: 'Giardino', icon: Flower2 },
  { name: 'leaf', label: 'Foglie', icon: Leaf },
  { name: 'tree-pine', label: 'Alberi', icon: TreePine },
  { name: 'scissors', label: 'Potatura', icon: Scissors },
  { name: 'sun', label: 'Terrazzo/Balcone', icon: Sun },

  // Animali
  { name: 'dog', label: 'Cane', icon: Dog },
  { name: 'cat', label: 'Gatto', icon: Cat },
  { name: 'fish', label: 'Pesci', icon: Fish },
  { name: 'footprints', label: 'Animali', icon: Footprints },

  // Manutenzione
  { name: 'wrench', label: 'Manutenzione', icon: Wrench },
  { name: 'paintbrush', label: 'Pittura', icon: Paintbrush },
  { name: 'lightbulb', label: 'Lampadine', icon: Lightbulb },
  { name: 'thermometer', label: 'Riscaldamento', icon: Thermometer },
  { name: 'snowflake', label: 'Aria condizionata', icon: Snowflake },
  { name: 'fan', label: 'Ventilazione', icon: Fan },
  { name: 'flame', label: 'Camino/Stufa', icon: Flame },
  { name: 'battery-charging', label: 'Elettricita', icon: BatteryCharging },
  { name: 'wifi', label: 'Internet/Tech', icon: Wifi },

  // Auto e trasporti
  { name: 'car', label: 'Auto', icon: Car },
  { name: 'key', label: 'Chiavi/Serrature', icon: Key },
  { name: 'warehouse', label: 'Garage', icon: Warehouse },

  // Famiglia e salute
  { name: 'baby', label: 'Bambini', icon: Baby },
  { name: 'heart', label: 'Cura persona', icon: Heart },
  { name: 'pill', label: 'Medicine', icon: Pill },
  { name: 'dumbbell', label: 'Esercizio', icon: Dumbbell },

  // Varie
  { name: 'bug', label: 'Disinfestazione', icon: Bug },
  { name: 'mail', label: 'Posta', icon: Mail },
  { name: 'package', label: 'Pacchi', icon: Package },
  { name: 'book-open', label: 'Documenti', icon: BookOpen },
  { name: 'monitor', label: 'Computer', icon: Monitor },
]

export function getChoreIcon(name: string): LucideIcon {
  const found = CHORE_ICONS.find((i) => i.name === name)
  return found?.icon ?? Sparkles
}
