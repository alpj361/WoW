// Audience type definitions
export interface AudienceType {
  id: string;
  label: string;
  icon: string;
}

export interface Faculty {
  id: string;
  name: string;
}

export interface University {
  id: string;
  name: string;
  shortName: string;
  type: 'publica' | 'privada';
  faculties: Faculty[];
}

// General audience types
export const AUDIENCE_TYPES: AudienceType[] = [
  { id: 'general', label: 'Público General', icon: '🌐' },
  { id: 'jovenes', label: 'Jóvenes (18-30)', icon: '🧑‍🤝‍🧑' },
  { id: 'familias', label: 'Familias', icon: '👨‍👩‍👧‍👦' },
  { id: 'profesionales', label: 'Profesionales', icon: '💼' },
  { id: 'ninos', label: 'Niños', icon: '👶' },
  { id: 'colegio', label: 'Estudiantes de Colegio', icon: '📚' },
];

// Special option for any university
export const ANY_UNIVERSITY = {
  id: 'cualquier',
  name: 'Cualquier Universidad',
  shortName: 'Cualquiera'
};

// Guatemala universities with faculties
export const GUATEMALA_UNIVERSITIES: University[] = [
  {
    id: 'usac',
    name: 'Universidad de San Carlos de Guatemala',
    shortName: 'USAC',
    type: 'publica',
    faculties: [
      { id: 'ingenieria', name: 'Ingeniería' },
      { id: 'arquitectura', name: 'Arquitectura' },
      { id: 'derecho', name: 'Ciencias Jurídicas y Sociales' },
      { id: 'medicina', name: 'Ciencias Médicas' },
      { id: 'odontologia', name: 'Odontología' },
      { id: 'economia', name: 'Ciencias Económicas' },
      { id: 'humanidades', name: 'Humanidades' },
      { id: 'agronomia', name: 'Agronomía' },
      { id: 'veterinaria', name: 'Medicina Veterinaria y Zootecnia' },
      { id: 'farmacia', name: 'Ciencias Químicas y Farmacia' },
      { id: 'psicologia', name: 'Psicología' },
      { id: 'politicas', name: 'Ciencias Políticas' },
      { id: 'trabajo_social', name: 'Trabajo Social' },
      { id: 'historia', name: 'Historia' },
      { id: 'comunicacion', name: 'Ciencias de la Comunicación' },
    ],
  },
  {
    id: 'uvg',
    name: 'Universidad del Valle de Guatemala',
    shortName: 'UVG',
    type: 'privada',
    faculties: [
      { id: 'ingenieria', name: 'Ingeniería' },
      { id: 'ciencias_sociales', name: 'Ciencias Sociales' },
      { id: 'educacion', name: 'Educación' },
      { id: 'ciencias_humanidades', name: 'Ciencias y Humanidades' },
    ],
  },
  {
    id: 'ufm',
    name: 'Universidad Francisco Marroquín',
    shortName: 'UFM',
    type: 'privada',
    faculties: [
      { id: 'economia', name: 'Ciencias Económicas' },
      { id: 'derecho', name: 'Derecho' },
      { id: 'medicina', name: 'Medicina' },
      { id: 'odontologia', name: 'Odontología' },
      { id: 'arquitectura', name: 'Arquitectura' },
      { id: 'educacion', name: 'Educación' },
      { id: 'psicologia', name: 'Psicología' },
      { id: 'comunicacion', name: 'Ciencias de la Comunicación' },
    ],
  },
  {
    id: 'url',
    name: 'Universidad Rafael Landívar',
    shortName: 'URL',
    type: 'privada',
    faculties: [
      { id: 'ingenieria', name: 'Ingeniería' },
      { id: 'arquitectura', name: 'Arquitectura y Diseño' },
      { id: 'economia', name: 'Ciencias Económicas y Empresariales' },
      { id: 'derecho', name: 'Ciencias Jurídicas y Sociales' },
      { id: 'humanidades', name: 'Humanidades' },
      { id: 'politicas', name: 'Ciencias Políticas y Sociales' },
      { id: 'salud', name: 'Ciencias de la Salud' },
      { id: 'ambiente', name: 'Ciencias Ambientales y Agrícolas' },
      { id: 'educacion', name: 'Educación' },
      { id: 'teologia', name: 'Teología' },
    ],
  },
  {
    id: 'umg',
    name: 'Universidad Mariano Gálvez',
    shortName: 'UMG',
    type: 'privada',
    faculties: [
      { id: 'ingenieria', name: 'Ingeniería en Sistemas' },
      { id: 'derecho', name: 'Ciencias Jurídicas y Sociales' },
      { id: 'economia', name: 'Ciencias de la Administración' },
      { id: 'humanidades', name: 'Humanidades' },
      { id: 'psicologia', name: 'Psicología' },
      { id: 'comunicacion', name: 'Ciencias de la Comunicación' },
      { id: 'teologia', name: 'Teología' },
    ],
  },
  {
    id: 'galileo',
    name: 'Universidad Galileo',
    shortName: 'Galileo',
    type: 'privada',
    faculties: [
      { id: 'ingenieria', name: 'Ingeniería de Sistemas' },
      { id: 'ciencias_tecnologia', name: 'Ciencia y Tecnología' },
      { id: 'comunicacion', name: 'Comunicación' },
      { id: 'educacion', name: 'Educación' },
      { id: 'administracion', name: 'Administración' },
    ],
  },
  {
    id: 'unis',
    name: 'Universidad del Istmo',
    shortName: 'UNIS',
    type: 'privada',
    faculties: [
      { id: 'economia', name: 'Ciencias Económicas y Empresariales' },
      { id: 'comunicacion', name: 'Comunicación' },
      { id: 'derecho', name: 'Derecho' },
      { id: 'educacion', name: 'Educación' },
      { id: 'arquitectura', name: 'Arquitectura y Diseño' },
      { id: 'ingenieria', name: 'Ingeniería' },
    ],
  },
  {
    id: 'upana',
    name: 'Universidad Panamericana',
    shortName: 'UPANA',
    type: 'privada',
    faculties: [
      { id: 'economia', name: 'Ciencias Económicas' },
      { id: 'derecho', name: 'Ciencias Jurídicas y Justicia' },
      { id: 'educacion', name: 'Ciencias de la Educación' },
      { id: 'psicologia', name: 'Ciencias Psicológicas' },
      { id: 'comunicacion', name: 'Ciencias de la Comunicación' },
      { id: 'teologia', name: 'Teología' },
      { id: 'ingenieria', name: 'Ingeniería' },
    ],
  },
  {
    id: 'rural',
    name: 'Universidad Rural de Guatemala',
    shortName: 'Rural',
    type: 'privada',
    faculties: [
      { id: 'agronomia', name: 'Ciencias Agrícolas' },
      { id: 'ambiente', name: 'Ciencias Ambientales' },
      { id: 'administracion', name: 'Administración' },
    ],
  },
  {
    id: 'mesoamericana',
    name: 'Universidad Mesoamericana',
    shortName: 'UMES',
    type: 'privada',
    faculties: [
      { id: 'economia', name: 'Ciencias Económicas' },
      { id: 'derecho', name: 'Ciencias Jurídicas' },
      { id: 'humanidades', name: 'Humanidades' },
      { id: 'ingenieria', name: 'Ingeniería' },
    ],
  },
  {
    id: 'davinci',
    name: 'Universidad Da Vinci de Guatemala',
    shortName: 'Da Vinci',
    type: 'privada',
    faculties: [
      { id: 'ingenieria', name: 'Ingeniería' },
      { id: 'economia', name: 'Ciencias Económicas' },
      { id: 'educacion', name: 'Educación' },
    ],
  },
  {
    id: 'internaciones',
    name: 'Universidad InterNaciones',
    shortName: 'InterNaciones',
    type: 'privada',
    faculties: [
      { id: 'economia', name: 'Ciencias Económicas' },
      { id: 'derecho', name: 'Derecho' },
      { id: 'educacion', name: 'Educación' },
    ],
  },
  {
    id: 'sanpablo',
    name: 'Universidad San Pablo de Guatemala',
    shortName: 'San Pablo',
    type: 'privada',
    faculties: [
      { id: 'educacion', name: 'Educación' },
      { id: 'teologia', name: 'Teología' },
      { id: 'humanidades', name: 'Humanidades' },
    ],
  },
  {
    id: 'udeo',
    name: 'Universidad de Occidente',
    shortName: 'UDEO',
    type: 'privada',
    faculties: [
      { id: 'economia', name: 'Ciencias Económicas' },
      { id: 'derecho', name: 'Ciencias Jurídicas' },
      { id: 'humanidades', name: 'Humanidades' },
    ],
  },
];

// Parsed audience type
export interface ParsedAudience {
  type: 'audiencia' | 'universidad' | 'miembros';
  id?: string;
  subId?: string;
}

// Parse audience string format
export function parseAudience(str: string): ParsedAudience | null {
  const parts = str.split(':');
  if (parts.length < 2) return null;

  const [type, id, subId] = parts;

  if (type === 'audiencia') {
    return { type: 'audiencia', id };
  }
  if (type === 'universidad') {
    return { type: 'universidad', id, subId };
  }
  if (type === 'miembros') {
    return { type: 'miembros', id: parts.slice(1).join(':') };
  }

  return null;
}

// Format audience array for display
export function formatAudienceDisplay(audiences: string[]): string {
  if (!audiences || audiences.length === 0) {
    return 'Sin especificar';
  }

  const parts: string[] = [];
  const audienceTypes: string[] = [];
  const universities: string[] = [];
  let membersOrg: string | null = null;

  for (const aud of audiences) {
    const parsed = parseAudience(aud);
    if (!parsed) continue;

    if (parsed.type === 'audiencia') {
      const audienceType = AUDIENCE_TYPES.find(a => a.id === parsed.id);
      if (audienceType) {
        audienceTypes.push(audienceType.label);
      }
    } else if (parsed.type === 'universidad') {
      if (parsed.id === 'cualquier') {
        universities.push('Cualquier Universidad');
      } else {
        const uni = GUATEMALA_UNIVERSITIES.find(u => u.id === parsed.id);
        if (uni) {
          if (parsed.subId) {
            const faculty = uni.faculties.find(f => f.id === parsed.subId);
            universities.push(`${uni.shortName} - ${faculty?.name || parsed.subId}`);
          } else {
            universities.push(uni.shortName);
          }
        }
      }
    } else if (parsed.type === 'miembros') {
      membersOrg = parsed.id || '';
    }
  }

  if (audienceTypes.length > 0) {
    parts.push(audienceTypes.join(', '));
  }
  if (universities.length > 0) {
    parts.push(universities.length <= 2 ? universities.join(', ') : `${universities.length} universidades`);
  }
  if (membersOrg) {
    parts.push(`Miembros: ${membersOrg}`);
  }

  return parts.join(' • ') || 'Sin especificar';
}

// Count selections by type
export function countAudienceSelections(audiences: string[]): {
  audiencia: number;
  universidades: number;
  miembros: boolean;
} {
  let audiencia = 0;
  let universidades = 0;
  let miembros = false;

  for (const aud of audiences) {
    const parsed = parseAudience(aud);
    if (!parsed) continue;

    if (parsed.type === 'audiencia') {
      audiencia++;
    } else if (parsed.type === 'universidad') {
      universidades++;
    } else if (parsed.type === 'miembros') {
      miembros = true;
    }
  }

  return { audiencia, universidades, miembros };
}
