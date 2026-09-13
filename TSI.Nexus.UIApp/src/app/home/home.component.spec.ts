import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  it('should create the component when instantiated', () => {
    // Act
    const component = new HomeComponent();

    // Assert
    expect(component).toBeTruthy();
  });

  describe('ngAfterViewInit / ngOnDestroy', () => {
    it('should register a resize listener and remove it when the component is destroyed', async () => {
      // Arrange
      const addSpy = vi.spyOn(window, 'addEventListener');
      const removeSpy = vi.spyOn(window, 'removeEventListener');
      const component = new HomeComponent();

      // Act
      await component.ngAfterViewInit();

      // Assert
      expect(addSpy).toHaveBeenCalledWith('resize', expect.any(Function));

      // Act
      component.ngOnDestroy();

      // Assert
      expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));

      addSpy.mockRestore();
      removeSpy.mockRestore();
    });

    it('should not throw when destroyed without ever calling ngAfterViewInit', () => {
      // Arrange
      const component = new HomeComponent();

      // Act
      // Assert
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('should destroy every chart, swallowing individual chart errors, when the component is destroyed', () => {
      // Arrange
      const component = new HomeComponent();
      const destroySpy = vi.fn();
      (component as any).charts = [
        { destroy: destroySpy },
        { destroy: () => { throw new Error('boom'); } },
        {},
      ];

      // Act
      // Assert
      expect(() => component.ngOnDestroy()).not.toThrow();

      expect(destroySpy).toHaveBeenCalled();
      expect((component as any).charts).toEqual([]);
    });

    it('should unlisten the tooltip mousemove handler and clear the reference when the component is destroyed', () => {
      // Arrange
      const component = new HomeComponent();
      const unlistenSpy = vi.fn();
      (component as any).tipMousemoveUnlisten = unlistenSpy;

      // Act
      component.ngOnDestroy();

      // Assert
      expect(unlistenSpy).toHaveBeenCalled();
      expect((component as any).tipMousemoveUnlisten).toBeNull();
    });

    it('should not throw when unlistening the tooltip mousemove handler errors', () => {
      // Arrange
      const component = new HomeComponent();
      (component as any).tipMousemoveUnlisten = () => { throw new Error('boom'); };

      // Act
      // Assert
      expect(() => component.ngOnDestroy()).not.toThrow();
      expect((component as any).tipMousemoveUnlisten).toBeNull();
    });

    it('should remove the tooltip element from the document body and clear the reference when the component is destroyed', () => {
      // Arrange
      const component = new HomeComponent();
      const tipEl = document.createElement('div');
      document.body.appendChild(tipEl);
      (component as any).tipEl = tipEl;

      // Act
      component.ngOnDestroy();

      // Assert
      expect(document.body.contains(tipEl)).toBe(false);
      expect((component as any).tipEl).toBeNull();
    });

    it('should not try to remove the tooltip element when it is not attached to the body', () => {
      // Arrange
      const component = new HomeComponent();
      const tipEl = document.createElement('div');
      const otherParent = document.createElement('div');
      otherParent.appendChild(tipEl);
      (component as any).tipEl = tipEl;

      // Act
      // Assert
      expect(() => component.ngOnDestroy()).not.toThrow();

      expect((component as any).tipEl).toBeNull();
    });

    it('should not throw when removing the tooltip element errors', () => {
      // Arrange
      const component = new HomeComponent();
      const tipEl = document.createElement('div');
      document.body.appendChild(tipEl);
      Object.defineProperty(tipEl, 'parentElement', {
        get: () => {
          throw new Error('boom');
        },
      });
      (component as any).tipEl = tipEl;

      // Act
      // Assert
      expect(() => component.ngOnDestroy()).not.toThrow();
      document.body.removeChild(tipEl);
    });
  });

  describe('resize handler (via addResizeListener)', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should call updateOptions when it is available on a chart', async () => {
      // Arrange
      const component = new HomeComponent();
      const updateOptionsSpy = vi.fn();
      await component.ngAfterViewInit();
      (component as any).charts = [{ updateOptions: updateOptionsSpy }];

      // Act
      window.dispatchEvent(new Event('resize'));

      // Assert
      expect(updateOptionsSpy).toHaveBeenCalledWith({}, true, true);
      component.ngOnDestroy();
    });

    it('should fall back to render() when updateOptions is not available', async () => {
      // Arrange
      const component = new HomeComponent();
      const renderSpy = vi.fn();
      await component.ngAfterViewInit();
      (component as any).charts = [{ render: renderSpy }];

      // Act
      window.dispatchEvent(new Event('resize'));

      // Assert
      expect(renderSpy).toHaveBeenCalled();
      component.ngOnDestroy();
    });

    it('should do nothing when a chart has neither updateOptions nor render', async () => {
      // Arrange
      const component = new HomeComponent();
      await component.ngAfterViewInit();
      (component as any).charts = [{}];

      // Act
      // Assert
      expect(() => window.dispatchEvent(new Event('resize'))).not.toThrow();
      component.ngOnDestroy();
    });

    it('should swallow errors thrown while updating an individual chart', async () => {
      // Arrange
      const component = new HomeComponent();
      await component.ngAfterViewInit();
      (component as any).charts = [
        {
          updateOptions: () => {
            throw new Error('boom');
          },
        },
      ];

      // Act
      // Assert
      expect(() => window.dispatchEvent(new Event('resize'))).not.toThrow();

      component.ngOnDestroy();
    });
  });

  describe('toggleFilters', () => {
    it('should flip showFilters when toggleFilters is called', () => {
      // Arrange
      const component = new HomeComponent();
      expect(component.showFilters).toBe(false);

      // Act
      component.toggleFilters();

      // Assert
      expect(component.showFilters).toBe(true);
    });
  });

  describe('clearFilters', () => {
    it('should reset the date range when clearFilters is called', () => {
      // Arrange
      const component = new HomeComponent();
      component.filterStartDate = new Date();
      component.filterEndDate = new Date();

      // Act
      component.clearFilters();

      // Assert
      expect(component.filterStartDate).toBeNull();
      expect(component.filterEndDate).toBeNull();
    });
  });
});
