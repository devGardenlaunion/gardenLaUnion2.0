export type TipoRecurso = 'externo' | 'documento' | 'temporal'

export interface RecursoItem {
  id: string
  nombre: string
  descripcion: string
  url: string
  tipo: TipoRecurso
  nuevaPestana: boolean
  expiraEl?: string // ISO date string, solo para tipo 'temporal'
}

export const recursos: RecursoItem[] = [
  {
    id: 'sae-mineduc',
    nombre: 'SAE Mineduc',
    descripcion: 'Proceso de admisión escolar oficial',
    url: 'https://admision.mineduc.cl/vitrina-vue/establecimiento/22743',
    tipo: 'externo',
    nuevaPestana: true,
  },
  {
    id: 'junaeb',
    nombre: 'Junaeb',
    descripcion: 'Becas y beneficios estudiantiles',
    url: 'https://www.junaeb.cl',
    tipo: 'externo',
    nuevaPestana: true,
  },
  {
    id: 'reglamento-convivencia',
    nombre: 'Reglamento de Convivencia',
    descripcion: 'Normas, sanciones y procedimientos',
    url: '/documentos',
    tipo: 'documento',
    nuevaPestana: true,
  },
  {
    id: 'pei',
    nombre: 'Proyecto Educativo (PEI)',
    descripcion: 'Misión, visión y lineamientos del colegio',
    url: '/documentos',
    tipo: 'documento',
    nuevaPestana: true,
  },
  {
    id: 'catalogo-textos-mineduc',
    nombre: 'Catálogo de Textos Escolares',
    descripcion: 'Descarga los textos escolares oficiales del Mineduc',
    url: 'https://catalogotextos.mineduc.cl/catalogo-textos/login/login?tipo=alumno',
    tipo: 'externo',
    nuevaPestana: true,
  },
]
