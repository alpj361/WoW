"use client"

import { Calendar, MapPin, Clock, ChevronRight, CircleDashed, CircleCheck } from "lucide-react"
import { type UpcomingProcesion } from "@/lib/data"

interface UpcomingProcessionsProps {
  processions: UpcomingProcesion[]
}

export function UpcomingProcessions({ processions }: UpcomingProcessionsProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Section header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-gradient-to-b from-seasonal-glow to-seasonal" />
          <h3 className="text-base font-bold text-seasonal-glow">Proximas Procesiones</h3>
        </div>
        <span className="text-[10px] text-seasonal/60 font-medium tracking-wide uppercase">
          {processions.length} programadas
        </span>
      </div>

      {/* Timeline list */}
      <div className="relative flex flex-col gap-0">
        {/* Vertical timeline line */}
        <div className="absolute left-[15px] top-4 bottom-4 w-[1px] bg-gradient-to-b from-seasonal-glow/40 via-seasonal/20 to-transparent" />

        {processions.map((proc, i) => {
          const dateObj = new Date(proc.date + "T12:00:00")
          const month = dateObj.toLocaleDateString("es-GT", { month: "short" }).toUpperCase()
          const day = dateObj.getDate()

          return (
            <div
              key={proc.id}
              className="group relative flex items-start gap-3 py-2.5 px-1"
            >
              {/* Timeline dot */}
              <div className="relative z-10 flex-shrink-0 mt-0.5">
                {proc.confirmed ? (
                  <CircleCheck className="w-[30px] h-[30px] text-seasonal-glow fill-seasonal-bg" />
                ) : (
                  <CircleDashed className="w-[30px] h-[30px] text-seasonal/40" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded ${
                    proc.confirmed
                      ? "bg-seasonal-glow/15 text-seasonal-glow border border-seasonal-glow/20"
                      : "bg-seasonal/10 text-seasonal/50 border border-seasonal/15"
                  }`}>
                    {proc.dayLabel}
                  </span>
                  {proc.confirmed ? (
                    <span className="text-[9px] font-bold text-seasonal-glow/80 uppercase tracking-wider">
                      Confirmada
                    </span>
                  ) : (
                    <span className="text-[9px] font-medium text-seasonal/35 uppercase tracking-wider">
                      Pendiente
                    </span>
                  )}
                </div>

                <h4 className={`text-sm font-semibold leading-tight mb-1 ${
                  proc.confirmed ? "text-seasonal-glow" : "text-seasonal/60"
                }`}>
                  {proc.title}
                </h4>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                  <span className="flex items-center gap-1 text-[11px] text-seasonal/40">
                    <Calendar className="w-3 h-3" />
                    {day} {month}
                  </span>
                  {proc.time ? (
                    <span className="flex items-center gap-1 text-[11px] text-seasonal/40">
                      <Clock className="w-3 h-3" />
                      {proc.time}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] text-seasonal/25 italic">
                      <Clock className="w-3 h-3" />
                      Por confirmar
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-[11px] text-seasonal/40">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate max-w-[140px]">{proc.city}</span>
                  </span>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex-shrink-0 mt-3">
                <ChevronRight className={`w-4 h-4 ${
                  proc.confirmed ? "text-seasonal/40" : "text-seasonal/15"
                }`} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
