import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Driver, DriverService } from '@friday/core';
import { Subject, takeUntil } from 'rxjs';
import { HeaderComponent } from '../../../shared/header/header.component';
import { DriverFormComponent } from '../driver-form/driver-form.component';
import { ServiceOrderListComponent } from '../service-order-list/service-order-list.component';
import { TripsComponent } from '../../../trips/trips.component';
import { PaymentsComponent } from '../../../payments/payments.component';
import { AuditTabComponent } from '../../../shared/components/audit-tab/audit-tab.component';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';

@Component({
    selector: 'app-driver-details-page',
    templateUrl: './driver-details-page.component.html',
    styleUrl: './driver-details-page.component.scss',
    imports: [
        HeaderComponent,
        DriverFormComponent,
        ServiceOrderListComponent,
        TripsComponent,
        PaymentsComponent,
        AuditTabComponent,
        TranslatePipe,
    ],
})
export class DriverDetailsPageComponent implements OnInit, OnDestroy {
  isEdit = false;
  data?: Driver | null = null;
  loading = false;
  activeTab: 'details' | 'serviceOrders' | 'trips' | 'payments' | 'audit' =
    'details';

  private _destroy$ = new Subject<void>();

  constructor(
    private activatedRoute: ActivatedRoute,
    private driverService: DriverService,
    private routerService: Router,
  ) {}

  ngOnInit(): void {
    this.activatedRoute.paramMap
      .pipe(takeUntil(this._destroy$))
      .subscribe((paramMap) => {
        const idParam = paramMap.get('id');

        if (idParam && idParam !== 'new') {
          this.isEdit = true;
          this.getDriverById(idParam);
        } else {
          this.isEdit = false;
          this.data = null;
        }
      });
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  private getDriverById(id: string): void {
    this.loading = true;
    this.driverService
      .getById(id)
      .pipe(takeUntil(this._destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false;
          if (response.data == null) {
            this.routerService.navigateByUrl('/not-found');
            return;
          }
          this.data = response.data;
        },
        error: () => {
          this.loading = false;
          this.routerService.navigateByUrl('/not-found');
        },
      });
  }
}
