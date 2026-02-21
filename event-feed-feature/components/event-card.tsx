"use client"

import { useState } from "react"
import Image from "next/image"
import { motion, useMotionValue, useTransform, AnimatePresence } from "motion/react"
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
  const [exitDirection, setExitDirection] = useState<number>(0)
  const SubIcon = subcategoryIcons[event.subcategory] || Megaphone

  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 0, 200], [-12, 0, 12])
  const likeOpacity = useTransform(x, [0, 80], [0, 1])
  const nopeOpacity = useTransform(x, [-80, 0], [1, 0])

  const handleDragEnd = (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    const swipeThreshold = 100
    const velocityThreshold = 500

    if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
      setExitDirection(1)
      onSwipeRight()
    } else if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
      setExitDirection(-1)
      onSwipeLeft()
    }
  }

  const triggerExit = (direction: number) => {
    setExitDirection(direction)
    if (direction < 0) onSwipeLeft()
    else onSwipeRight()
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={event.id}
        className="absolute inset-0"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{
          x: exitDirection * 400,
          opacity: 0,
          rotate: exitDirection * 15,
          transition: { duration: 0.3 },
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        style={{ x, rotate }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={handleDragEnd}
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

            {/* Like overlay */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-emerald-500/20 backdrop-blur-[2px] pointer-events-none"
              style={{ opacity: likeOpacity }}
            >
              <div className="bg-emerald-500 text-background rounded-full p-4">
                <Heart className="w-8 h-8" />
              </div>
            </motion.div>

            {/* Nope overlay */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-destructive/20 backdrop-blur-[2px] pointer-events-none"
              style={{ opacity: nopeOpacity }}
            >
              <div className="bg-destructive text-destructive-foreground rounded-full p-4">
                <X className="w-8 h-8" />
              </div>
            </motion.div>
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

          {/* Hint text */}
          <div className="absolute bottom-20 left-0 right-0 flex justify-center pointer-events-none">
            <motion.span
              className="text-[10px] tracking-widest uppercase text-muted-foreground/50 font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Desliza para explorar
            </motion.span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-6 z-10">
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.85 }}
            onClick={(e) => {
              e.stopPropagation()
              triggerExit(-1)
            }}
            className="w-14 h-14 rounded-full bg-destructive flex items-center justify-center shadow-lg shadow-destructive/30"
            aria-label="Pasar evento"
          >
            <X className="w-6 h-6 text-destructive-foreground" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.85 }}
            onClick={(e) => {
              e.stopPropagation()
              triggerExit(1)
            }}
            className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30"
            aria-label="Guardar evento"
          >
            <Heart className="w-6 h-6 text-foreground" />
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
