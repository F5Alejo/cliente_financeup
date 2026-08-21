import { Injectable } from '@angular/core';
import { Curso, EscuelaCursos } from '../pages/educacion/educacion/educacion.model';

@Injectable({
  providedIn: 'root'
})
export class EducacionService {
  // TODO: reemplazar por llamadas HTTP al backend real cuando esté listo.
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

  agregarCurso(escuelaId: string, curso: Curso): void {
    const escuela = this.escuelas.find((e) => e.id === escuelaId);
    if (escuela) {
      escuela.cursos.push(curso);
    }
  }

  editarCurso(cursoId: string, cambios: Partial<Curso>): void {
    for (const escuela of this.escuelas) {
      const curso = escuela.cursos.find((c) => c.id === cursoId);
      if (curso) {
        Object.assign(curso, cambios);
        return;
      }
    }
  }

  eliminarCurso(cursoId: string): void {
    for (const escuela of this.escuelas) {
      escuela.cursos = escuela.cursos.filter((c) => c.id !== cursoId);
    }
  }
}
