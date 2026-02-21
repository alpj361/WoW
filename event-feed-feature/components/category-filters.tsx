"use client"

import { motion } from "motion/react"
import { LayoutGrid, Music, Heart, Coffee } from "lucide-react"
import type { EventCategory } from "@/lib/data"

const iconMap: Record<string, React.ElementType> = {
  grid: LayoutGrid,
  music: Music,
  heart: Heart,
  coffee: Coffee,
}

interface CategoryFiltersProps {
  categories: { id: EventCategory; label: string; icon: string }[]
  activeCategory: EventCategory
  onCategoryChange: (category: EventCategory) => void
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20,
    },
  },
}

export function CategoryFilters({ categories, activeCategory, onCategoryChange }: CategoryFiltersProps) {
  return (
    <motion.div
      className="flex items-center gap-5 px-4 py-3 overflow-x-auto scrollbar-hide"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {categories.map((cat) => {
        const Icon = iconMap[cat.icon] || LayoutGrid
        const isActive = activeCategory === cat.id
        return (
          <motion.button
            key={cat.id}
            variants={itemVariants}
            onClick={() => onCategoryChange(cat.id)}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.9 }}
            className="flex flex-col items-center gap-1.5 min-w-[64px] group"
          >
            <div className="relative">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(124,58,237,0.4)]"
                    : "bg-secondary text-muted-foreground hover:bg-muted"
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              {/* Animated ring glow for active */}
              {isActive && (
                <motion.div
                  layoutId="categoryRing"
                  className="absolute inset-0 rounded-full animate-ring-glow"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
            </div>
            <span
              className={`text-xs font-medium transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {cat.label}
            </span>
          </motion.button>
        )
      })}
    </motion.div>
  )
}
