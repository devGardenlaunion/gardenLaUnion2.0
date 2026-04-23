export type TipoRecurso = 'externo' | 'documento' | 'temporal'

export interface RecursoItem {
  id: string
  nombre: string
  descripcion: string
  url: string
  tipo: TipoRecurso
  grupo: 'interno' | 'externo'
  nuevaPestana: boolean
  expiraEl?: string
}

export const recursos: RecursoItem[] = [
  {
    id: 'pei',
    nombre: 'Proyecto Educativo',
    descripcion: 'PEI — Misión, visión y lineamientos',
    url: '/documentos',
    tipo: 'documento',
    grupo: 'interno',
    nuevaPestana: true,
  },
  {
    id: 'reglamento-convivencia',
    nombre: 'Reglamento de Convivencia',
    descripcion: 'Normas y procedimientos',
    url: '/documentos?doc=reglamento-convivencia',
    tipo: 'documento',
    grupo: 'interno',
    nuevaPestana: true,
  },
  {
    id: 'centro-documentacion',
    nombre: 'Centro de Documentación',
    descripcion: 'Todos los documentos del colegio',
    url: '/documentos',
    tipo: 'documento',
    grupo: 'interno',
    nuevaPestana: true,
  },
  {
    id: 'sae-mineduc',
    nombre: 'SAE Mineduc',
    descripcion: 'Proceso de admisión escolar',
    url: 'https://admision.mineduc.cl/vitrina-vue/establecimiento/22743',
    tipo: 'externo',
    grupo: 'externo',
    nuevaPestana: true,
  },
  {
    id: 'junaeb',
    nombre: 'Junaeb',
    descripcion: 'Becas y beneficios estudiantiles',
    url: 'https://www.junaeb.cl',
    tipo: 'externo',
    grupo: 'externo',
    nuevaPestana: true,
  },
  {
    id: 'catalogo-textos-mineduc',
    nombre: 'Textos Escolares 2026',
    descripcion: 'Catálogo oficial de textos Mineduc',
    url: 'https://catalogotextos.mineduc.cl/catalogo-textos/login/login?tipo=alumno',
    tipo: 'externo',
    grupo: 'externo',
    nuevaPestana: true,
  },
]
