export interface ProcesionPuntoReferencia {
    lugar: string;
    hora: string;
}

export interface Procesion {
    nombre_procesion: string;
    fecha: string;
    puntos_referencia: ProcesionPuntoReferencia[];
    imagenes_recorrido: { value: string }[];
    imagenes_procesion: string[];
    horarios: { salida: string; entrada: string };
    tipo_procesion?: string;
}

export const procesionesEstaSemana: Procesion[] = [
    {
        nombre_procesion: "Procesión del Beaterio de Belén",
        fecha: "17 de febrero 2026",
        puntos_referencia: [
            { lugar: "14 calle, 9-30 de la Zona 1 (Salida)", hora: "18:00" },
            { lugar: "9a. Avenida", hora: "N/A" },
            { lugar: "13 calle", hora: "N/A" },
            { lugar: "10a. Avenida", hora: "N/A" },
            { lugar: "14 calle A", hora: "N/A" },
            { lugar: "Retorno al templo (Entrada)", hora: "19:30" },
        ],
        imagenes_recorrido: [
            { value: "https://www.guatemala.com/fotos/2026/02/Cuaresma-2026-procesion-17-de-febrero-2026.webp" },
        ],
        imagenes_procesion: [
            "https://www.guatemala.com/fotos/2026/02/Cuaresma-2026-procesion-17-de-febrero-2026.webp",
        ],
        horarios: { salida: "18:00", entrada: "19:30" },
    },
    {
        nombre_procesion: "Traslado de pasos del Templo de Santo Domingo",
        fecha: "17 de febrero 2026",
        puntos_referencia: [
            { lugar: "Templo de Santo Domingo, 12 Avenida y 10a. Calle, 10-09, Zona 1", hora: "20:00" },
        ],
        imagenes_recorrido: [
            { value: "https://www.guatemala.com/fotos/2026/02/Cuaresma-2026-procesion-17-de-febrero-2026-Templo-de-Santo-Domingo.webp" },
        ],
        imagenes_procesion: [
            "https://www.guatemala.com/fotos/2026/02/Cuaresma-2026-procesion-17-de-febrero-2026-Templo-de-Santo-Domingo.webp",
        ],
        horarios: { salida: "20:00", entrada: "N/A" },
    },
    {
        nombre_procesion: "Viacrucis Penitencial de Miércoles de Ceniza con la Imagen de Jesús Nazareno de la Justicia del Templo El Calvario",
        fecha: "18 de febrero 2026",
        puntos_referencia: [
            { lugar: "Templo San Francisco", hora: "N/A" },
            { lugar: "Portal Bicentenario", hora: "N/A" },
            { lugar: "Catedral Metropolitana", hora: "N/A" },
            { lugar: "Arco de Correos", hora: "N/A" },
        ],
        imagenes_recorrido: [
            { value: "https://www.guatemala.com/fotos/2026/02/Cuaresma-2026-procesion-18-de-febrero-2026-Templo-El-Calvario.webp" },
        ],
        imagenes_procesion: [
            "https://www.guatemala.com/fotos/2026/02/Cuaresma-2026-procesion-18-de-febrero-2026-Templo-El-Calvario.webp",
        ],
        horarios: { salida: "16:00", entrada: "22:00" },
    },
    {
        nombre_procesion: "Procesión de Jesús de la Justicia «El Nazareno Franciscano»",
        fecha: "18 de febrero 2026",
        puntos_referencia: [
            { lugar: "Templo Histórico de San Francisco", hora: "N/A" },
        ],
        imagenes_recorrido: [],
        imagenes_procesion: [],
        horarios: { salida: "Pendiente de confirmar", entrada: "Pendiente de confirmar" },
    },
    {
        nombre_procesion: "Procesión de Jesús Nazareno de los Milagros del Santuario de San José",
        fecha: "19 de febrero 2026",
        puntos_referencia: [
            { lugar: "Santuario de San José (Salida)", hora: "14:30" },
            { lugar: "Parque Colón", hora: "N/A" },
            { lugar: "Parroquia La Merced", hora: "N/A" },
            { lugar: "Palacio Arzobispal", hora: "N/A" },
            { lugar: "Iglesia de Santa Teresa", hora: "N/A" },
            { lugar: "Parque Isabel La Católica", hora: "N/A" },
            { lugar: "Cerrito del Carmen", hora: "N/A" },
            { lugar: "Parroquia de Candelaria", hora: "N/A" },
            { lugar: "3a. Calle y Avenida de los Árboles", hora: "N/A" },
            { lugar: "17 Avenida y 4a. Calle", hora: "N/A" },
            { lugar: "Retorno al Santuario (Entrada)", hora: "00:30" },
        ],
        imagenes_recorrido: [
            { value: "https://www.guatemala.com/fotos/2026/02/Cuaresma-2026-procesion-19-de-febrero-2026-Templo-de-San-Jose.webp" },
        ],
        imagenes_procesion: [
            "https://www.guatemala.com/fotos/2026/02/Cuaresma-2026-procesion-19-de-febrero-2026-Templo-de-San-Jose.webp",
        ],
        horarios: { salida: "14:30", entrada: "00:30" },
    },
    {
        nombre_procesion: "Bodas de Plata de Consagración de Jesús Nazareno de Santa Ana",
        fecha: "21 de febrero 2026",
        puntos_referencia: [
            { lugar: "Templo de Santa Ana (Salida)", hora: "13:00" },
            { lugar: "Escuela de Cristo", hora: "15:30" },
            { lugar: "Mercado del Carmen", hora: "17:00" },
            { lugar: "Alameda Santa Rosa", hora: "17:50" },
            { lugar: "Calle del Arco", hora: "18:30" },
            { lugar: "San José Catedral", hora: "19:30" },
            { lugar: "Tanque de la Unión", hora: "20:30" },
            { lugar: "Escuela de Cristo (regreso)", hora: "21:30" },
            { lugar: "Puente de Belén", hora: "22:00" },
            { lugar: "Retorno al Templo (Entrada)", hora: "23:00" },
        ],
        imagenes_recorrido: [
            { value: "https://www.guatemala.com/fotos/2026/02/Procesion-Antigua-Guatemala-Bodas-de-Plata-de-Consagracion-de-Jesus-Nazareno-de-Santa-Ana-2026.webp" },
        ],
        imagenes_procesion: [
            "https://www.guatemala.com/fotos/2026/02/Procesion-Antigua-Guatemala-Bodas-de-Plata-de-Consagracion-de-Jesus-Nazareno-de-Santa-Ana-2026.webp",
        ],
        horarios: { salida: "13:00", entrada: "23:00" },
    },
    {
        nombre_procesion: "Jesús Nazareno de la Salvación",
        fecha: "22 de febrero 2026",
        puntos_referencia: [
            { lugar: "Aldea Santa Catarina Bobadilla", hora: "N/A" },
        ],
        imagenes_recorrido: [],
        imagenes_procesion: [],
        horarios: { salida: "Por confirmar", entrada: "Por confirmar" },
    },
];

/**
 * Parse "17 de febrero 2026" → Date object for comparison
 */
export function parseProcesionDate(fechaStr: string): Date | null {
    const months: Record<string, number> = {
        enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
        julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
    };
    const match = fechaStr.match(/(\d+)\s+de\s+(\w+)\s+(\d{4})/);
    if (!match) return null;
    const [, day, month, year] = match;
    const monthIndex = months[month.toLowerCase()];
    if (monthIndex === undefined) return null;
    return new Date(parseInt(year), monthIndex, parseInt(day));
}

/**
 * Check if a procession date is today
 */
export function isToday(fechaStr: string): boolean {
    const date = parseProcesionDate(fechaStr);
    if (!date) return false;
    const now = new Date();
    return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate()
    );
}

/**
 * Format "17 de febrero 2026" → "MAR 17 FEB"
 */
export function formatShortDate(fechaStr: string): { dayOfWeek: string; day: string; month: string } {
    const date = parseProcesionDate(fechaStr);
    if (!date) return { dayOfWeek: '', day: '', month: '' };
    const days = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
    const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    return {
        dayOfWeek: days[date.getDay()],
        day: String(date.getDate()),
        month: months[date.getMonth()],
    };
}

/**
 * Group processions by date string
 */
export function groupByDate(procesiones: Procesion[]): Map<string, Procesion[]> {
    const map = new Map<string, Procesion[]>();
    for (const p of procesiones) {
        const existing = map.get(p.fecha) || [];
        existing.push(p);
        map.set(p.fecha, existing);
    }
    return map;
}
