/**
 * Datos de contacto de soporte, en un solo lugar para que la línea de ayuda,
 * "Habla con nosotros" y el centro de ayuda muestren siempre lo mismo.
 */
export const CONTACTO = {
  /** Número de la línea de ayuda, como se muestra en pantalla. */
  telefono: '+57 300 735 7662',
  /** El mismo número para el enlace tel: (sin espacios). */
  telefonoEnlace: '+573007357662',
  /** WhatsApp en formato internacional sin '+', como lo pide wa.me. */
  whatsapp: '573102257759',
  horarioLinea: '7 a.m. – 9 p.m.',
  diasLinea: 'Lunes a sábado',
  horarioWhatsapp: '6 a.m. – 6 p.m.',
  diasWhatsapp: 'Todos los días',
  respuestaPqr: '48 h hábiles',
} as const;

/** Enlace de WhatsApp con un primer mensaje ya escrito. */
export function enlaceWhatsapp(mensaje = 'Hola, tengo una duda sobre sus servicios.'): string {
  return `https://wa.me/${CONTACTO.whatsapp}?text=${encodeURIComponent(mensaje)}`;
}
