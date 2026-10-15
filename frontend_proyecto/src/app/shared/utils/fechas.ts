const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const DIA_MS = 86_400_000;

/** Acepta 'YYYY-MM-DD' (fecha local) o una fecha ISO completa. */
export function parsearFecha(valor: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const [anio, mes, dia] = valor.split('-').map(Number);
    return new Date(anio, mes - 1, dia);
  }
  return new Date(valor);
}

export function formatearFecha(valor: string | null | undefined): string {
  if (!valor) {
    return '—';
  }
  const fecha = parsearFecha(valor);
  return `${fecha.getDate()} ${MESES[fecha.getMonth()]} ${fecha.getFullYear()}`;
}

export function formatearFechaHora(valor: string | null | undefined): string {
  if (!valor) {
    return '—';
  }
  const fecha = parsearFecha(valor);
  const hora = String(fecha.getHours()).padStart(2, '0');
  const minutos = String(fecha.getMinutes()).padStart(2, '0');
  return `${formatearFecha(valor)}, ${hora}:${minutos}`;
}

export function diasDesde(valor: string, ahora = Date.now()): number {
  return (ahora - parsearFecha(valor).getTime()) / DIA_MS;
}

export function tiempoRelativo(valor: string | null | undefined, ahora = Date.now()): string {
  if (!valor) {
    return 'Nunca';
  }

  const minutos = Math.floor((ahora - parsearFecha(valor).getTime()) / 60_000);
  if (minutos < 1) return 'Hace un momento';
  if (minutos < 60) return `Hace ${minutos} min`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `Hace ${horas} h`;

  const dias = Math.floor(horas / 24);
  if (dias < 30) return dias === 1 ? 'Hace 1 día' : `Hace ${dias} días`;

  const meses = Math.floor(dias / 30);
  if (meses < 12) return meses === 1 ? 'Hace 1 mes' : `Hace ${meses} meses`;

  const anios = Math.floor(dias / 365);
  return anios <= 1 ? 'Hace 1 año' : `Hace ${anios} años`;
}
