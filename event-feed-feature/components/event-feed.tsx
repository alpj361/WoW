"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "motion/react"
import { events, procesiones, proximasProcesiones, categories, type EventCategory } from "@/lib/data"
import { CategoryFilters } from "./category-filters"
import { EventCard } from "./event-card"
import { ProcessionCard } from "./procession-card"
import { UpcomingProcessions } from "./upcoming-processions"
import { FeedModeToggle } from "./feed-mode-toggle"
import { BottomNav } from "./bottom-nav"
import { WowLogo } from "./wow-logo"
import { PartyPopper, Church, Send } from "lucide-react"

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
      <motion.header
        className="px-4 pt-4 pb-2 flex-shrink-0"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
      >
        <div className="flex items-center justify-between">
          <WowLogo />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-primary/40 bg-primary/10 text-primary text-sm font-semibold backdrop-blur-sm transition-colors hover:bg-primary/20"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Enviar evento</span>
          </motion.button>
        </div>

        {/* Animated subtitle */}
        <div className="mt-2 h-5 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={feedMode}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className={`text-sm transition-colors duration-500 ${
                isEventMode ? "text-muted-foreground" : "text-seasonal-glow/60"
              }`}
            >
              {isEventMode ? "Descubre y Vive Eventos" : "Cuaresma 2026"}
            </motion.p>
          </AnimatePresence>
        </div>
      </motion.header>

      {/* Mode Toggle */}
      <div className="flex-shrink-0">
        <FeedModeToggle mode={feedMode} onModeChange={setFeedMode} />
      </div>

      {/* Category Filters - only for events */}
      <AnimatePresence>
        {isEventMode && (
          <motion.div
            className="flex-shrink-0"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <CategoryFilters
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={handleCategoryChange}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Seasonal sub-header for procesiones */}
      <AnimatePresence>
        {!isEventMode && (
          <motion.div
            className="flex-shrink-0 px-4 py-3 flex items-center gap-3"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="w-10 h-10 rounded-xl bg-seasonal/15 border border-seasonal-glow/20 flex items-center justify-center">
              <Church className="w-5 h-5 text-seasonal-glow" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-seasonal-glow">Procesiones de Cuaresma</h2>
              <p className="text-[11px] text-seasonal-glow/50">Ciudad y Antigua Guatemala</p>
            </div>
            <span className="text-[9px] bg-seasonal-glow/15 text-seasonal-glow px-2.5 py-1 rounded-full font-bold tracking-wider uppercase border border-seasonal-glow/20 animate-pulse">
              De Temporada
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content area with AnimatePresence for mode transitions */}
      <AnimatePresence mode="wait">
        {/* EVENTS MODE */}
        {isEventMode && (
          <motion.div
            key="events"
            className="flex-1 px-4 pb-2 min-h-0"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="relative w-full h-full">
              <AnimatePresence mode="wait">
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
                  <motion.div
                    key="empty-events"
                    className="flex flex-col items-center justify-center h-full text-center"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  >
                    <motion.div
                      className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <PartyPopper className="w-10 h-10 text-muted-foreground" />
                    </motion.div>
                    <h3 className="text-lg font-bold text-foreground mb-1">
                      No hay mas eventos
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 max-w-[240px]">
                      Has visto todos los eventos de esta categoria
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setActiveCategory("todos")
                        setEventIndex(0)
                      }}
                      className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-semibold hover:bg-primary/90 transition-colors"
                    >
                      Ver Todos
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setFeedMode("procesiones")}
                      className="mt-4 flex items-center gap-2 text-seasonal-glow hover:text-seasonal-glow/80 transition-colors"
                    >
                      <Church className="w-4 h-4" />
                      <span className="text-sm font-medium">Ver Procesiones de Cuaresma</span>
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* PROCESIONES MODE */}
        {!isEventMode && (
          <motion.div
            key="procesiones"
            className="flex-1 overflow-y-auto min-h-0"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {/* Swipeable procession card area */}
            <div className="px-4 pb-4" style={{ height: "clamp(380px, 55vh, 500px)" }}>
              <div className="relative w-full h-full">
                <AnimatePresence mode="wait">
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
                    <motion.div
                      key="empty-processions"
                      className="flex flex-col items-center justify-center h-full text-center"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    >
                      <motion.div
                        className="w-20 h-20 rounded-full bg-seasonal/10 border border-seasonal-glow/20 flex items-center justify-center mb-4"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <Church className="w-10 h-10 text-seasonal-glow/50" />
                      </motion.div>
                      <h3 className="text-lg font-bold text-seasonal-glow mb-1">
                        Has visto todas las procesiones
                      </h3>
                      <p className="text-sm text-seasonal-glow/50 mb-4 max-w-[240px]">
                        Vuelve pronto para mas procesiones de Cuaresma
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setProcessionIndex(0)
                        }}
                        className="px-6 py-2.5 bg-seasonal text-seasonal-foreground rounded-full text-sm font-semibold hover:bg-seasonal-glow transition-colors shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                      >
                        Ver de Nuevo
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
