import type { Variants } from 'framer-motion'

// Container che fa apparire i figli uno dopo l'altro
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

// Singolo elemento che entra dal basso
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

// Scala da piccolo a grande (per card, badge)
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] },
  },
}

// Slide da sinistra
export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
}

// Per le liste di chores/items
export const listItem: Variants = {
  hidden: { opacity: 0, x: -10 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.25, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    x: 20,
    height: 0,
    marginBottom: 0,
    padding: 0,
    transition: { duration: 0.2 },
  },
}

// Per il completamento (check) — pulse verde
export const completePulse: Variants = {
  idle: { scale: 1 },
  tap: { scale: 0.85 },
}

// Hover lift per card interattive
export const hoverLift = {
  whileHover: { y: -2, transition: { duration: 0.15 } },
  whileTap: { scale: 0.98 },
}

// Numero che cambia (contatori)
export const counterPop: Variants = {
  hidden: { opacity: 0, scale: 0.5 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 400, damping: 15 },
  },
}
