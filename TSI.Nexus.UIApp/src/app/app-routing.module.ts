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
    canActivateChild: [AuthorizationGuard],
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
    canActivateChild: [AuthorizationGuard],
    loadChildren: () =>
      import('./orders/orders.module').then((m) => m.OrdersModule),
  },
  {
    path: 'order-products',
    canActivateChild: [AuthorizationGuard],
    loadChildren: () =>
      import('./order-products/order-products.module').then(
        (m) => m.OrderProductsModule,
      ),
  },
  {
    path: 'payments',
    canActivateChild: [AuthorizationGuard],
    loadChildren: () =>
      import('./payments/payments.module').then((m) => m.PaymentsModule),
  },
  {
    path: 'products',
    canActivateChild: [AuthorizationGuard],
    loadChildren: () =>
      import('./products/products.module').then((m) => m.ProductsModule),
  },
  {
    path: 'quotes',
    canActivateChild: [AuthorizationGuard],
    loadChildren: () =>
      import('./quotes/quotes.module').then((m) => m.QuotesModule),
  },
  {
    path: 'reports',
    canActivateChild: [AuthorizationGuard],
    loadChildren: () =>
      import('./reports/reports.module').then((m) => m.ReportsModule),
  },
  {
    path: 'suppliers',
    canActivateChild: [AuthorizationGuard],
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
    runGuardsAndResolvers: 'always',
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
