"use client"

import { Compass, Church } from "lucide-react"

type FeedMode = "eventos" | "procesiones"

interface FeedModeToggleProps {
  mode: FeedMode
  onModeChange: (mode: FeedMode) => void
}

export function FeedModeToggle({ mode, onModeChange }: FeedModeToggleProps) {
  return (
    <div className="mx-4 mt-1 mb-2">
      <div className="relative flex items-center bg-secondary rounded-2xl p-1">
        {/* Sliding indicator */}
        <div
          className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl transition-all duration-300 ease-out ${
            mode === "eventos"
              ? "left-1 bg-primary shadow-[0_0_12px_rgba(124,58,237,0.35)]"
              : "left-[calc(50%+2px)] bg-seasonal shadow-[0_0_12px_rgba(168,85,247,0.35)]"
          }`}
        />

        {/* Eventos tab */}
        <button
          onClick={() => onModeChange("eventos")}
          className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-colors duration-300 ${
            mode === "eventos"
              ? "text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Compass className="w-4 h-4" />
          <span className="text-sm font-semibold">Eventos</span>
        </button>

        {/* Procesiones tab */}
        <button
          onClick={() => onModeChange("procesiones")}
          className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition-colors duration-300 ${
            mode === "procesiones"
              ? "text-seasonal-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Church className="w-4 h-4" />
          <span className="text-sm font-semibold">Cuaresma</span>
          <span className={`text-[8px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded-full transition-colors duration-300 ${
            mode === "procesiones"
              ? "bg-seasonal-glow/20 text-seasonal-foreground"
              : "bg-seasonal/15 text-seasonal-glow"
          }`}>
            HOY
          </span>
        </button>
      </div>
    </div>
  )
}
