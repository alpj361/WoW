"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Calendar, Clock, MapPin, X, Heart, Church } from "lucide-react"
import type { AppEvent } from "@/lib/data"

interface ProcessionCardProps {
  event: AppEvent
  index: number
  total: number
  onSwipeLeft: () => void
  onSwipeRight: () => void
}

export function ProcessionCard({ event, index, total, onSwipeLeft, onSwipeRight }: ProcessionCardProps) {
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [exiting, setExiting] = useState<"left" | "right" | null>(null)
  const startX = useRef(0)

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
      {/* Purple glow ring around card */}
      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-seasonal-glow via-seasonal/50 to-seasonal-muted opacity-60" />

      <div className="relative w-full h-full rounded-2xl overflow-hidden bg-seasonal-bg border border-seasonal/30 select-none cursor-grab active:cursor-grabbing">
        {/* Event Image */}
        <div className="relative h-[55%]">
          <Image
            src={event.image}
            alt={event.title}
            fill
            className="object-cover"
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-seasonal-bg" />

          {/* Seasonal badge */}
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-seasonal/90 backdrop-blur-sm px-2.5 py-1 rounded-full">
            <Church className="w-3 h-3 text-seasonal-foreground" />
            <span className="text-[10px] font-bold text-seasonal-foreground tracking-wider uppercase">
              Cuaresma
            </span>
          </div>

          {/* Swipe indicators */}
          {dragX > 50 && (
            <div className="absolute inset-0 flex items-center justify-center bg-seasonal/20 backdrop-blur-[2px]">
              <div className="bg-seasonal text-seasonal-foreground rounded-full p-4">
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

        {/* Procession Info */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-seasonal-bg via-seasonal-bg/95 to-transparent pt-10 px-5 pb-20">
          <div className="inline-flex items-center gap-1.5 bg-seasonal/15 border border-seasonal/30 text-seasonal-glow px-3 py-1 rounded-full mb-3">
            <Church className="w-3 h-3" />
            <span className="text-xs font-semibold">{event.subcategory}</span>
          </div>
          <h3 className="text-xl font-bold text-seasonal-glow leading-tight mb-1.5">
            {event.title}
          </h3>
          <p className="text-sm text-seasonal/80 mb-3 line-clamp-2">{event.description}</p>
          <div className="flex items-center gap-4 text-xs text-seasonal/70 mb-1.5">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-seasonal" />
              {event.date}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-seasonal" />
              {event.time}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-seasonal/70">
            <MapPin className="w-3.5 h-3.5 text-seasonal flex-shrink-0" />
            <span className="truncate">
              {event.location}, {event.city}
            </span>
          </div>
        </div>

        {/* Index indicator */}
        <div className="absolute top-3 left-3 flex flex-col">
          <span className="text-4xl font-black text-seasonal/20 leading-none">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="text-xs text-seasonal/50">
            {String(index + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}
          </span>
        </div>

        {/* Corner ornamental lines */}
        <div className="absolute top-0 left-0 w-10 h-[1px] bg-gradient-to-r from-seasonal to-transparent" />
        <div className="absolute top-0 left-0 h-10 w-[1px] bg-gradient-to-b from-seasonal to-transparent" />
        <div className="absolute top-0 right-0 w-10 h-[1px] bg-gradient-to-l from-seasonal to-transparent" />
        <div className="absolute top-0 right-0 h-10 w-[1px] bg-gradient-to-b from-seasonal to-transparent" />
        <div className="absolute bottom-0 left-0 w-10 h-[1px] bg-gradient-to-r from-seasonal to-transparent" />
        <div className="absolute bottom-0 left-0 h-10 w-[1px] bg-gradient-to-t from-seasonal to-transparent" />
        <div className="absolute bottom-0 right-0 w-10 h-[1px] bg-gradient-to-l from-seasonal to-transparent" />
        <div className="absolute bottom-0 right-0 h-10 w-[1px] bg-gradient-to-t from-seasonal to-transparent" />
      </div>

      {/* Action Buttons */}
      <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-6 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation()
            triggerExit("left")
          }}
          className="w-14 h-14 rounded-full bg-destructive flex items-center justify-center shadow-lg shadow-destructive/30 hover:scale-110 transition-transform active:scale-95"
          aria-label="Pasar procesion"
        >
          <X className="w-6 h-6 text-destructive-foreground" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            triggerExit("right")
          }}
          className="w-14 h-14 rounded-full bg-seasonal flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:scale-110 transition-transform active:scale-95"
          aria-label="Guardar procesion"
        >
          <Heart className="w-6 h-6 text-seasonal-foreground" />
        </button>
      </div>
    </div>
  )
}
