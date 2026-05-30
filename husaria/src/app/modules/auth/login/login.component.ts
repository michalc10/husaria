import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: false
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  currentPassword = '';
  newPassword = '';
  repeatedPassword = '';
  loading = false;
  changePasswordMode = false;
  errorMessage = '';
  showPassword = false;

  constructor(
    readonly authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private transloco: TranslocoService
  ) {}

  ngOnInit(): void {
    this.changePasswordMode = this.route.snapshot.queryParamMap.get('changePassword') === '1';

    this.authService.loadCurrentUser().subscribe(user => {
      if (!user) return;

      if (user.mustChangePassword) {
        this.changePasswordMode = true;
        return;
      }

      this.navigateAfterLogin();
    });
  }

  login(): void {
    this.errorMessage = '';

    if (!this.email.trim() || !this.password) {
      this.errorMessage = this.transloco.translate('auth.requiredCredentials');
      return;
    }

    this.loading = true;
    this.authService.login(this.email, this.password).subscribe({
      next: (user) => {
        this.loading = false;
        if (user.mustChangePassword) {
          this.currentPassword = this.password;
          this.password = '';
          this.changePasswordMode = true;
          return;
        }

        this.navigateAfterLogin();
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.message || this.transloco.translate('auth.loginError');
      }
    });
  }

  changePassword(): void {
    this.errorMessage = '';

    if (!this.currentPassword || !this.newPassword || !this.repeatedPassword) {
      this.errorMessage = this.transloco.translate('auth.requiredPasswordFields');
      return;
    }

    if (this.newPassword !== this.repeatedPassword) {
      this.errorMessage = this.transloco.translate('auth.passwordMismatch');
      return;
    }

    this.loading = true;
    this.authService.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.loading = false;
        this.navigateAfterLogin();
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.message || this.transloco.translate('auth.changePasswordError');
      }
    });
  }

  private navigateAfterLogin(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    this.router.navigateByUrl(returnUrl && returnUrl !== '/login' ? returnUrl : '/league');
  }
}
