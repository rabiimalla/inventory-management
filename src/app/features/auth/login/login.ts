import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { form, minLength, required, Field } from '@angular/forms/signals';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import { Observable, of } from 'rxjs';

import { UserParams } from '../../../core/interfaces/user.interface';
import { AuthLogin } from '../../../core/interfaces/auth-login.interface';
import { StorageService } from '../../../core/services/storage.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [Field, AsyncPipe],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Login implements OnInit {
  users$: Observable<UserParams[] | null> = of(null);
  seedPopulated = signal(false);
  private destroyRef = inject(DestroyRef);

  constructor(
    private router: Router, 
    private auth: AuthService, 
    private storage: StorageService
  ) {}

  ngOnInit(): void {
    this.users$ = this.storage.users$;
  }

  loginFormModel = signal<AuthLogin>({
    username: '',
    password: '',
  });

  /* create (signal) login form using with basic validation rules */
  loginForm = form(this.loginFormModel, (loginFormSchema) => {
    required(loginFormSchema.username, { message: 'Username is required.' });
    required(loginFormSchema.password, { message: 'Password is required.' });
    minLength(loginFormSchema.password, 8, { message: 'Password must be at least 8 characters.' });
  });

  usernameError = computed(() => {
    const field = this.loginForm.username();
    if(field.invalid() && field.touched()) {
      return field.errors()[0]?.message;
    }

    return null;
  });

  passwordError = computed(() => {
    const field = this.loginForm.password();
    if(field.invalid() && field.touched()) {
      return field.errors()[0]?.message;
    }

    return null;
  });

  handleLogin(event: SubmitEvent) {
    event.preventDefault();

    this.auth.login(
        this.loginForm().value()
      ).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).
      subscribe({
        next: () => {
          /* Navigate the user to Dashboard page. For now lets redirect to roles list page */
          this.router.navigate(['/roles']);
          console.log('User logged in successfully.');
        },
        error: (error) => {
          console.log('There is an error: ', error);
        },
      });
  }

  populate() {
    this.storage.populateDefaultRolesAndUsers();
    this.seedPopulated.set(true);
  }
}
