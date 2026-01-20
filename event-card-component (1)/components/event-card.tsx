"use client"

import Image from "next/image"
import { Calendar, Clock, Heart, MapPin, Music, X, Utensils } from "lucide-react"

export interface Event {
  id: string
  title: string
  description?: string
  category: "music" | "volunteer" | "food"
  date?: string
  time?: string
  location?: string
  image?: string
}

interface EventCardProps {
  event: Event
  onSave?: () => void
  onSkip?: () => void
  showActions?: boolean
}

const getCategoryGradient = (category: string): string => {
  switch (category) {
    case "music":
      return "from-violet-600 to-violet-800"
    case "volunteer":
      return "from-pink-500 to-pink-700"
    default:
      return "from-amber-500 to-amber-600"
  }
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "music":
      return Music
    case "volunteer":
      return Heart
    default:
      return Utensils
  }
}

const getCategoryLabel = (category: string): string => {
  switch (category) {
    case "music":
      return "Música"
    case "volunteer":
      return "Voluntariado"
    default:
      return "General"
  }
}

export function EventCard({ event, onSave, onSkip, showActions = true }: EventCardProps) {
  const gradient = getCategoryGradient(event.category)
  const Icon = getCategoryIcon(event.category)
  const categoryLabel = getCategoryLabel(event.category)

  return (
    <div className="flex flex-col h-full w-full px-1">
      <div className={`relative flex-1 w-full rounded-3xl overflow-hidden bg-gradient-to-b ${gradient}`}>
        {event.image ? (
          <Image
            src={event.image || "/placeholder.svg"}
            alt={event.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon className="w-16 h-16 text-white/20" />
          </div>
        )}

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        {/* Content overlay */}
        <div className="absolute inset-0 flex flex-col justify-between p-5">
          {/* Category badge */}
          <div className="flex items-center gap-1.5 self-start bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <Icon className="w-4 h-4 text-white" />
            <span className="text-white text-xs font-medium">{categoryLabel}</span>
          </div>

          {/* Bottom content */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-bold text-white leading-tight">
              {event.title}
            </h3>

            {event.description && (
              <p className="text-sm text-white/80 line-clamp-2 leading-relaxed">
                {event.description}
              </p>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap gap-3 mt-1">
              {event.date && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-white/70" />
                  <span className="text-white/90 text-sm">{event.date}</span>
                </div>
              )}
              {event.time && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-white/70" />
                  <span className="text-white/90 text-sm">{event.time}</span>
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-white/70" />
                  <span className="text-white/90 text-sm">{event.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {showActions && (
        <div className="flex justify-center gap-10 py-4">
          <button
            onClick={onSkip}
            className="w-14 h-14 rounded-full flex items-center justify-center border-2 border-red-500 bg-[#1a1a1a] hover:bg-red-500/20 transition-colors"
            aria-label="Skip event"
          >
            <X className="w-7 h-7 text-red-500" />
          </button>

          <button
            onClick={onSave}
            className="w-14 h-14 rounded-full flex items-center justify-center border-2 border-emerald-500 bg-[#1a1a1a] hover:bg-emerald-500/20 transition-colors"
            aria-label="Save event"
          >
            <Heart className="w-7 h-7 text-emerald-500" />
          </button>
        </div>
      )}
    </div>
  )
}

export default EventCard
