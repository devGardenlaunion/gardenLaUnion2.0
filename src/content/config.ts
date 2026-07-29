/**
 * Contenido editable del sitio — reemplaza la tabla ConfigSitio.
 *
 * Para cambiar un texto de la web: editar acá, commit y push. El deploy publica.
 * No hay panel ni base de datos: este archivo ES el contenido.
 *
 * Las claves usan el formato "grupo.campo" y las consume getConfig() en
 * src/lib/config.ts. Ver docs/CONTENIDO.md para la guía completa.
 */

export const contenido = {
  "admision.info": "Garden College participa del Sistema de Admisión Escolar (SAE) del Ministerio de Educación. El proceso de postulación se realiza a través de la plataforma oficial del Mineduc.",
  "admision.link_sae": "https://admision.mineduc.cl/vitrina-vue/establecimiento/22743",
  "contacto.sede_basica.nombre": "Sede Parvularia y Básica",
  "contacto.sede_basica.direccion": "Los Carrera 387, La Unión",
  "contacto.sede_basica.telefono": "(64) 232 4545",
  "contacto.sede_basica.niveles": "Prebásica, 1° a 6° Básico",
  "contacto.sede_basica.lat": "-40.2944",
  "contacto.sede_basica.lng": "-73.0836",
  "contacto.sede_media.nombre": "Sede Media",
  "contacto.sede_media.direccion": "Caupolicán 967, La Unión",
  "contacto.sede_media.telefono": "(64) 232 0503",
  "contacto.sede_media.niveles": "7° y 8° Básico, 1° a 4° Medio",
  "contacto.sede_media.lat": "-40.2928",
  "contacto.sede_media.lng": "-73.0811",
  "contacto.email": "contacto@gardenlaunion.cl",
  // Categorías del formulario de contacto. El `id` viaja en el asunto y en la
  // cabecera X-GC-Categoria del correo: es lo que permite filtrar en Gmail sin
  // depender de ningún procesamiento posterior. **Cambiar un `id` rompe los
  // filtros que el colegio tenga armados** — cambiar el `label` no.
  //
  // No poner acá categorías que prometan un destinatario ("cita con dirección",
  // "hablar con el profesor jefe"): el formulario es público y todo cae en la
  // misma casilla, así que ofrecer un receptor concreto es una promesa que el
  // colegio no puede garantizar y que salta el conducto regular.
  "contacto.categorias": [
    { "id": "admision", "label": "Admisión y matrícula" },
    { "id": "documentos", "label": "Certificados y documentos" },
    { "id": "proveedores", "label": "Proveedores" },
    { "id": "trabajo", "label": "Trabaja con nosotros" },
    { "id": "otro", "label": "Otro" }
  ],
  "eventos.titulo": "Historias Garden",
  "eventos.subtitulo": "Lo que somos, contado desde adentro",
  "eventos.badge": "Lo que vivimos",
  "galeria.titulo": "Galería",
  "galeria.badge": "Momentos Garden",
  "galeria.subtitulo": "Los mejores momentos de nuestra comunidad",
  "institucional.nombre": "Garden College",
  "institucional.slogan": "Educación sin fronteras",
  "institucional.mision": "Somos un Colegio que promueve el desarrollo integral de sus estudiantes, entregando educación de calidad con énfasis en el aprendizaje del idioma extranjero inglés, el desarrollo de las artes musicales y la vida saludable; sin olvidar el pilar fundamental de nuestra actividad: la relación de Dios con el hombre.",
  "institucional.vision": "El Colegio Garden College quiere ser reconocido como una institución educativa de excelencia, que promueva valores cristianos adventistas y desarrolle de manera integral las habilidades y aptitudes de nuestros estudiantes, formando nuevos líderes que mejoren su vida y la de sus semejantes.",
  "institucional.resena": "Garden College fue fundado el 29 de octubre de 2004 en La Unión, capital de la Provincia del Ranco, Región de Los Ríos. Reconocido como \"El colegio inglés de La Unión\", es una comunidad educativa que ha formado generaciones de estudiantes inspirados por valores cristianos y comprometidos con la excelencia. Desde 2019 somos parte de la Educación Adventista como miembro asociado a la Fundación Educacional John Andrews.",
  "institucional.corporacion": "Corporación Educacional Filadelfia Garden",
  "institucional.ciudad": "La Unión",
  "institucional.director": "Rodrigo Esteban Contreras Hernández",
  "institucional.rbd": "22743-9",
  "niveles.info": [
    {
      "nombre": "Prebásica",
      "slug": "prebasica",
      "niveles": "Pre-Kínder y Kínder",
      "sede": "Los Carrera 387",
      "descripcion": "Primeros pasos en un ambiente seguro y estimulante, con énfasis en el juego, la creatividad y los valores."
    },
    {
      "nombre": "Educación Básica",
      "slug": "basica",
      "niveles": "1° a 6° Básico",
      "sede": "Los Carrera 387",
      "descripcion": "Formación académica sólida con inglés desde primer año, talleres de música, arte y deporte."
    },
    {
      "nombre": "Educación Media",
      "slug": "media",
      "niveles": "7° Básico a 4° Medio",
      "sede": "Caupolicán 967",
      "descripcion": "Preparación para la educación superior con talleres de Administración, Introducción al Derecho, y formación integral."
    }
  ],
  "niveles.extras": [
    "Jornada Escolar Completa (JEC)",
    "Programa de Integración Escolar (PIE)",
    "Departamento de Idioma Extranjero Inglés",
    "Departamento de Educación Física y Salud",
    "Departamento de Música y Artes"
  ],
  "redes.facebook": "https://www.facebook.com/people/Garden-La-Uni%C3%B3n/100090639256568/",
  "redes.instagram": "https://www.instagram.com/garden.launion/",
  "redes.youtube": "https://www.youtube.com/@Garden.launion",
  "sellos.titulo": "Un lugar donde tu hijo se siente seguro",
  "sellos.descripcion": "En Garden College creemos que un niño que se siente seguro, aprende mejor. Nuestro enfoque nace de un principio simple: tratar al otro como queremos ser tratados. Eso se enseña, se practica y se vive cada día.",
  "sellos.cta": {
    "cifra": "20+",
    "texto": "Años formando comunidad en La Unión. Conoce cómo ser parte de Garden College.",
    "boton": "Proceso de admisión",
    "href": "#admision"
  },
  "sellos.cards": [
    {
      "titulo": "Formación Cristiana",
      "descripcion": "Educación integral basada en principios, creencias y valores de las Sagradas Escrituras. Nuestra formación cristiana no impone — inspira: la empatía, el servicio y el amor al prójimo se integran en la vida diaria del colegio, desde las asambleas hasta la forma en que los profesores acompañan a cada estudiante.",
      "icono": "book-open"
    },
    {
      "titulo": "Vida Saludable",
      "descripcion": "Desarrollo de las facultades físicas, mentales y espirituales del estudiante a través de nuestro Plan de Actividad Física y Estilos de Vida Saludable. Creemos que el cuidado del cuerpo es parte integral de la formación.",
      "icono": "heart-pulse"
    },
    {
      "titulo": "Inglés",
      "descripcion": "Enseñanza, aprendizaje y dominio del idioma inglés como herramienta para conectar con el mundo. Nuestro departamento de Idioma Extranjero Inglés trabaja desde los primeros niveles hasta cuarto medio.",
      "icono": "globe"
    },
    {
      "titulo": "Respeto como base",
      "descripcion": "Enseñamos que el respeto no es obediencia ciega — es reconocer el valor del otro. Desde pre-kínder hasta cuarto medio, nuestros estudiantes practican el diálogo como primera herramienta para resolver diferencias.",
      "icono": "shield-check"
    },
    {
      "titulo": "Comunidad que acompaña",
      "descripcion": "El Centro General de Padres y Apoderados no es un ente pasivo. Organiza talleres, campañas de prevención y actividades que fortalecen los vínculos entre familias y colegio. La campaña \"Un Colegio Sin Bullying\" nació de esta alianza.",
      "icono": "users"
    }
  ]
} as const;

export type ClaveContenido = keyof typeof contenido;
