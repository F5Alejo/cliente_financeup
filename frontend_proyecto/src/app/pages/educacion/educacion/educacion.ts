import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Curso,
  EscuelaCursos,
  OpcionFiltro,
  ProgresoGeneral,
} from './educacion.model';

@Component({
  selector: 'app-educacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './educacion.html',
  styleUrls: ['./educacion.css'],
})
export class EducacionComponent {
  // ---------------------------------------------------------------------
  // DATA — edita/agrega aquí. El HTML solo itera sobre estos arreglos,
  // así que agregar un curso nuevo es agregar un objeto más abajo.
  // ---------------------------------------------------------------------

  progresoGeneral: ProgresoGeneral = {
    porcentaje: 42,
    moduloActual: 2,
    moduloTotal: 5,
    minutosRestantes: 12,
  };

  categorias: OpcionFiltro[] = [
    { id: 'fundamentos', etiqueta: 'Fundamentos' },
    { id: 'credito', etiqueta: 'Crédito' },
    { id: 'ahorro', etiqueta: 'Ahorro' },
    { id: 'deuda', etiqueta: 'Deuda' },
    { id: 'fraude', etiqueta: 'Fraude' },
  ];

  niveles: OpcionFiltro[] = [
    { id: 'basico', etiqueta: 'Básico' },
    { id: 'intermedio', etiqueta: 'Intermedio' },
    { id: 'avanzado', etiqueta: 'Avanzado' },
  ];

  formatos: OpcionFiltro[] = [
    { id: 'video', etiqueta: 'Video' },
    { id: 'articulo', etiqueta: 'Artículo' },
    { id: 'quiz', etiqueta: 'Quiz' },
  ];

  filtrosRapidos: OpcionFiltro[] = [
    { id: 'todos', etiqueta: 'Todos' },
    { id: 'para-ti', etiqueta: 'Para ti' },
    { id: 'nuevos', etiqueta: 'Nuevos' },
  ];

  escuelas: EscuelaCursos[] = [
    {
      id: 'finanzas-personales',
      nombre: 'Escuela de Finanzas Personales',
      cursos: [
        {
          id: 'presupuesto-50-30-20',
          titulo: 'Curso de Presupuesto 50/30/20',
          imagen: 'https://picsum.photos/seed/presupuesto1/400/220',
          categoria: 'fundamentos',
          nivel: 'Básico',
          formato: 'Video',
          duracion: '30 minutos',
          resumenLecciones: '4 Lecciones + 1 Evaluación',
          certificado: true,
          descripcion:
            'Aprende a organizar tus ingresos en necesidades, deseos y ahorro con la regla 50/30/20.',
          progreso: 0,
          contenido: [
            '¿Qué es la regla 50/30/20?',
            'Cómo clasificar tus gastos',
            'Errores comunes al presupuestar',
            'Arma tu primer presupuesto',
            'Evaluación final',
          ],
        },
        {
          id: 'presupuesto-50-30-20-avanzado',
          titulo: 'Presupuesto 50/30/20',
          imagen: 'https://picsum.photos/seed/presupuesto2/400/220',
          categoria: 'fundamentos',
          nivel: 'Intermedio',
          formato: 'Artículo',
          duracion: '20 minutos',
          resumenLecciones: '3 Lecciones',
          certificado: false,
          descripcion:
            'Profundiza en variaciones de la regla 50/30/20 para distintos tipos de ingreso.',
          progreso: 0,
          contenido: [
            'Ajustando la regla a ingresos variables',
            'Casos prácticos',
            'Revisión mensual del presupuesto',
          ],
        },
        {
          id: 'tarjetas-responsable',
          titulo: 'Curso responsable de tarjetas',
          imagen: 'https://picsum.photos/seed/tarjetas/400/220',
          categoria: 'credito',
          nivel: 'Básico',
          formato: 'Video',
          duracion: '35 minutos',
          resumenLecciones: '5 Lecciones + 1 Evaluación',
          certificado: true,
          descripcion:
            'Usa tus tarjetas de crédito a tu favor sin caer en deudas innecesarias.',
          progreso: 0,
          contenido: [
            'Cómo funciona una tarjeta de crédito',
            'Cupo, cuota mínima e intereses',
            'Buenas prácticas de uso',
            'Errores que generan deuda',
            'Evaluación final',
          ],
        },
        {
          id: 'solicitar-credito',
          titulo: 'Cómo solicitar un crédito',
          imagen: 'https://picsum.photos/seed/credito/400/220',
          categoria: 'credito',
          nivel: 'Básico',
          formato: 'Artículo',
          duracion: '25 minutos',
          resumenLecciones: '4 Lecciones',
          certificado: false,
          descripcion:
            'Conoce los requisitos y el proceso para solicitar un crédito de forma responsable.',
          progreso: 0,
          contenido: [
            'Tipos de crédito',
            'Requisitos y documentos',
            'Cómo comparar ofertas',
            'Qué revisar antes de firmar',
          ],
        },
        {
          id: 'historial-desde-cero',
          titulo: 'Entiende tu Puntaje de Crédito',
          imagen: 'https://picsum.photos/seed/historial/400/220',
          categoria: 'credito',
          nivel: 'Básico',
          formato: 'Video',
          duracion: '45 minutos',
          resumenLecciones: '5 Lecciones + 1 Evaluación',
          certificado: true,
          descripcion:
            'Aprende cómo funciona tu score crediticio y cómo mejorarlo paso a paso.',
          progreso: 0,
          contenido: [
            '¿Qué es el puntaje de crédito?',
            'Factores que afectan tu score',
            'Mitos comunes sobre el crédito',
            'Cómo mejorar tu puntaje',
            'Evaluación final',
          ],
        },
      ],
    },
    {
      id: 'inversion',
      nombre: 'Escuela de Inversión',
      cursos: [
        {
          id: 'intro-criptomonedas',
          titulo: 'Introducción a las Criptomonedas',
          imagen: 'https://picsum.photos/seed/cripto/400/220',
          categoria: 'fundamentos',
          nivel: 'Básico',
          formato: 'Video',
          duracion: '40 minutos',
          resumenLecciones: '5 Lecciones + 1 Evaluación',
          certificado: true,
          descripcion:
            'Los conceptos esenciales para entender qué son y cómo funcionan las criptomonedas.',
          progreso: 0,
          contenido: [
            '¿Qué es una criptomoneda?',
            'Blockchain explicado de forma simple',
            'Riesgos y oportunidades',
            'Cómo comprar de forma segura',
            'Evaluación final',
          ],
        },
        {
          id: 'intro-bolsa',
          titulo: 'Introducción a la Bolsa',
          imagen: 'https://picsum.photos/seed/bolsa/400/220',
          categoria: 'fundamentos',
          nivel: 'Básico',
          formato: 'Video',
          duracion: '35 minutos',
          resumenLecciones: '4 Lecciones + 1 Evaluación',
          certificado: true,
          descripcion:
            'Entiende cómo funciona el mercado de valores y cómo dar tus primeros pasos.',
          progreso: 0,
          contenido: [
            '¿Qué es la bolsa de valores?',
            'Acciones, bonos y fondos',
            'Cómo abrir tu primera cuenta',
            'Evaluación final',
          ],
        },
        {
          id: 'estrategias-inversion-bolsa',
          titulo: 'Estrategias de inversión en Bolsa',
          imagen: 'https://picsum.photos/seed/estrategias/400/220',
          categoria: 'fundamentos',
          nivel: 'Intermedio',
          formato: 'Artículo',
          duracion: '50 minutos',
          resumenLecciones: '6 Lecciones + 1 Evaluación',
          certificado: true,
          descripcion:
            'Compara distintas estrategias de inversión según tu perfil de riesgo.',
          progreso: 0,
          contenido: [
            'Perfiles de riesgo',
            'Estrategia de largo plazo',
            'Estrategia de dividendos',
            'Diversificación de portafolio',
            'Errores comunes',
            'Evaluación final',
          ],
        },
        {
          id: 'analisis-tecnico-basico',
          titulo: 'Análisis técnico básico',
          imagen: 'https://picsum.photos/seed/analisis/400/220',
          categoria: 'fundamentos',
          nivel: 'Intermedio',
          formato: 'Video',
          duracion: '45 minutos',
          resumenLecciones: '5 Lecciones + 1 Evaluación',
          certificado: true,
          descripcion:
            'Introducción a la lectura de gráficos y patrones para tomar mejores decisiones.',
          progreso: 0,
          contenido: [
            'Velas japonesas',
            'Tendencias y soportes',
            'Indicadores básicos',
            'Errores de principiante',
            'Evaluación final',
          ],
        },
        {
          id: 'gestion-portafolio',
          titulo: 'Gestión de portafolio',
          imagen: 'https://picsum.photos/seed/portafolio/400/220',
          categoria: 'fundamentos',
          nivel: 'Avanzado',
          formato: 'Quiz',
          duracion: '30 minutos',
          resumenLecciones: '3 Lecciones + 1 Evaluación',
          certificado: true,
          descripcion:
            'Aprende a balancear y monitorear tu portafolio de inversiones en el tiempo.',
          progreso: 0,
          contenido: [
            'Rebalanceo de portafolio',
            'Métricas clave a seguir',
            'Evaluación final',
          ],
        },
      ],
    },
  ];

  // ---------------------------------------------------------------------
  // ESTADO / INTERACCIÓN
  // ---------------------------------------------------------------------

  terminoBusqueda = '';
  filtroRapidoActivo = 'todos';
  categoriaActiva: string | null = null;
  nivelActivo: string | null = null;
  formatoActivo: string | null = null;

  /** Curso seleccionado. Si es null, se muestra el catálogo; si no, el detalle. */
  cursoSeleccionado: Curso | null = null;

  seleccionarCurso(curso: Curso): void {
    this.cursoSeleccionado = curso;
  }

  volverAlCatalogo(): void {
    this.cursoSeleccionado = null;
  }

  seleccionarFiltroRapido(id: string): void {
    this.filtroRapidoActivo = id;
  }

  alternarCategoria(id: string): void {
    this.categoriaActiva = this.categoriaActiva === id ? null : id;
  }

  alternarNivel(id: string): void {
    this.nivelActivo = this.nivelActivo === id ? null : id;
  }

  alternarFormato(id: string): void {
    this.formatoActivo = this.formatoActivo === id ? null : id;
  }

  /** Escuelas ya filtradas por búsqueda/categoría/nivel/formato, listas para pintar. */
  get escuelasFiltradas(): EscuelaCursos[] {
    const termino = this.terminoBusqueda.trim().toLowerCase();

    return this.escuelas
      .map((escuela) => ({
        ...escuela,
        cursos: escuela.cursos.filter((curso) => {
          const coincideBusqueda =
            !termino || curso.titulo.toLowerCase().includes(termino);

          const coincideCategoria =
            !this.categoriaActiva || curso.categoria === this.categoriaActiva;

          const coincideNivel =
            !this.nivelActivo ||
            curso.nivel.toLowerCase() ===
              this.niveles.find((n) => n.id === this.nivelActivo)?.etiqueta.toLowerCase();

          const coincideFormato =
            !this.formatoActivo ||
            curso.formato.toLowerCase() ===
              this.formatos.find((f) => f.id === this.formatoActivo)?.etiqueta.toLowerCase();

          return (
            coincideBusqueda && coincideCategoria && coincideNivel && coincideFormato
          );
        }),
      }))
      .filter((escuela) => escuela.cursos.length > 0);
  }

  textoProgreso(curso: Curso): string {
    return curso.progreso > 0
      ? `${curso.progreso}% completado`
      : 'Aún no has comenzado este curso.';
  }
}
