import { Component, DestroyRef, WritableSignal, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService, EstadoUsuario, Rol } from '../../../services/auth';
import {
  ETIQUETA_ACCION,
  ETIQUETA_ESTADO,
  ETIQUETA_ROL,
  MOTIVO_MIN_CARACTERES,
  NOMBRE_MIN_CARACTERES,
  PASSWORD_PATRON,
  UsuarioLista,
  UsuariosService,
} from '../../../services/usuarios';
import { IconComponent } from '../../../shared/components/icon/icon';
import { ModalComponent } from '../../../shared/components/modal/modal';
import { AccionMenu, RowMenuComponent } from '../../../shared/components/row-menu/row-menu';
import { ToastService } from '../../../shared/services/toast';
import { diasDesde, formatearFecha, formatearFechaHora, parsearFecha, tiempoRelativo } from '../../../shared/utils/fechas';
import { exportarCsv, exportarExcel } from '../../../shared/utils/exportar';
import { enlazarConShell } from '../../../shared/utils/lista';

type TipoModal = 'perfil' | 'actividad' | 'rol' | 'bloquear' | 'reset' | 'eliminar' | 'formulario';
type FiltroEstado = EstadoUsuario | '';
type FiltroRegistro = '' | '7' | '30' | '90' | 'rango';
type FiltroActividad = '' | 'reciente7' | 'reciente30' | 'inactivo30' | 'nunca';

interface EstadoModal {
  tipo: TipoModal;
  usuario: UsuarioLista | null;
}

interface EventoActividad {
  fecha: string;
  titulo: string;
  detalle?: string;
}

const TAMANO_PAGINA = 8;
const MENSAJES_ERROR: Record<string, string> = {
  nombre: `Mínimo ${NOMBRE_MIN_CARACTERES} caracteres.`,
  apellido: `Mínimo ${NOMBRE_MIN_CARACTERES} caracteres.`,
  email: 'Escribe un correo válido.',
  password: 'Mínimo 8 caracteres, con mayúscula, minúscula y número.',
};

const normalizar = (texto: string): string =>
  texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

@Component({
  selector: 'app-admin-usuarios',
  imports: [FormsModule, ReactiveFormsModule, IconComponent, ModalComponent, RowMenuComponent],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class AdminUsuariosComponent {
  private usuariosService = inject(UsuariosService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private fb = inject(FormBuilder).nonNullable;

  readonly roles: { valor: Rol; etiqueta: string; descripcion: string }[] = [
    { valor: 'admin', etiqueta: ETIQUETA_ROL.admin, descripcion: 'Acceso completo al panel de administración.' },
    { valor: 'user', etiqueta: ETIQUETA_ROL.user, descripcion: 'Acceso a la plataforma sin permisos de administración.' },
  ];
  readonly pestanas: { valor: FiltroEstado; etiqueta: string }[] = [
    { valor: '', etiqueta: 'Todos' },
    { valor: 'activo', etiqueta: 'Activos' },
    { valor: 'bloqueado', etiqueta: 'Bloqueados' },
    { valor: 'pendiente', etiqueta: 'Pendientes' },
    { valor: 'suspendido', etiqueta: 'Suspendidos' },
  ];
  readonly accionesExportar: AccionMenu[] = [
    { id: 'excel', etiqueta: 'Excel (.xlsx)', icono: 'file-text' },
    { id: 'csv', etiqueta: 'CSV (.csv)', icono: 'file-text' },
  ];
  readonly esqueletos = [1, 2, 3, 4, 5, 6];
  readonly etiquetaRol = ETIQUETA_ROL;
  readonly etiquetaEstado = ETIQUETA_ESTADO;
  readonly motivoMin = MOTIVO_MIN_CARACTERES;
  readonly adminEmail = this.authService.obtenerUsuario()?.email ?? '';

  usuarios = signal<UsuarioLista[]>(this.usuariosService.listar());
  cargando = signal(true);

  busqueda = signal('');
  filtroRol = signal<Rol | ''>('');
  filtroEstado = signal<FiltroEstado>('');
  filtroRegistro = signal<FiltroRegistro>('');
  fechaDesde = signal('');
  fechaHasta = signal('');
  filtroActividad = signal<FiltroActividad>('');
  avanzados = signal(false);
  pagina = signal(1);

  modal = signal<EstadoModal | null>(null);
  motivo = signal('');
  rolSeleccionado = signal<Rol>('user');
  errorModal = signal('');
  formulario = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(NOMBRE_MIN_CARACTERES)]],
    apellido: ['', [Validators.required, Validators.minLength(NOMBRE_MIN_CARACTERES)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.pattern(PASSWORD_PATRON)]],
    rol: ['user' as Rol, Validators.required],
    telefono: [''],
    documento: [''],
  });

  filtrosAvanzadosActivos = computed(
    () => (this.filtroRegistro() ? 1 : 0) + (this.filtroActividad() ? 1 : 0)
  );
  hayFiltros = computed(
    () => !!(this.busqueda().trim() || this.filtroRol() || this.filtroEstado() || this.filtrosAvanzadosActivos())
  );

  private baseFiltrada = computed(() => {
    const texto = normalizar(this.busqueda().trim());
    const rol = this.filtroRol();
    const registro = this.filtroRegistro();
    const actividad = this.filtroActividad();
    const desde = this.fechaDesde() ? parsearFecha(this.fechaDesde()).getTime() : null;
    const hasta = this.fechaHasta() ? parsearFecha(this.fechaHasta()).getTime() + 86_399_999 : null;

    return this.usuarios()
      .filter((u) => {
        if (texto && !normalizar(`${this.nombreCompleto(u)} ${u.email} ${u.documento ?? ''}`).includes(texto)) return false;
        if (rol && u.rol !== rol) return false;

        if (registro && u.fechaRegistro) {
          if (registro === 'rango') {
            const fecha = parsearFecha(u.fechaRegistro).getTime();
            if ((desde !== null && fecha < desde) || (hasta !== null && fecha > hasta)) return false;
          } else if (diasDesde(u.fechaRegistro) > Number(registro)) {
            return false;
          }
        }

        if (actividad) {
          const acceso = u.ultimoAcceso;
          if (actividad === 'nunca' && acceso) return false;
          if (actividad === 'reciente7' && !(acceso && diasDesde(acceso) <= 7)) return false;
          if (actividad === 'reciente30' && !(acceso && diasDesde(acceso) <= 30)) return false;
          if (actividad === 'inactivo30' && !(acceso && diasDesde(acceso) > 30)) return false;
        }
        return true;
      })
      .sort((a, b) => this.nombreCompleto(a).localeCompare(this.nombreCompleto(b), 'es'));
  });

  conteos = computed<Record<string, number>>(() => {
    const base = this.baseFiltrada();
    return {
      '': base.length,
      activo: base.filter((u) => u.estado === 'activo').length,
      bloqueado: base.filter((u) => u.estado === 'bloqueado').length,
      pendiente: base.filter((u) => u.estado === 'pendiente').length,
      suspendido: base.filter((u) => u.estado === 'suspendido').length,
    };
  });

  filtrados = computed(() => {
    const estado = this.filtroEstado();
    return estado ? this.baseFiltrada().filter((u) => u.estado === estado) : this.baseFiltrada();
  });

  totalPaginas = computed(() => Math.max(1, Math.ceil(this.filtrados().length / TAMANO_PAGINA)));
  paginaActual = computed(() => Math.min(this.pagina(), this.totalPaginas()));
  rango = computed(() => {
    const inicio = (this.paginaActual() - 1) * TAMANO_PAGINA;
    return { desde: inicio + 1, hasta: Math.min(inicio + TAMANO_PAGINA, this.filtrados().length) };
  });

  filas = computed(() => {
    const inicio = (this.paginaActual() - 1) * TAMANO_PAGINA;
    return this.filtrados()
      .slice(inicio, inicio + TAMANO_PAGINA)
      .map((usuario) => ({ usuario, acciones: this.accionesDe(usuario) }));
  });

  eventosActividad = computed<EventoActividad[]>(() => {
    const actual = this.modal();
    if (actual?.tipo !== 'actividad' || !actual.usuario) {
      return [];
    }

    const usuario = actual.usuario;
    const eventos: EventoActividad[] = this.usuariosService.actividadDe(usuario.email).map((registro) => ({
      fecha: registro.fecha,
      titulo: ETIQUETA_ACCION[registro.accion],
      detalle: `${registro.motivo} Por ${registro.admin}.`,
    }));
    if (usuario.ultimoAcceso) {
      eventos.push({ fecha: usuario.ultimoAcceso, titulo: 'Último inicio de sesión' });
    }
    if (usuario.fechaRegistro) {
      eventos.push({ fecha: usuario.fechaRegistro, titulo: 'Cuenta registrada' });
    }
    return eventos.sort((a, b) => b.fecha.localeCompare(a.fecha));
  });

  constructor() {
    enlazarConShell(
      (termino) => {
        this.busqueda.set(termino);
        this.pagina.set(1);
      },
      () => this.abrirModal('formulario')
    );

    // TODO: al conectar el backend, esta espera se reemplaza por el estado real de la petición HTTP.
    const temporizador = setTimeout(() => this.cargando.set(false), 700);
    inject(DestroyRef).onDestroy(() => clearTimeout(temporizador));
  }

  nombreCompleto(usuario: UsuarioLista): string {
    return `${usuario.nombre} ${usuario.apellido ?? ''}`.trim();
  }

  iniciales(usuario: UsuarioLista): string {
    return this.nombreCompleto(usuario)
      .split(' ')
      .slice(0, 2)
      .map((parte) => parte[0]?.toUpperCase() ?? '')
      .join('');
  }

  esMiCuenta(usuario: UsuarioLista): boolean {
    return usuario.email.toLowerCase() === this.adminEmail.toLowerCase();
  }

  esEdicion(): boolean {
    const actual = this.modal();
    return actual?.tipo === 'formulario' && actual.usuario !== null;
  }

  ultimoAcceso(usuario: UsuarioLista): string {
    return tiempoRelativo(usuario.ultimoAcceso);
  }

  fecha(valor: string | null | undefined): string {
    return formatearFecha(valor);
  }

  fechaHora(valor: string | null | undefined): string {
    return formatearFechaHora(valor);
  }

  filtrar<T>(senal: WritableSignal<T>, valor: T): void {
    senal.set(valor);
    this.pagina.set(1);
  }

  limpiarFiltros(): void {
    this.busqueda.set('');
    this.filtroRol.set('');
    this.filtroEstado.set('');
    this.filtroRegistro.set('');
    this.fechaDesde.set('');
    this.fechaHasta.set('');
    this.filtroActividad.set('');
    this.pagina.set(1);
  }

  cambiarPagina(delta: number): void {
    this.pagina.set(Math.min(Math.max(1, this.paginaActual() + delta), this.totalPaginas()));
  }

  accionesDe(usuario: UsuarioLista): AccionMenu[] {
    const propia = this.esMiCuenta(usuario);
    const reactivable = usuario.estado === 'bloqueado' || usuario.estado === 'suspendido';

    const acciones: AccionMenu[] = [
      { id: 'perfil', etiqueta: 'Ver perfil', icono: 'eye' },
      { id: 'editar', etiqueta: 'Editar', icono: 'pencil', deshabilitado: propia },
      { id: 'rol', etiqueta: 'Cambiar rol', icono: 'shield-check', deshabilitado: propia },
      { id: 'actividad', etiqueta: 'Ver actividad', icono: 'activity' },
    ];

    if (reactivable) {
      acciones.push({
        id: 'desbloquear',
        etiqueta: usuario.estado === 'bloqueado' ? 'Desbloquear' : 'Reactivar cuenta',
        icono: 'unlock',
        separador: true,
      });
    }
    if (usuario.estado !== 'bloqueado') {
      acciones.push({ id: 'bloquear', etiqueta: 'Bloquear', icono: 'ban', separador: !reactivable, deshabilitado: propia });
    }

    acciones.push(
      { id: 'reset', etiqueta: 'Restablecer contraseña', icono: 'key', deshabilitado: propia },
      { id: 'eliminar', etiqueta: 'Eliminar', icono: 'trash', peligro: true, separador: true, deshabilitado: propia }
    );
    return acciones;
  }

  alElegirAccion(id: string, usuario: UsuarioLista): void {
    switch (id) {
      case 'perfil':
      case 'actividad':
      case 'reset':
      case 'eliminar':
        this.abrirModal(id, usuario);
        break;
      case 'editar':
        this.abrirModal('formulario', usuario);
        break;
      case 'rol':
        this.rolSeleccionado.set(usuario.rol);
        this.abrirModal('rol', usuario);
        break;
      case 'bloquear':
        this.motivo.set('');
        this.abrirModal('bloquear', usuario);
        break;
      case 'desbloquear':
        this.desbloquear(usuario);
        break;
    }
  }

  abrirModal(tipo: TipoModal, usuario: UsuarioLista | null = null): void {
    this.errorModal.set('');

    if (tipo === 'formulario') {
      this.formulario.enable();
      if (usuario) {
        this.formulario.reset({
          nombre: usuario.nombre,
          apellido: usuario.apellido ?? '',
          email: usuario.email,
          rol: usuario.rol,
          telefono: usuario.telefono ?? '',
          documento: usuario.documento ?? '',
        });
        // El correo no se edita y el rol se cambia desde su propia acción.
        this.formulario.controls.email.disable();
        this.formulario.controls.password.disable();
        this.formulario.controls.rol.disable();
      } else {
        this.formulario.reset({ rol: 'user' });
      }
    }

    this.modal.set({ tipo, usuario });
  }

  cerrarModal(): void {
    this.modal.set(null);
  }

  errorDe(campo: 'nombre' | 'apellido' | 'email' | 'password'): string {
    const control = this.formulario.controls[campo];
    return control.touched && control.invalid ? MENSAJES_ERROR[campo] : '';
  }

  guardarFormulario(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.errorModal.set('Revisa los campos marcados.');
      return;
    }

    const valores = this.formulario.getRawValue();
    const edicion = this.modal()?.usuario;
    const resultado = edicion
      ? this.usuariosService.editar(edicion.email, valores, this.adminEmail)
      : this.usuariosService.crear(valores, this.adminEmail);

    if (!resultado.exito) {
      this.errorModal.set(resultado.mensaje ?? 'No se pudo guardar el usuario.');
      return;
    }

    this.toastService.success(edicion ? 'Usuario actualizado correctamente.' : 'Usuario creado correctamente.');
    this.finalizar();
  }

  guardarRol(): void {
    const usuario = this.modal()?.usuario;
    if (!usuario) return;

    this.ejecutar(
      this.usuariosService.cambiarRol(usuario.email, this.rolSeleccionado(), this.adminEmail),
      `Rol de ${this.nombreCompleto(usuario)} actualizado.`
    );
  }

  confirmarBloqueo(): void {
    const usuario = this.modal()?.usuario;
    if (!usuario) return;

    this.ejecutar(
      this.usuariosService.bloquear(usuario.email, this.motivo(), this.adminEmail),
      `Cuenta de ${this.nombreCompleto(usuario)} bloqueada.`
    );
  }

  desbloquear(usuario: UsuarioLista): void {
    const resultado = this.usuariosService.desbloquear(usuario.email, this.adminEmail);
    if (!resultado.exito) {
      this.toastService.error(resultado.mensaje ?? 'No se pudo desbloquear la cuenta.');
      return;
    }
    this.toastService.success(`Cuenta de ${this.nombreCompleto(usuario)} reactivada.`);
    this.refrescar();
  }

  confirmarReset(): void {
    const usuario = this.modal()?.usuario;
    if (!usuario) return;

    this.ejecutar(
      this.usuariosService.restablecerPassword(usuario.email, this.adminEmail),
      `Enlace de restablecimiento enviado a ${usuario.email}.`
    );
  }

  confirmarEliminacion(): void {
    const usuario = this.modal()?.usuario;
    if (!usuario) return;

    this.ejecutar(
      this.usuariosService.eliminar(usuario.email, this.adminEmail),
      `Cuenta de ${this.nombreCompleto(usuario)} eliminada.`
    );
  }

  exportar(formato: string): void {
    const filas = this.filtrados().map((u) => ({
      Nombre: this.nombreCompleto(u),
      Correo: u.email,
      Documento: u.documento ?? '',
      Teléfono: u.telefono ?? '',
      Rol: ETIQUETA_ROL[u.rol],
      Estado: ETIQUETA_ESTADO[u.estado ?? 'activo'],
      'Último acceso': u.ultimoAcceso ? formatearFechaHora(u.ultimoAcceso) : 'Nunca',
      'Fecha de registro': formatearFecha(u.fechaRegistro),
    }));

    if (filas.length === 0) {
      this.toastService.info('No hay usuarios para exportar con los filtros actuales.');
      return;
    }

    if (formato === 'excel') {
      exportarExcel('usuarios-financeup', 'Usuarios', filas);
    } else {
      exportarCsv('usuarios-financeup', filas);
    }
    this.toastService.success(`Se exportaron ${filas.length} usuarios.`);
  }

  private ejecutar(resultado: { exito: boolean; mensaje?: string }, exito: string): void {
    if (!resultado.exito) {
      this.errorModal.set(resultado.mensaje ?? 'No se pudo completar la acción.');
      return;
    }
    this.toastService.success(exito);
    this.finalizar();
  }

  private finalizar(): void {
    this.cerrarModal();
    this.refrescar();
  }

  private refrescar(): void {
    this.usuarios.set(this.usuariosService.listar());
  }
}
