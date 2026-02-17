"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Calendar, Clock, MapPin, Music, Utensils, TreePine, Megaphone, X, Heart } from "lucide-react"
import type { AppEvent } from "@/lib/data"

const subcategoryIcons: Record<string, React.ElementType> = {
  "Musica & Cultura": Music,
  "Gastronomia": Utensils,
  "Medio Ambiente": TreePine,
}

interface EventCardProps {
  event: AppEvent
  index: number
  total: number
  onSwipeLeft: () => void
  onSwipeRight: () => void
}

export function EventCard({ event, index, total, onSwipeLeft, onSwipeRight }: EventCardProps) {
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [exiting, setExiting] = useState<"left" | "right" | null>(null)
  const startX = useRef(0)
  const SubIcon = subcategoryIcons[event.subcategory] || Megaphone

  const handleDragStart = (clientX: number) => {
    setIsDragging(true)
    startX.current = clientX
  }

  const handleDragMove = (clientX: number) => {
    if (!isDragging) return
    setDragX(clientX - startX.current)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    if (dragX > 100) {
      triggerExit("right")
    } else if (dragX < -100) {
      triggerExit("left")
    } else {
      setDragX(0)
    }
  }

  const triggerExit = (direction: "left" | "right") => {
    setExiting(direction)
    setTimeout(() => {
      if (direction === "left") onSwipeLeft()
      else onSwipeRight()
      setExiting(null)
      setDragX(0)
    }, 300)
  }

  const rotation = isDragging ? dragX * 0.05 : 0
  const opacity = isDragging ? Math.max(0.5, 1 - Math.abs(dragX) / 400) : 1

  return (
    <div
      className={`absolute inset-0 transition-transform ${
        exiting === "left"
          ? "translate-x-[-120%] rotate-[-15deg] opacity-0"
          : exiting === "right"
          ? "translate-x-[120%] rotate-[15deg] opacity-0"
          : ""
      }`}
      style={
        !exiting
          ? {
              transform: `translateX(${dragX}px) rotate(${rotation}deg)`,
              opacity,
              transition: isDragging ? "none" : "all 0.3s ease",
            }
          : undefined
      }
      onMouseDown={(e) => handleDragStart(e.clientX)}
      onMouseMove={(e) => handleDragMove(e.clientX)}
      onMouseUp={handleDragEnd}
      onMouseLeave={() => {
        if (isDragging) handleDragEnd()
      }}
      onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
      onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
      onTouchEnd={handleDragEnd}
    >
      <div className="relative w-full h-full rounded-2xl overflow-hidden bg-card border border-border select-none cursor-grab active:cursor-grabbing">
        {/* Event Image */}
        <div className="relative h-[55%]">
          <Image
            src={event.image}
            alt={event.title}
            fill
            className="object-cover"
            draggable={false}
          />
          <div className="absolute top-3 right-3 bg-card/80 backdrop-blur-sm px-2 py-1 rounded-md">
            <span className="text-[10px] font-medium text-card-foreground tracking-wider uppercase">
              {event.organizer}
            </span>
          </div>

          {/* Swipe indicators */}
          {dragX > 50 && (
            <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/20 backdrop-blur-[2px]">
              <div className="bg-emerald-500 text-background rounded-full p-4">
                <Heart className="w-8 h-8" />
              </div>
            </div>
          )}
          {dragX < -50 && (
            <div className="absolute inset-0 flex items-center justify-center bg-destructive/20 backdrop-blur-[2px]">
              <div className="bg-destructive text-destructive-foreground rounded-full p-4">
                <X className="w-8 h-8" />
              </div>
            </div>
          )}
        </div>

        {/* Event Info */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-card via-card/95 to-transparent pt-10 px-5 pb-20">
          <div className="inline-flex items-center gap-1.5 bg-primary/20 text-primary px-3 py-1 rounded-full mb-3">
            <SubIcon className="w-3 h-3" />
            <span className="text-xs font-semibold">{event.subcategory}</span>
          </div>
          <h3 className="text-xl font-bold text-card-foreground leading-tight mb-1.5">
            {event.title}
          </h3>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{event.description}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-1.5">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {event.date}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {event.time}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">
              {event.location}, {event.city}
            </span>
          </div>
        </div>

        {/* Index indicator */}
        <div className="absolute top-3 left-3 flex flex-col">
          <span className="text-4xl font-black text-foreground/20 leading-none">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="text-xs text-muted-foreground">
            {String(index + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-6">
        <button
          onClick={(e) => {
            e.stopPropagation()
            triggerExit("left")
          }}
          className="w-14 h-14 rounded-full bg-destructive flex items-center justify-center shadow-lg shadow-destructive/30 hover:scale-110 transition-transform active:scale-95"
          aria-label="Pasar evento"
        >
          <X className="w-6 h-6 text-destructive-foreground" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            triggerExit("right")
          }}
          className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:scale-110 transition-transform active:scale-95"
          aria-label="Guardar evento"
        >
          <Heart className="w-6 h-6 text-foreground" />
        </button>
      </div>
    </div>
  )
}
