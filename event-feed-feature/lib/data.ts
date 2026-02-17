export type EventCategory = "todos" | "entretenimiento" | "voluntariado" | "general" | "procesiones"

export interface AppEvent {
  id: number
  title: string
  description: string
  category: EventCategory
  subcategory: string
  date: string
  time: string
  location: string
  city: string
  image: string
  organizer: string
  isSeasonal?: boolean
}

export const events: AppEvent[] = [
  {
    id: 1,
    title: "CUARTA MUESTRA INCIDENCIAL",
    description: "Proyeccion de Pelicula por Cine Espacio.",
    category: "entretenimiento",
    subcategory: "Musica & Cultura",
    date: "2026-02-21",
    time: "19:00:00",
    location: "PARQUE INTERCULTURAL",
    city: "Ciudad de Guatemala",
    image: "/images/event-music.jpg",
    organizer: "Cine Espacio",
  },
  {
    id: 2,
    title: "FESTIVAL GASTRONOMICO",
    description: "Los mejores sabores de la region en un solo lugar.",
    category: "entretenimiento",
    subcategory: "Gastronomia",
    date: "2026-02-28",
    time: "12:00:00",
    location: "PLAZA CENTRAL",
    city: "Ciudad de Guatemala",
    image: "/images/event-food.jpg",
    organizer: "Asociacion Gastronomica",
  },
  {
    id: 3,
    title: "JORNADA DE REFORESTACION",
    description: "Siembra un arbol, cambia el mundo. Actividad comunitaria.",
    category: "voluntariado",
    subcategory: "Medio Ambiente",
    date: "2026-03-01",
    time: "08:00:00",
    location: "CERRO DE LA CRUZ",
    city: "Antigua Guatemala",
    image: "/images/event-volunteer.jpg",
    organizer: "EcoGuate",
  },
]

export const procesiones: AppEvent[] = [
  {
    id: 101,
    title: "PROCESION DE JESUS NAZARENO",
    description: "Solemne procesion del templo de La Merced. Recorrido por el centro historico.",
    category: "procesiones",
    subcategory: "Cuaresma",
    date: "2026-03-29",
    time: "05:00:00",
    location: "TEMPLO DE LA MERCED",
    city: "Antigua Guatemala",
    image: "/images/procesion-1.jpg",
    organizer: "Hermandad de Jesus Nazareno",
    isSeasonal: true,
  },
  {
    id: 102,
    title: "VELACION DE ALFOMBRAS",
    description: "Elaboracion y exhibicion de alfombras de aserrin en el paso procesional.",
    category: "procesiones",
    subcategory: "Cuaresma",
    date: "2026-03-28",
    time: "20:00:00",
    location: "CALLE DEL ARCO",
    city: "Antigua Guatemala",
    image: "/images/procesion-2.jpg",
    organizer: "Comite de Alfombristas",
    isSeasonal: true,
  },
  {
    id: 103,
    title: "PROCESION DEL SANTO ENTIERRO",
    description: "La procesion mas grande y solemne de Viernes Santo. Miles de cucuruchos.",
    category: "procesiones",
    subcategory: "Cuaresma",
    date: "2026-04-03",
    time: "14:00:00",
    location: "CATEDRAL DE SAN JOSE",
    city: "Ciudad de Guatemala",
    image: "/images/procesion-3.jpg",
    organizer: "Catedral Metropolitana",
    isSeasonal: true,
  },
]

export interface UpcomingProcesion {
  id: number
  title: string
  date: string
  time: string | null
  location: string
  city: string
  confirmed: boolean
  dayLabel: string
}

export const proximasProcesiones: UpcomingProcesion[] = [
  {
    id: 201,
    title: "Procesion de la Recoleccion",
    date: "2026-03-06",
    time: null,
    location: "Iglesia de la Recoleccion",
    city: "Ciudad de Guatemala",
    confirmed: false,
    dayLabel: "1er Viernes",
  },
  {
    id: 202,
    title: "Procesion Infantil de San Jose",
    date: "2026-03-08",
    time: "10:00",
    location: "Templo de San Jose",
    city: "Antigua Guatemala",
    confirmed: true,
    dayLabel: "1er Domingo",
  },
  {
    id: 203,
    title: "Procesion del Senor Sepultado",
    date: "2026-03-13",
    time: null,
    location: "Santuario Arquidiocesano",
    city: "Ciudad de Guatemala",
    confirmed: false,
    dayLabel: "2do Viernes",
  },
  {
    id: 204,
    title: "Procesion de la Candelaria",
    date: "2026-03-15",
    time: null,
    location: "Iglesia de la Candelaria",
    city: "Ciudad de Guatemala",
    confirmed: false,
    dayLabel: "2do Domingo",
  },
  {
    id: 205,
    title: "Procesion de Santo Domingo",
    date: "2026-03-20",
    time: "16:00",
    location: "Templo de Santo Domingo",
    city: "Antigua Guatemala",
    confirmed: true,
    dayLabel: "3er Viernes",
  },
  {
    id: 206,
    title: "Procesion Jesus de la Merced",
    date: "2026-03-22",
    time: null,
    location: "Iglesia de la Merced",
    city: "Antigua Guatemala",
    confirmed: false,
    dayLabel: "3er Domingo",
  },
  {
    id: 207,
    title: "Procesion del Senor de las Palmas",
    date: "2026-03-29",
    time: null,
    location: "Catedral Metropolitana",
    city: "Ciudad de Guatemala",
    confirmed: false,
    dayLabel: "Domingo de Ramos",
  },
  {
    id: 208,
    title: "Procesion de Viernes Santo",
    date: "2026-04-03",
    time: null,
    location: "Recorrido Centro Historico",
    city: "Antigua Guatemala",
    confirmed: false,
    dayLabel: "Viernes Santo",
  },
]

export const categories = [
  { id: "todos" as EventCategory, label: "Todos", icon: "grid" },
  { id: "entretenimiento" as EventCategory, label: "Entretenimiento", icon: "music" },
  { id: "voluntariado" as EventCategory, label: "Voluntariado", icon: "heart" },
  { id: "general" as EventCategory, label: "General", icon: "coffee" },
]
