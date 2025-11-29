import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthorizationGuard } from './core';

import { NotFoundComponent } from './shared/components/errors/not-found/not-found.component';
import { PlayComponent } from './play/play.component';
import { HomeComponent } from './home/home.component';
import { ProductsComponent } from './products/products.component';

const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    runGuardsAndResolvers: 'always',
    canActivate: [AuthorizationGuard],
  },
  {
    path: 'home',
    redirectTo: '',
    runGuardsAndResolvers: 'always',
    canActivate: [AuthorizationGuard],
  },
  {
    path: 'play',
    component: PlayComponent,
    runGuardsAndResolvers: 'always',
    canActivate: [AuthorizationGuard],
  },
  {
    path: 'products',
    component: ProductsComponent,
    runGuardsAndResolvers: 'always',
    canActivate: [AuthorizationGuard],
  },
  // Implementing lazy loading by the following format
  {
    path: 'account',
    loadChildren: () =>
      import('./account/account.module').then((module) => module.AccountModule),
  },
  { path: 'not-found', component: NotFoundComponent },
  { path: '**', component: NotFoundComponent, pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
