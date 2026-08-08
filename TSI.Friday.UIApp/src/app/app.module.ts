import { NgModule, isDevMode } from '@angular/core';

import {
  HTTP_INTERCEPTORS,
  HttpClientModule,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';

import { BrowserModule } from '@angular/platform-browser';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { JwtInterceptor } from './core';
import { ErrorInterceptor } from './core/interceptors/error.interceptor';

import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { ToastrModule } from 'ngx-toastr';

import { HomeComponent } from './home/home.component';
import { SharedModule } from './shared/shared.module';

import { CurrencyFormatDirective } from './core/directives/currency-format.directive';
import { NavbarModule } from './navbar/navbar.module';
import { ServiceWorkerModule } from '@angular/service-worker';

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

@NgModule({
  declarations: [AppComponent, HomeComponent],
  imports: [
    AppRoutingModule,
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    CurrencyFormatDirective,
    SharedModule,
    NavbarModule,
    NgxMaskDirective,
    ToastrModule.forRoot({
      positionClass: 'toast-top-right',
      timeOut: 4000,
      closeButton: true,
      progressBar: true,
      preventDuplicates: true,
      toastClass: 'ngx-toastr toast-slide',
    }),
    
      ServiceWorkerModule.register('ngsw-worker.js', {
        enabled: !isDevMode(),
        // Register the ServiceWorker as soon as the application is stable
        // or after 30 seconds (whichever comes first).
        registrationStrategy: 'registerWhenStable:30000'
      })
    ,
  ],
  providers: [
    providePrimeNG({
      theme: {
        preset: Aura,
      },
    }),
    provideNgxMask(),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
  exports: [],
})
export class AppModule {}
