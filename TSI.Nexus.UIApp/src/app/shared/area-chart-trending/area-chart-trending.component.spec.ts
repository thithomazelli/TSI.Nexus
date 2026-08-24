import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AreaChartTrendingComponent } from './area-chart-trending.component';

describe('AreaChartTrendingComponent', () => {
  let component: AreaChartTrendingComponent;
  let fixture: ComponentFixture<AreaChartTrendingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [AreaChartTrendingComponent],
}).compileComponents();

    fixture = TestBed.createComponent(AreaChartTrendingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
