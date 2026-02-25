import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthorizationGuard } from './core/guards/authorization.guard';
import { HomeComponent } from './home/home.component';
import { NotFoundComponent } from './shared/components/errors/not-found/not-found.component';

const routes: Routes = [
  {
    path: '',
    canActivate: [AuthorizationGuard],
    component: HomeComponent,
  },
  {
    path: 'account',
    loadChildren: () =>
      import('./account/account.module').then((m) => m.AccountModule),
  },
  {
    path: 'clients',
    canActivate: [AuthorizationGuard],
    loadChildren: () =>
      import('./business-partner/business-partner.module').then(
        (m) => m.BusinessPartnerModule,
      ),
  },
  {
    path: 'home',
    canActivate: [AuthorizationGuard],
    component: HomeComponent,
  },
  {
    path: 'not-found',
    canActivate: [AuthorizationGuard],
    component: NotFoundComponent,
  },
  {
    path: 'orders',
    canActivate: [AuthorizationGuard],
    loadChildren: () =>
      import('./orders/orders.module').then((m) => m.OrdersModule),
  },
  {
    path: 'payments',
    canActivate: [AuthorizationGuard],
    loadChildren: () =>
      import('./payments/payments.module').then((m) => m.PaymentsModule),
  },
  {
    path: 'products',
    canActivate: [AuthorizationGuard],
    loadChildren: () =>
      import('./products/products.module').then((m) => m.ProductsModule),
  },
  {
    path: 'suppliers',
    canActivate: [AuthorizationGuard],
    loadChildren: () =>
      import('./business-partner/business-partner.module').then(
        (m) => m.BusinessPartnerModule,
      ),
  },
  {
    path: 'transactions',
    canActivateChild: [AuthorizationGuard],
    loadChildren: () =>
      import('./transactions/transactions.module').then(
        (m) => m.TransactionsModule,
      ),
  },
  {
    path: 'users',
    canActivateChild: [AuthorizationGuard],
    loadChildren: () =>
      import('./users/users.module').then((m) => m.UsersModule),
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
