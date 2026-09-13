import { ChangeDetectorRef } from '@angular/core';
import { of, throwError } from 'rxjs';
import {
  ModalService,
  NotificationService,
  ResponseStatus,
  SelectableOption,
  SelectableOptionGroup,
  SelectableOptionService,
  TranslationService,
} from '@nexus/core';
import { SelectableOptionsComponent } from './selectable-options.component';

describe('SelectableOptionsComponent', () => {
  let selectableOptionServiceMock: {
    add: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
    getByGroup: ReturnType<typeof vi.fn>;
  };
  let modalServiceMock: { showSweetConfirmation: ReturnType<typeof vi.fn> };
  let notificationServiceMock: { showMessage: ReturnType<typeof vi.fn> };
  let translationServiceMock: { instant: ReturnType<typeof vi.fn> };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };

  function createComponent() {
    selectableOptionServiceMock = {
      add: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
      getByGroup: vi.fn().mockReturnValue(of({ data: [] })),
    };
    modalServiceMock = { showSweetConfirmation: vi.fn() };
    notificationServiceMock = { showMessage: vi.fn() };
    translationServiceMock = { instant: vi.fn((key: string) => key) };
    cdrMock = { markForCheck: vi.fn() };

    return new SelectableOptionsComponent(
      selectableOptionServiceMock as unknown as SelectableOptionService,
      modalServiceMock as unknown as ModalService,
      notificationServiceMock as unknown as NotificationService,
      translationServiceMock as unknown as TranslationService,
      cdrMock as unknown as ChangeDetectorRef,
    );
  }

  it('should create the component when instantiated', () => {
    // Act
    const component = createComponent();

    // Assert
    expect(component).toBeTruthy();
  });

  it('should load options for the active group and mark for check when ngOnInit is called', () => {
    // Arrange
    const options = [{ id: 'o1' }] as SelectableOption[];
    const component = createComponent();
    selectableOptionServiceMock.getByGroup.mockReturnValue(of({ data: options }));

    // Act
    component.ngOnInit();

    // Assert
    expect(selectableOptionServiceMock.getByGroup).toHaveBeenCalledWith(
      SelectableOptionGroup.AddressType,
    );
    expect(component.options).toBe(options);
    expect(component.loading).toBe(false);
    expect(cdrMock.markForCheck).toHaveBeenCalled();
  });

  it('should default to an empty list when the response has no data', () => {
    // Arrange
    const component = createComponent();
    selectableOptionServiceMock.getByGroup.mockReturnValue(of({}));

    // Act
    component.ngOnInit();

    // Assert
    expect(component.options).toEqual([]);
  });

  it('should stop loading, keep options empty, and mark for check when the load request errors out', () => {
    // Arrange
    const component = createComponent();
    selectableOptionServiceMock.getByGroup.mockReturnValue(throwError(() => new Error('boom')));

    // Act
    component.ngOnInit();

    // Assert
    expect(component.loading).toBe(false);
    expect(cdrMock.markForCheck).toHaveBeenCalled();
  });

  it('should reflect whether the active group is EventType when isEventTypeGroup is read', () => {
    // Arrange
    const component = createComponent();

    // Act / Assert
    expect(component.isEventTypeGroup).toBe(false);

    component.activeGroup = SelectableOptionGroup.EventType;
    expect(component.isEventTypeGroup).toBe(true);
  });

  describe('selectGroup', () => {
    it('should switch the active group, clear newValue, and reload when a different group is selected', () => {
      // Arrange
      const component = createComponent();
      component.newValue = 'draft';

      // Act
      component.selectGroup(SelectableOptionGroup.EventType);

      // Assert
      expect(component.activeGroup).toBe(SelectableOptionGroup.EventType);
      expect(component.newValue).toBe('');
      expect(selectableOptionServiceMock.getByGroup).toHaveBeenCalledWith(
        SelectableOptionGroup.EventType,
      );
    });

    it('should do nothing when selecting the group that is already active', () => {
      // Arrange
      const component = createComponent();
      selectableOptionServiceMock.getByGroup.mockClear();

      // Act
      component.selectGroup(SelectableOptionGroup.AddressType);

      // Assert
      expect(selectableOptionServiceMock.getByGroup).not.toHaveBeenCalled();
    });
  });

  describe('add', () => {
    it('should do nothing when the value is blank', () => {
      // Arrange
      const component = createComponent();
      component.newValue = '   ';

      // Act
      component.add();

      // Assert
      expect(selectableOptionServiceMock.add).not.toHaveBeenCalled();
    });

    it('should do nothing when a save is already in flight', () => {
      // Arrange
      const component = createComponent();
      component.newValue = 'Novo';
      component.saving = true;

      // Act
      component.add();

      // Assert
      expect(selectableOptionServiceMock.add).not.toHaveBeenCalled();
    });

    it('should add the trimmed value without a color and mark for check when the group is not event-type', () => {
      // Arrange
      const response = { status: ResponseStatus.Success, message: 'ok' };
      const component = createComponent();
      selectableOptionServiceMock.add.mockReturnValue(of(response));
      component.newValue = '  Novo  ';

      // Act
      component.add();

      // Assert
      expect(selectableOptionServiceMock.add).toHaveBeenCalledWith({
        group: SelectableOptionGroup.AddressType,
        value: 'Novo',
        color: null,
      });
      expect(component.newValue).toBe('');
      expect(component.saving).toBe(false);
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        response.status,
        response.message,
      );
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should include the color when the active group is EventType', () => {
      // Arrange
      const response = { status: ResponseStatus.Success, message: 'ok' };
      const component = createComponent();
      selectableOptionServiceMock.add.mockReturnValue(of(response));
      component.activeGroup = SelectableOptionGroup.EventType;
      component.newValue = 'Reunião';
      component.newColor = '#ff0000';

      // Act
      component.add();

      // Assert
      expect(selectableOptionServiceMock.add).toHaveBeenCalledWith({
        group: SelectableOptionGroup.EventType,
        value: 'Reunião',
        color: '#ff0000',
      });
    });

    it('should keep newValue unchanged when the backend reports a non-success status', () => {
      // Arrange
      const response = { status: ResponseStatus.Error, message: 'falhou' };
      const component = createComponent();
      selectableOptionServiceMock.add.mockReturnValue(of(response));
      component.newValue = 'Novo';

      // Act
      component.add();

      // Assert
      expect(component.newValue).toBe('Novo');
    });

    it('should show a translated error notification, stop saving, and mark for check when the request errors out', () => {
      // Arrange
      const component = createComponent();
      selectableOptionServiceMock.add.mockReturnValue(throwError(() => new Error('boom')));
      component.newValue = 'Novo';

      // Act
      component.add();

      // Assert
      expect(component.saving).toBe(false);
      expect(translationServiceMock.instant).toHaveBeenCalledWith('COMMON.SAVE_ERROR');
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        'Error',
        'COMMON.SAVE_ERROR',
      );
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });
  });

  describe('updateColor', () => {
    it('should update the option color locally and mark for check when the backend reports success', () => {
      // Arrange
      const option = { id: 'o1', color: '#000000' } as SelectableOption;
      const response = { status: ResponseStatus.Success, message: 'ok' };
      const component = createComponent();
      selectableOptionServiceMock.update.mockReturnValue(of(response));

      // Act
      component.updateColor(option, '#ffffff');

      // Assert
      expect(selectableOptionServiceMock.update).toHaveBeenCalledWith({
        ...option,
        color: '#ffffff',
      });
      expect(option.color).toBe('#ffffff');
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });

    it('should not update the local color when the backend reports a non-success status', () => {
      // Arrange
      const option = { id: 'o1', color: '#000000' } as SelectableOption;
      const response = { status: ResponseStatus.Error, message: 'falhou' };
      const component = createComponent();
      selectableOptionServiceMock.update.mockReturnValue(of(response));

      // Act
      component.updateColor(option, '#ffffff');

      // Assert
      expect(option.color).toBe('#000000');
    });

    it('should show a translated error notification and mark for check when the request errors out', () => {
      // Arrange
      const option = { id: 'o1' } as SelectableOption;
      const component = createComponent();
      selectableOptionServiceMock.update.mockReturnValue(throwError(() => new Error('boom')));

      // Act
      component.updateColor(option, '#ffffff');

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        'Error',
        'COMMON.SAVE_ERROR',
      );
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove the option and reload when the user confirms', async () => {
      // Arrange
      const option = { id: 'o1' } as SelectableOption;
      const response = { status: ResponseStatus.Success, message: 'removido' };
      const component = createComponent();
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: true });
      selectableOptionServiceMock.remove.mockReturnValue(of(response));

      // Act
      component.remove(option);
      await Promise.resolve();
      await Promise.resolve();

      // Assert
      expect(selectableOptionServiceMock.remove).toHaveBeenCalledWith(option);
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        response.status,
        response.message,
      );
    });

    it('should do nothing when the user cancels the confirmation', async () => {
      // Arrange
      const option = { id: 'o1' } as SelectableOption;
      const component = createComponent();
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: false });

      // Act
      component.remove(option);
      await Promise.resolve();

      // Assert
      expect(selectableOptionServiceMock.remove).not.toHaveBeenCalled();
    });

    it('should show a translated error notification and mark for check when the remove request errors out', async () => {
      // Arrange
      const option = { id: 'o1' } as SelectableOption;
      const component = createComponent();
      modalServiceMock.showSweetConfirmation.mockResolvedValue({ isConfirmed: true });
      selectableOptionServiceMock.remove.mockReturnValue(throwError(() => new Error('boom')));

      // Act
      component.remove(option);
      await Promise.resolve();
      await Promise.resolve();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        'Error',
        'COMMON.SAVE_ERROR',
      );
      expect(cdrMock.markForCheck).toHaveBeenCalled();
    });
  });
});
