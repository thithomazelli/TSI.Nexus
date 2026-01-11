import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthorizationGuard } from './core/guards/authorization.guard';
import { HomeComponent } from './home/home.component';
import { NotFoundComponent } from './shared/components/errors/not-found/not-found.component';

const routes: Routes = [
  // =========================
  // Rotas públicas
  // =========================
  {
    path: 'account',
    loadChildren: () =>
      import('./account/account.module').then((m) => m.AccountModule),
  },

  // =========================
  // Rotas protegidas (lazy)
  // =========================
  {
    path: 'clients',
    canActivate: [AuthorizationGuard],
    loadChildren: () =>
      import('./clients/clients.module').then((m) => m.ClientsModule),
  },
  {
    path: 'companies',
    canActivate: [AuthorizationGuard],
    loadChildren: () =>
      import('./clients/clients.module').then((m) => m.ClientsModule),
  },
  {
    path: 'individuals',
    canActivate: [AuthorizationGuard],
    loadChildren: () =>
      import('./clients/clients.module').then((m) => m.ClientsModule),
  },
  {
    path: 'products',
    canActivate: [AuthorizationGuard],
    loadChildren: () =>
      import('./products/products.module').then((m) => m.ProductsModule),
  },
  {
    path: 'orders',
    canActivate: [AuthorizationGuard],
    loadChildren: () =>
      import('./orders/orders.module').then((m) => m.OrdersModule),
  },
  {
    path: 'users',
    canActivate: [AuthorizationGuard],
    loadChildren: () =>
      import('./users/users.module').then((m) => m.UsersModule),
  },

  // =========================
  // Home protegida
  // =========================
  {
    path: '',
    canActivate: [AuthorizationGuard],
    component: HomeComponent,
  },
  {
    path: 'home',
    canActivate: [AuthorizationGuard],
    component: HomeComponent,
  },

  // =========================
  // Not Found protegida
  // =========================
  {
    path: 'not-found',
    canActivate: [AuthorizationGuard],
    component: NotFoundComponent,
  },
  {
    path: '**',
    redirectTo: 'not-found',
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      scrollPositionRestoration: 'enabled',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
