import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Vehicle, VehicleService } from '@friday/core';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-vehicle-details-page',
  templateUrl: './vehicle-details-page.component.html',
  styleUrl: './vehicle-details-page.component.scss',
  standalone: false,
})
export class VehicleDetailsPageComponent implements OnInit, OnDestroy {
  isEdit = false;
  data?: Vehicle | null = null;
  loading = false;

  private _destroy$ = new Subject<void>();

  constructor(
    private activatedRoute: ActivatedRoute,
    private vehicleService: VehicleService,
    private routerService: Router,
  ) {}

  ngOnInit(): void {
    this.activatedRoute.paramMap
      .pipe(takeUntil(this._destroy$))
      .subscribe((paramMap) => {
        const idParam = paramMap.get('id');

        if (idParam && idParam !== 'new') {
          this.isEdit = true;
          this.getVehicleById(idParam);
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

  private getVehicleById(id: string): void {
    this.loading = true;
    this.vehicleService
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
