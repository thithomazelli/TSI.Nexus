import { NgModule } from '@angular/core';

import {
  HTTP_INTERCEPTORS,
  HttpClientModule,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

import { BrowserModule } from '@angular/platform-browser';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HomeComponent } from './home/home.component';
import { SharedModule } from './shared/shared.module';
import { PlayComponent } from './play/play.component';

import { ProductsComponent } from './products/products.component';
import { JwtInterceptor } from './core';

import { AgGridModule } from 'ag-grid-angular';

// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

@NgModule({
  declarations: [AppComponent, HomeComponent, PlayComponent, ProductsComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    SharedModule,
    AgGridModule,
  ],
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
