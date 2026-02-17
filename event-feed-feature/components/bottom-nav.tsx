"use client"

import { Compass, PlusCircle, Globe, Bookmark, User } from "lucide-react"

const navItems = [
  { icon: Compass, label: "Explorar", active: true },
  { icon: PlusCircle, label: "Crear", active: false },
  { icon: Globe, label: "Spots", active: false },
  { icon: Bookmark, label: "Mis Eventos", active: false },
  { icon: User, label: "Perfil", active: false },
]

export function BottomNav() {
  return (
    <nav className="flex items-center justify-around py-2 pb-3 bg-background border-t border-border">
      {navItems.map((item) => (
        <button
          key={item.label}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 transition-colors ${
            item.active ? "text-primary" : "text-muted-foreground"
          }`}
          aria-label={item.label}
        >
          <div className={`relative ${item.active ? "" : ""}`}>
            {item.active && (
              <div className="absolute -inset-1 bg-primary/20 rounded-full blur-sm" />
            )}
            <item.icon className={`w-5 h-5 relative ${item.active ? "text-primary" : ""}`} />
          </div>
          <span className="text-[10px] font-medium">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
