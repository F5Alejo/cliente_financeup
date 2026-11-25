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
});
