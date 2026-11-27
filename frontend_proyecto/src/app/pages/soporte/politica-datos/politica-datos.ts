import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BandaSeccionComponent } from '../../../shared/components/banda-seccion/banda-seccion';
import { IconComponent } from '../../../shared/components/icon/icon';
import { EDAD_MINIMA, VERSION_POLITICA, VIGENCIA_POLITICA } from '../../../shared/utils/politica';

/** Un grupo de datos que guarda FinanceUp, para qué sirve y cuánto tiempo se conserva. */
interface GrupoDatos {
  grupo: string;
  datos: string;
  paraQue: string;
  plazo: string;
}

/** Lo que la app deja en el navegador (no son cookies de publicidad ni de analítica). */
interface DatoNavegador {
  clave: string;
  guarda: string;
  dura: string;
}

/**
 * Política de tratamiento de datos personales (Ley 1581 de 2012 y Decreto 1074 de 2015).
 * El inventario sale de las tablas reales de la base (CRUD_FINANCEUP/sql): si cambia una tabla
 * con datos personales, hay que actualizar esta página y subir la versión.
 */
@Component({
  selector: 'app-politica-datos',
  imports: [RouterLink, BandaSeccionComponent, IconComponent],
  templateUrl: './politica-datos.html',
  styleUrl: './politica-datos.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoliticaDatosComponent {
  readonly version = VERSION_POLITICA;
  readonly vigencia = VIGENCIA_POLITICA;
  readonly edadMinima = EDAD_MINIMA;
  readonly correo = 'soporte@financeup.com';

  /** Índice de la página: cada id es una sección del artículo. */
  readonly indice = [
    { id: 'responsable', titulo: 'Quién responde por tus datos' },
    { id: 'datos', titulo: 'Qué datos guardamos' },
    { id: 'finalidades', titulo: 'Para qué los usamos' },
    { id: 'compartir', titulo: 'Quién más los ve' },
    { id: 'derechos', titulo: 'Tus derechos' },
    { id: 'ejercer', titulo: 'Cómo consultar, corregir o borrar' },
    { id: 'seguridad', titulo: 'Cómo los protegemos' },
    { id: 'navegador', titulo: 'Lo que queda en tu navegador' },
    { id: 'menores', titulo: 'Datos sensibles y menores de edad' },
    { id: 'vigencia', titulo: 'Vigencia y cambios' },
  ];

  readonly grupos: GrupoDatos[] = [
    {
      grupo: 'Cuenta',
      datos: 'Nombre, apellido y correo. En tu perfil, si los agregas: teléfono, tipo y número de documento, ciudad, dirección y fecha de nacimiento.',
      paraQue: 'Crear tu cuenta, identificarte y escribirte sobre ella.',
      plazo: 'Mientras tengas la cuenta.',
    },
    {
      grupo: 'Acceso y seguridad',
      datos: 'Contraseña cifrada, códigos de verificación cifrados, intentos fallidos, y la IP y el navegador de cada ingreso.',
      paraQue: 'Comprobar que eres tú, bloquear la cuenta ante intentos repetidos y revisar accesos sospechosos.',
      plazo: 'Los códigos vencen a los 10 min (ingreso) o 15 min (recuperación). El registro de ingresos se guarda mientras tengas la cuenta.',
    },
    {
      grupo: 'Finanzas',
      datos: 'Ingresos, gastos, categorías, metas de ahorro, inversiones y solicitudes de consolidación de deudas.',
      paraQue: 'Mostrarte tu libro mayor, tu panel y el avance de tus metas.',
      plazo: 'Mientras tengas la cuenta, o hasta que borres el registro.',
    },
    {
      grupo: 'Educación',
      datos: 'Cursos iniciados, lecciones completadas y certificados.',
      paraQue: 'Guardar tu avance y emitir tus certificados.',
      plazo: 'Mientras tengas la cuenta.',
    },
    {
      grupo: 'Solicitudes a aliados',
      datos: 'Nombre, documento, correo, celular, ingresos mensuales, monto y plazo que te interesan, y los mensajes con el asesor.',
      paraQue: 'Enviar tu solicitud a la entidad aliada que elegiste y hacerle seguimiento.',
      plazo: 'Mientras la solicitud y el crédito, si te lo aprueban, sigan vigentes.',
    },
    {
      grupo: 'Soporte',
      datos: 'Tus PQR, el nombre de los archivos que adjuntas y las respuestas del equipo.',
      paraQue: 'Atender y responder lo que nos pides.',
      plazo: 'Mientras tengas la cuenta.',
    },
  ];

  readonly navegador: DatoNavegador[] = [
    { clave: 'financeup_user', guarda: 'Tu sesión abierta: nombre, correo, rol y token de acceso.', dura: 'Hasta que cierres sesión o la pestaña.' },
    { clave: 'financeup_email', guarda: 'Tu correo, solo si marcas «Recordar mi correo».', dura: 'Hasta que desmarques la casilla.' },
    { clave: 'financeup_cookies', guarda: 'Lo que elegiste en el aviso de cookies.', dura: 'Hasta que borres los datos del sitio.' },
  ];
}
