"use client"

import { useState } from "react"
import { EventCard, type Event } from "@/components/event-card"
import { ProfileScreen } from "@/components/profile-screen"
import { Loader2, CalendarX, Sparkles, RotateCcw, LayoutGrid, Music, Heart, UtensilsCrossed, Compass, Plus, Bookmark, User } from "lucide-react"

type CategoryFilter = "all" | "music" | "volunteer" | "food"
type ActiveTab = "explore" | "create" | "events" | "profile"

const categories: { id: CategoryFilter; label: string; icon: typeof LayoutGrid }[] = [
  { id: "all", label: "Todos", icon: LayoutGrid },
  { id: "music", label: "Música", icon: Music },
  { id: "volunteer", label: "Voluntariado", icon: Heart },
  { id: "food", label: "General", icon: UtensilsCrossed },
]

const navItems: { id: ActiveTab; label: string; icon: typeof Compass }[] = [
  { id: "explore", label: "Explorar", icon: Compass },
  { id: "create", label: "Crear", icon: Plus },
  { id: "events", label: "Mis Eventos", icon: Bookmark },
  { id: "profile", label: "Perfil", icon: User },
]

const sampleEvents: Event[] = [
  {
    id: "1",
    title: "Festival de Jazz en el Parque",
    description: "Disfruta de una noche mágica con los mejores artistas de jazz de la ciudad.",
    category: "music",
    date: "15 Feb 2026",
    time: "20:00",
    location: "Parque Central",
  },
  {
    id: "2",
    title: "Jornada de Voluntariado",
    description: "Ayuda a limpiar las playas y contribuye al cuidado del medio ambiente.",
    category: "volunteer",
    date: "20 Feb 2026",
    time: "09:00",
    location: "Playa del Sol",
  },
  {
    id: "3",
    title: "Festival Gastronómico",
    description: "Descubre los sabores más exquisitos de la cocina internacional.",
    category: "food",
    date: "25 Feb 2026",
    time: "12:00",
    location: "Plaza Mayor",
  },
]

export default function Home() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [events, setEvents] = useState<Event[]>(sampleEvents)
  const [isLoading, setIsLoading] = useState(false)
  const [isEmpty, setIsEmpty] = useState(false)
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("all")
  const [activeTab, setActiveTab] = useState<ActiveTab>("explore")
  const [savedEvents, setSavedEvents] = useState<Event[]>([])

  const filteredEvents = activeCategory === "all" 
    ? events 
    : events.filter(e => e.category === activeCategory)

  const handleSave = () => {
    const currentEvent = filteredEvents[currentIndex]
    if (currentEvent && !savedEvents.find(e => e.id === currentEvent.id)) {
      setSavedEvents(prev => [...prev, currentEvent])
    }
    if (currentIndex >= filteredEvents.length - 1) {
      setIsEmpty(true)
    } else {
      setCurrentIndex((prev) => prev + 1)
    }
  }

  const handleSkip = () => {
    if (currentIndex >= filteredEvents.length - 1) {
      setIsEmpty(true)
    } else {
      setCurrentIndex((prev) => prev + 1)
    }
  }

  const handleSeed = () => {
    setIsLoading(true)
    setTimeout(() => {
      setEvents(sampleEvents)
      setCurrentIndex(0)
      setIsEmpty(false)
      setIsLoading(false)
    }, 1500)
  }

  const handleReset = () => {
    setCurrentIndex(0)
    setIsEmpty(false)
  }

  const handleCategoryChange = (category: CategoryFilter) => {
    setActiveCategory(category)
    setCurrentIndex(0)
    setIsEmpty(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      {/* Phone Frame */}
      <main className="flex flex-col h-[812px] w-[375px] bg-[#121212] overflow-hidden rounded-[40px] border-4 border-[#2a2a2a] shadow-2xl relative">
        {/* Phone Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-[#0a0a0a] rounded-b-2xl z-50" />
        
        {activeTab === "profile" ? (
          <ProfileScreen
            savedCount={savedEvents.length}
            attendedCount={0}
            ratedCount={0}
            onSeedData={handleSeed}
          />
        ) : (
          <>
            {/* Header */}
            <header className="px-5 pt-10 pb-2">
              <h1 className="text-3xl font-bold text-violet-500 tracking-[3px] italic">
                WOW
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Descubre y Vive Eventos
              </p>
            </header>

            {/* Category Filters */}
            <div className="flex justify-center gap-4 px-4 py-3">
              {categories.map((cat) => {
                const Icon = cat.icon
                const isActive = activeCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.id)}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        isActive
                          ? "bg-violet-500"
                          : "bg-[#1E1E1E] border border-[#333]"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          isActive ? "text-white" : "text-gray-400"
                        }`}
                      />
                    </div>
                    <span
                      className={`text-xs ${
                        isActive ? "text-violet-500 font-medium" : "text-gray-500"
                      }`}
                    >
                      {cat.label}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Cards Container */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 pb-2 overflow-hidden">
              {isLoading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                  <span className="text-gray-500 text-sm">Cargando eventos...</span>
                </div>
              ) : isEmpty ? (
                <div className="flex flex-col items-center p-8 gap-3">
                  <CalendarX className="w-16 h-16 text-gray-600" />
                  <h2 className="text-xl font-bold text-white mt-2">
                    No hay mas eventos
                  </h2>
                  <p className="text-sm text-gray-500 text-center">
                    Has visto todos los eventos disponibles.
                  </p>
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 bg-emerald-500 px-5 py-3 rounded-xl mt-4 hover:bg-emerald-600 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4 text-white" />
                    <span className="text-white text-sm font-semibold">
                      Empezar de nuevo
                    </span>
                  </button>
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="flex flex-col items-center p-8 gap-3">
                  <CalendarX className="w-16 h-16 text-gray-600" />
                  <h2 className="text-xl font-bold text-white mt-2">
                    Sin eventos
                  </h2>
                  <p className="text-sm text-gray-500 text-center">
                    No hay eventos en esta categoria.
                  </p>
                  <button
                    onClick={handleSeed}
                    className="flex items-center gap-2 bg-violet-500 px-5 py-3 rounded-xl mt-4 hover:bg-violet-600 transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-white" />
                    <span className="text-white text-sm font-semibold">
                      Cargar eventos
                    </span>
                  </button>
                </div>
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                  {/* Next card (behind) */}
                  {currentIndex < filteredEvents.length - 1 && (
                    <div className="absolute z-[1] w-full h-full opacity-50 scale-[0.92] translate-y-2">
                      <EventCard
                        event={filteredEvents[currentIndex + 1]}
                        showActions={false}
                      />
                    </div>
                  )}
                  
                  {/* Current card */}
                  <div className="relative z-[2] w-full h-full">
                    <EventCard
                      event={filteredEvents[currentIndex]}
                      onSave={handleSave}
                      onSkip={handleSkip}
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Bottom Navigation */}
        <nav className="flex justify-around items-center px-4 py-3 pb-6 bg-[#121212] border-t border-[#222]">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="flex flex-col items-center gap-1"
              >
                <Icon
                  className={`w-5 h-5 ${
                    isActive ? "text-violet-500" : "text-gray-500"
                  }`}
                />
                <span
                  className={`text-xs ${
                    isActive ? "text-violet-500" : "text-gray-500"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            )
          })}
        </nav>
      </main>
    </div>
  )
}
