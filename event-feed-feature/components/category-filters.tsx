"use client"

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

export function CategoryFilters({ categories, activeCategory, onCategoryChange }: CategoryFiltersProps) {
  return (
    <div className="flex items-center gap-5 px-4 py-3 overflow-x-auto scrollbar-hide">
      {categories.map((cat) => {
        const Icon = iconMap[cat.icon] || LayoutGrid
        const isActive = activeCategory === cat.id
        return (
          <button
            key={cat.id}
            onClick={() => onCategoryChange(cat.id)}
            className="flex flex-col items-center gap-1.5 min-w-[64px] group"
          >
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(124,58,237,0.4)]"
                  : "bg-secondary text-muted-foreground hover:bg-muted"
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span
              className={`text-xs font-medium transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {cat.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
