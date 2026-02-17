"use client"

import { useState, useMemo } from "react"
import { events, procesiones, proximasProcesiones, categories, type EventCategory } from "@/lib/data"
import { CategoryFilters } from "./category-filters"
import { EventCard } from "./event-card"
import { ProcessionCard } from "./procession-card"
import { UpcomingProcessions } from "./upcoming-processions"
import { FeedModeToggle } from "./feed-mode-toggle"
import { BottomNav } from "./bottom-nav"
import { PartyPopper, Church } from "lucide-react"

type FeedMode = "eventos" | "procesiones"

export function EventFeed() {
  const [feedMode, setFeedMode] = useState<FeedMode>("eventos")
  const [activeCategory, setActiveCategory] = useState<EventCategory>("todos")
  const [eventIndex, setEventIndex] = useState(0)
  const [processionIndex, setProcessionIndex] = useState(0)

  const filteredEvents = useMemo(() => {
    if (activeCategory === "todos") return events
    return events.filter((e) => e.category === activeCategory)
  }, [activeCategory])

  const handleCategoryChange = (category: EventCategory) => {
    setActiveCategory(category)
    setEventIndex(0)
  }

  const handleEventSwipe = () => {
    if (eventIndex < filteredEvents.length - 1) {
      setEventIndex((prev) => prev + 1)
    } else {
      setEventIndex(filteredEvents.length)
    }
  }

  const handleProcessionSwipe = () => {
    if (processionIndex < procesiones.length - 1) {
      setProcessionIndex((prev) => prev + 1)
    } else {
      setProcessionIndex(procesiones.length)
    }
  }

  const isEventMode = feedMode === "eventos"

  return (
    <div className={`flex flex-col h-screen max-w-md mx-auto transition-colors duration-500 ${
      isEventMode ? "bg-background" : "bg-seasonal-bg"
    }`}>
      {/* Header */}
      <header className="px-4 pt-4 pb-2 flex-shrink-0">
        <h1 className="text-3xl font-black tracking-tight">
          <span className={`bg-clip-text text-transparent transition-all duration-500 ${
            isEventMode
              ? "bg-gradient-to-r from-destructive via-primary to-primary"
              : "bg-gradient-to-r from-seasonal-glow via-seasonal to-seasonal-muted"
          }`}>
            WOW!
          </span>
        </h1>
        <p className={`text-sm mt-0.5 transition-colors duration-500 ${
          isEventMode ? "text-muted-foreground" : "text-seasonal-glow/60"
        }`}>
          {isEventMode ? "Descubre y Vive Eventos" : "Cuaresma 2026"}
        </p>
      </header>

      {/* Mode Toggle */}
      <div className="flex-shrink-0">
        <FeedModeToggle mode={feedMode} onModeChange={setFeedMode} />
      </div>

      {/* Category Filters - only for events */}
      {isEventMode && (
        <div className="flex-shrink-0">
          <CategoryFilters
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
          />
        </div>
      )}

      {/* Seasonal sub-header for procesiones */}
      {!isEventMode && (
        <div className="flex-shrink-0 px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-seasonal/15 border border-seasonal-glow/20 flex items-center justify-center">
            <Church className="w-5 h-5 text-seasonal-glow" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-seasonal-glow">Procesiones de Cuaresma</h2>
            <p className="text-[11px] text-seasonal-glow/50">Ciudad y Antigua Guatemala</p>
          </div>
          <span className="text-[9px] bg-seasonal-glow/15 text-seasonal-glow px-2.5 py-1 rounded-full font-bold tracking-wider uppercase border border-seasonal-glow/20">
            De Temporada
          </span>
        </div>
      )}

      {/* EVENTS MODE: Card takes full remaining space */}
      {isEventMode && (
        <div className="flex-1 px-4 pb-2 min-h-0">
          <div className="relative w-full h-full">
            {eventIndex < filteredEvents.length ? (
              <EventCard
                key={filteredEvents[eventIndex].id}
                event={filteredEvents[eventIndex]}
                index={eventIndex}
                total={filteredEvents.length}
                onSwipeLeft={handleEventSwipe}
                onSwipeRight={handleEventSwipe}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
                  <PartyPopper className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">
                  No hay mas eventos
                </h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-[240px]">
                  Has visto todos los eventos de esta categoria
                </p>
                <button
                  onClick={() => {
                    setActiveCategory("todos")
                    setEventIndex(0)
                  }}
                  className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  Ver Todos
                </button>

                {/* Suggestion to switch to procesiones */}
                <button
                  onClick={() => setFeedMode("procesiones")}
                  className="mt-4 flex items-center gap-2 text-seasonal-glow hover:text-seasonal-glow/80 transition-colors"
                >
                  <Church className="w-4 h-4" />
                  <span className="text-sm font-medium">Ver Procesiones de Cuaresma</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PROCESIONES MODE: Scrollable with cards + upcoming list */}
      {!isEventMode && (
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Swipeable procession card area */}
          <div className="px-4 pb-4" style={{ height: "clamp(380px, 55vh, 500px)" }}>
            <div className="relative w-full h-full">
              {processionIndex < procesiones.length ? (
                <ProcessionCard
                  key={procesiones[processionIndex].id}
                  event={procesiones[processionIndex]}
                  index={processionIndex}
                  total={procesiones.length}
                  onSwipeLeft={handleProcessionSwipe}
                  onSwipeRight={handleProcessionSwipe}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-20 h-20 rounded-full bg-seasonal/10 border border-seasonal-glow/20 flex items-center justify-center mb-4">
                    <Church className="w-10 h-10 text-seasonal-glow/50" />
                  </div>
                  <h3 className="text-lg font-bold text-seasonal-glow mb-1">
                    Has visto todas las procesiones
                  </h3>
                  <p className="text-sm text-seasonal-glow/50 mb-4 max-w-[240px]">
                    Vuelve pronto para mas procesiones de Cuaresma
                  </p>
                  <button
                    onClick={() => {
                      setProcessionIndex(0)
                    }}
                    className="px-6 py-2.5 bg-seasonal text-seasonal-foreground rounded-full text-sm font-semibold hover:bg-seasonal-glow transition-colors shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                  >
                    Ver de Nuevo
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="px-6 py-2">
            <div className="h-[1px] bg-gradient-to-r from-transparent via-seasonal/30 to-transparent" />
          </div>

          {/* Upcoming Processions List */}
          <div className="px-4 pb-28">
            <UpcomingProcessions processions={proximasProcesiones} />
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
