import { Injectable, Injector } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { API_BASE_URL } from 'src/app/globals';
import { AuthService } from './auth.service';

@Injectable()
export class SessionInterceptor implements HttpInterceptor {
  constructor(
    private router: Router,
    private injector: Injector
  ) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const isApiRequest = req.url.startsWith(API_BASE_URL);
    const request = isApiRequest ? req.clone({ withCredentials: true }) : req;

    return next.handle(request).pipe(
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && isApiRequest && error.status === 401 && this.shouldRedirect(req.url)) {
          this.injector.get(AuthService).clearUser();
          this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
        }

        return throwError(() => error);
      })
    );
  }

  private shouldRedirect(url: string): boolean {
    if (this.router.url.startsWith('/login') || this.router.url.startsWith('/judge/')) return false;

    return !url.includes('/auth/login')
      && !url.includes('/auth/me')
      && !url.includes('/judge-station/session');
  }
}
