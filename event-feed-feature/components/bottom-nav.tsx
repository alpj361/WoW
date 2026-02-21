"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Compass, PlusCircle, Globe, Bookmark, User } from "lucide-react"

const navItems = [
  { icon: Compass, label: "Explorar" },
  { icon: PlusCircle, label: "Crear" },
  { icon: Globe, label: "Spots" },
  { icon: Bookmark, label: "Mis Eventos" },
  { icon: User, label: "Perfil" },
]

export function BottomNav() {
  const [activeIndex, setActiveIndex] = useState(0)

  return (
    <nav className="relative flex items-center justify-around py-2 pb-3 bg-background/80 backdrop-blur-xl border-t border-border">
      {navItems.map((item, i) => {
        const isActive = i === activeIndex
        return (
          <motion.button
            key={item.label}
            onClick={() => setActiveIndex(i)}
            whileTap={{ scale: 0.85, y: -2 }}
            className={`relative flex flex-col items-center gap-0.5 px-2 py-1 transition-colors ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`}
            aria-label={item.label}
          >
            <div className="relative">
              {isActive && (
                <motion.div
                  layoutId="navGlow"
                  className="absolute -inset-2 bg-primary/15 rounded-full blur-md"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <item.icon className={`w-5 h-5 relative ${isActive ? "text-primary" : ""}`} />
            </div>
            <span className="text-[10px] font-medium">{item.label}</span>

            {/* Active dot indicator */}
            {isActive && (
              <motion.div
                layoutId="navDot"
                className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
          </motion.button>
        )
      })}
    </nav>
  )
}
