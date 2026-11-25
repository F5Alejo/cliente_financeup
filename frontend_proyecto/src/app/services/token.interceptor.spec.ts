import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { tokenInterceptor } from './token.interceptor';
import { API_URL } from './api';

describe('tokenInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: '**', children: [] }]),
        provideHttpClient(withInterceptors([tokenInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('sin sesión no manda el encabezado Authorization', () => {
    http.get(`${API_URL}/cursos`).subscribe();
    const peticion = backend.expectOne(`${API_URL}/cursos`);
    expect(peticion.request.headers.has('Authorization')).toBe(false);
    peticion.flush([]);
  });

  it('con sesión manda el token como Bearer', () => {
    sessionStorage.setItem('financeup_user', JSON.stringify({ email: 'a@b.co', nombre: 'A', rol: 'user', token: 'abc' }));
    http.get(`${API_URL}/perfil/1`).subscribe();
    const peticion = backend.expectOne(`${API_URL}/perfil/1`);
    expect(peticion.request.headers.get('Authorization')).toBe('Bearer abc');
    peticion.flush({});
  });

  it('un 401 del MID borra la sesión', () => {
    sessionStorage.setItem('financeup_user', JSON.stringify({ email: 'a@b.co', nombre: 'A', rol: 'user', token: 'abc' }));
    http.get(`${API_URL}/perfil/1`).subscribe({ error: () => {} });
    backend.expectOne(`${API_URL}/perfil/1`).flush({ error: 'La sesion vencio' }, { status: 401, statusText: 'Unauthorized' });
    expect(sessionStorage.getItem('financeup_user')).toBeNull();
  });

  it('un 400 (dato mal escrito) no cierra la sesión', () => {
    sessionStorage.setItem('financeup_user', JSON.stringify({ email: 'a@b.co', nombre: 'A', rol: 'user', token: 'abc' }));
    http.put(`${API_URL}/perfil/1/contrasena`, {}).subscribe({ error: () => {} });
    backend
      .expectOne(`${API_URL}/perfil/1/contrasena`)
      .flush({ error: 'La contrasena actual no es correcta' }, { status: 400, statusText: 'Bad Request' });
    expect(sessionStorage.getItem('financeup_user')).not.toBeNull();
  });
});
