import { ActivatedRoute } from '@angular/router';
import { AgendaComponent } from './agenda.component';

describe('AgendaComponent', () => {
  function createComponent(queryParams: Record<string, string> = {}) {
    const activatedRouteMock = {
      snapshot: { queryParamMap: { get: (key: string) => queryParams[key] ?? null } },
    };
    return new AgendaComponent(activatedRouteMock as unknown as ActivatedRoute);
  }

  it('should create the component when instantiated', () => {
    // Act
    const component = createComponent();

    // Assert
    expect(component).toBeTruthy();
  });

  it('should default onlyMine to false when the query param is absent', () => {
    // Arrange
    const component = createComponent();

    // Act
    component.ngOnInit();

    // Assert
    expect(component.onlyMine).toBe(false);
  });

  it('should set onlyMine to true when the query param is "true"', () => {
    // Arrange
    const component = createComponent({ onlyMine: 'true' });

    // Act
    component.ngOnInit();

    // Assert
    expect(component.onlyMine).toBe(true);
  });

  it('should set onlyMine to false when the query param has any other value', () => {
    // Arrange
    const component = createComponent({ onlyMine: 'yes' });

    // Act
    component.ngOnInit();

    // Assert
    expect(component.onlyMine).toBe(false);
  });
});
