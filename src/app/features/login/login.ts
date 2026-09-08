import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private fb          = inject(FormBuilder);
  private authService = inject(AuthService);
  private router      = inject(Router);

  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  isLoading    = signal(false);
  errorMessage = signal<string | null>(null);
  showPassword = signal(false);
  currentYear  = new Date().getFullYear();

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.form.getRawValue() as any).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);

        if (err.status === 0) {
          this.errorMessage.set(
            'Cannot reach the server. Ensure the backend is running on port 8081 ' +
            'and you started the frontend with: ng serve'
          );
        } else if (err.status === 401) {
          this.errorMessage.set('Invalid email or password. Please try again.');
        } else if (err.status === 400) {
          const detail = err.error?.message ?? err.error?.validationErrors
            ? JSON.stringify(err.error.validationErrors)
            : '';
          this.errorMessage.set(`Invalid request${detail ? ': ' + detail : ''}. Please check your input.`);
        } else if (err.status === 403) {
          this.errorMessage.set('Your account is disabled. Contact your administrator.');
        } else if (err.status === 404) {
          this.errorMessage.set('Login endpoint not found (404). Check the API path configuration.');
        } else if (err.status >= 500) {
          this.errorMessage.set('Server error. Please try again later.');
        } else {
          this.errorMessage.set(`Login failed (HTTP ${err.status || 'unknown'}). Please try again.`);
        }
      }
    });
  }

  get email()    { return this.form.get('email')!; }
  get password() { return this.form.get('password')!; }
}
