import { FormBuilder } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import {
  NotificationService,
  QuoteTripLeg,
  QuoteTripLegService,
  ResponseStatus,
  TranslationService,
} from '@nexus/core';
import { of, throwError } from 'rxjs';
import { QuoteTripLegDetailsModalComponent } from './quote-trip-leg-details-modal.component';

describe('QuoteTripLegDetailsModalComponent', () => {
  let dialogRefMock: { close: ReturnType<typeof vi.fn> };
  let quoteTripLegServiceMock: { add: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
  let notificationServiceMock: { showMessage: ReturnType<typeof vi.fn> };
  let translationServiceMock: { instant: ReturnType<typeof vi.fn> };
  let cdrMock: { markForCheck: ReturnType<typeof vi.fn> };

  function createComponent(dialogData: any): QuoteTripLegDetailsModalComponent {
    dialogRefMock = { close: vi.fn() };
    quoteTripLegServiceMock = { add: vi.fn(), update: vi.fn() };
    notificationServiceMock = { showMessage: vi.fn() };
    translationServiceMock = { instant: vi.fn((key: string) => key) };
    cdrMock = { markForCheck: vi.fn() };

    return new QuoteTripLegDetailsModalComponent(
      dialogRefMock as unknown as MatDialogRef<QuoteTripLegDetailsModalComponent>,
      dialogData,
      new FormBuilder(),
      quoteTripLegServiceMock as unknown as QuoteTripLegService,
      notificationServiceMock as unknown as NotificationService,
      translationServiceMock as unknown as TranslationService,
      cdrMock as unknown as ChangeDetectorRef,
    );
  }

  it('should create the component when instantiated', () => {
    // Act
    // Assert
    expect(createComponent(null)).toBeTruthy();
  });

  describe('constructor / mode setup', () => {
    it('should start in add mode with one empty stop when no dialogData is provided', () => {
      // Act
      const component = createComponent(null);

      // Assert
      expect(component.isEdit).toBe(false);
      expect(component.quoteTripId).toBe('');
      expect(component.stops.length).toBe(1);
    });

    it('should read quoteTripId from parentId when quoteTripId is absent', () => {
      // Act
      const component = createComponent({ parentId: 'qt1' });

      // Assert
      expect(component.quoteTripId).toBe('qt1');
    });

    it('should infer isEdit from the presence of an existing id when isEdit is not explicit', () => {
      // Act
      const component = createComponent({ data: { id: 'l1' } });

      // Assert
      expect(component.isEdit).toBe(true);
    });

    it('should start in edit mode pre-filled from an existing leg when same-day arrival is detected', () => {
      // Arrange
      const existing: QuoteTripLeg = {
        id: 'l1',
        origin: 'A',
        destination: 'B',
        departureDate: new Date(2024, 0, 10, 8, 30) as any,
        arrivalDate: new Date(2024, 0, 10, 12, 0) as any,
        distanceKm: 50,
        notes: 'obs',
      } as unknown as QuoteTripLeg;

      // Act
      const component = createComponent({ isEdit: true, quoteTripId: 'qt1', data: existing });

      // Assert
      expect(component.form.value.origin).toBe('A');
      expect(component.form.value.destination).toBe('B');
      expect(component.form.value.sameDayArrival).toBe(true);
      expect(component.form.get('arrivalDateOnly')!.disabled).toBe(true);
    });

    it('should start in edit mode with arrivalDateOnly enabled when arrival is on a different day', () => {
      // Arrange
      const existing: QuoteTripLeg = {
        id: 'l1',
        origin: 'A',
        destination: 'B',
        departureDate: new Date(2024, 0, 10) as any,
        arrivalDate: new Date(2024, 0, 12) as any,
      } as unknown as QuoteTripLeg;

      // Act
      const component = createComponent({ isEdit: true, data: existing });

      // Assert
      expect(component.form.value.sameDayArrival).toBe(false);
      expect(component.form.get('arrivalDateOnly')!.disabled).toBe(false);
    });

    it('should default to same-day arrival when starting in edit mode with no arrival recorded', () => {
      // Arrange
      const existing: QuoteTripLeg = {
        id: 'l1',
        origin: 'A',
        destination: 'B',
        departureDate: new Date(2024, 0, 10) as any,
      } as unknown as QuoteTripLeg;

      // Act
      const component = createComponent({ isEdit: true, data: existing });

      // Assert
      expect(component.form.value.sameDayArrival).toBe(true);
    });
  });

  describe('addStop / removeStop', () => {
    it('should add a new stop when addStop is called', () => {
      // Arrange
      const component = createComponent(null);

      // Act
      component.addStop();

      // Assert
      expect(component.stops.length).toBe(2);
    });

    it('should remove a stop when there is more than one', () => {
      // Arrange
      const component = createComponent(null);
      component.addStop();

      // Act
      component.removeStop(0);

      // Assert
      expect(component.stops.length).toBe(1);
    });

    it('should not remove the last remaining stop', () => {
      // Arrange
      const component = createComponent(null);

      // Act
      component.removeStop(0);

      // Assert
      expect(component.stops.length).toBe(1);
    });
  });

  describe('close', () => {
    it('should close the dialog with null when close is called', () => {
      // Arrange
      const component = createComponent(null);

      // Act
      component.close();

      // Assert
      expect(dialogRefMock.close).toHaveBeenCalledWith(null);
    });
  });

  describe('submit', () => {
    it('should mark all as touched and not save when the form is invalid', () => {
      // Arrange
      const component = createComponent(null);

      // Act
      component.submit();

      // Assert
      expect(component.form.get('origin')!.touched).toBe(true);
      expect(quoteTripLegServiceMock.add).not.toHaveBeenCalled();
    });

    it('should not save when already saving', () => {
      // Arrange
      const component = createComponent({ isEdit: true, data: { id: 'l1', origin: 'A', destination: 'B', dateOnly: new Date() } });
      component.form.patchValue({ origin: 'A', destination: 'B', dateOnly: new Date() });
      component.saving = true;

      // Act
      component.submit();

      // Assert
      expect(quoteTripLegServiceMock.update).not.toHaveBeenCalled();
    });

    it('should call submitEdit when isEdit is true and the form is valid', () => {
      // Arrange
      const component = createComponent({
        isEdit: true,
        data: { id: 'l1', origin: 'A', destination: 'B', departureDate: new Date() },
      });
      quoteTripLegServiceMock.update.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'ok' }),
      );

      // Act
      component.submit();

      // Assert
      expect(quoteTripLegServiceMock.update).toHaveBeenCalled();
    });

    it('should call submitAdd when isEdit is false and the form is valid', () => {
      // Arrange
      const component = createComponent({ quoteTripId: 'qt1' });
      component.form.patchValue({ origin: 'A' });
      component.stops.at(0).patchValue({ destination: 'B', dateOnly: new Date() });
      quoteTripLegServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'ok' }),
      );

      // Act
      component.submit();

      // Assert
      expect(quoteTripLegServiceMock.add).toHaveBeenCalled();
    });
  });

  describe('submitEdit (private, via submit)', () => {
    function setupValidEditForm() {
      return createComponent({
        isEdit: true,
        quoteTripId: 'qt1',
        data: { id: 'l1', origin: 'A', destination: 'B', departureDate: new Date(2024, 0, 1) },
      });
    }

    it('should close the dialog when the update succeeds', () => {
      // Arrange
      const component = setupValidEditForm();
      quoteTripLegServiceMock.update.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'Salvo' }),
      );

      // Act
      component.submit();

      // Assert
      expect(component.saving).toBe(false);
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Success,
        'Salvo',
      );
      expect(dialogRefMock.close).toHaveBeenCalled();
    });

    it('should not close the dialog when the update response is not a success', () => {
      // Arrange
      const component = setupValidEditForm();
      quoteTripLegServiceMock.update.mockReturnValue(
        of({ status: ResponseStatus.Error, message: 'Falha' }),
      );

      // Act
      component.submit();

      // Assert
      expect(dialogRefMock.close).not.toHaveBeenCalled();
    });

    it('should show a translated error notification when the update request errors', () => {
      // Arrange
      const component = setupValidEditForm();
      quoteTripLegServiceMock.update.mockReturnValue(throwError(() => new Error('fail')));

      // Act
      component.submit();

      // Assert
      expect(component.saving).toBe(false);
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Error,
        'TRIPS.SAVE_LEGS_ERROR',
      );
    });
  });

  describe('submitAdd (private, via submit)', () => {
    function setupValidAddForm(nextSequenceNumber = 1) {
      const component = createComponent({ quoteTripId: 'qt1', nextSequenceNumber });
      component.form.patchValue({ origin: 'A' });
      component.stops.at(0).patchValue({ destination: 'B', dateOnly: new Date(2024, 0, 1) });
      return component;
    }

    it('should add a single leg and show the singular success message', () => {
      // Arrange
      const component = setupValidAddForm();
      quoteTripLegServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'ok' }),
      );

      // Act
      component.submit();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Success,
        'TRIPS.LEG_ADDED_SINGLE',
      );
      expect(dialogRefMock.close).toHaveBeenCalled();
    });

    it('should add multiple legs and show the plural success message', () => {
      // Arrange
      const component = createComponent({ quoteTripId: 'qt1' });
      component.form.patchValue({ origin: 'A' });
      component.stops.at(0).patchValue({ destination: 'B', dateOnly: new Date(2024, 0, 1) });
      component.addStop();
      component.stops.at(1).patchValue({ destination: 'C', dateOnly: new Date(2024, 0, 2) });
      quoteTripLegServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'ok' }),
      );

      // Act
      component.submit();

      // Assert
      expect(translationServiceMock.instant).toHaveBeenCalledWith('TRIPS.LEG_ADDED_PLURAL', {
        count: '2',
      });
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Success,
        'TRIPS.LEG_ADDED_PLURAL',
      );
    });

    it('should show the failed leg message and not close the dialog when one request fails', () => {
      // Arrange
      const component = setupValidAddForm();
      quoteTripLegServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Error, message: 'Falha ao salvar' }),
      );

      // Act
      component.submit();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Error,
        'Falha ao salvar',
      );
      expect(dialogRefMock.close).not.toHaveBeenCalled();
    });

    it('should show a translated error notification when the add request errors', () => {
      // Arrange
      const component = setupValidAddForm();
      quoteTripLegServiceMock.add.mockReturnValue(throwError(() => new Error('fail')));

      // Act
      component.submit();

      // Assert
      expect(notificationServiceMock.showMessage).toHaveBeenCalledWith(
        ResponseStatus.Error,
        'TRIPS.SAVE_LEGS_ERROR',
      );
    });
  });

  describe('wireSameDayArrival (private, via the edit/add forms)', () => {
    it('should mirror and disable arrivalDateOnly when sameDayArrival is checked', () => {
      // Arrange
      const component = createComponent(null);
      const group = component.stops.at(0);

      // Act
      group.get('dateOnly')!.setValue(new Date(2024, 0, 5));

      // Assert
      expect(group.get('arrivalDateOnly')!.value).toEqual(new Date(2024, 0, 5));
      expect(group.get('arrivalDateOnly')!.disabled).toBe(true);
    });

    it('should enable arrivalDateOnly for manual entry when sameDayArrival is unchecked', () => {
      // Arrange
      const component = createComponent(null);
      const group = component.stops.at(0);

      // Act
      group.get('sameDayArrival')!.setValue(false);

      // Assert
      expect(group.get('arrivalDateOnly')!.disabled).toBe(false);
    });

    it('should not touch arrivalDateOnly on a departure change when sameDayArrival is off', () => {
      // Arrange
      const component = createComponent(null);
      const group = component.stops.at(0);
      group.get('sameDayArrival')!.setValue(false);
      group.get('arrivalDateOnly')!.setValue(new Date(2024, 0, 9));

      // Act
      group.get('dateOnly')!.setValue(new Date(2024, 0, 20));

      // Assert
      expect(group.get('arrivalDateOnly')!.value).toEqual(new Date(2024, 0, 9));
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe all internal subscriptions without throwing when ngOnDestroy is called', () => {
      // Arrange
      const component = createComponent(null);

      // Act
      // Assert
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('date helpers (private, exercised via the edit form / submit)', () => {
    it('should parse a "DD/MM/YYYY" string date with a time into a Date when submitting', () => {
      // Arrange
      const component = createComponent({
        isEdit: true,
        quoteTripId: 'qt1',
        data: { id: 'l1', origin: 'A', destination: 'B', departureDate: new Date(2024, 0, 1) },
      });
      component.form.patchValue({ dateOnly: '15/03/2024', time: '08:30' });
      quoteTripLegServiceMock.update.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'ok' }),
      );

      // Act
      component.submit();

      // Assert
      const sentLeg = quoteTripLegServiceMock.update.mock.calls[0][0];
      expect(sentLeg.departureDate.getFullYear()).toBe(2024);
      expect(sentLeg.departureDate.getMonth()).toBe(2);
      expect(sentLeg.departureDate.getDate()).toBe(15);
      expect(sentLeg.departureDate.getHours()).toBe(8);
      expect(sentLeg.departureDate.getMinutes()).toBe(30);
    });

    it('should parse a moment-like object with toDate() as the departure date when submitting', () => {
      // Arrange
      const component = createComponent({
        isEdit: true,
        quoteTripId: 'qt1',
        data: { id: 'l1', origin: 'A', destination: 'B', departureDate: new Date(2024, 0, 1) },
      });
      const momentLike = { toDate: () => new Date(2024, 4, 20) };
      component.form.patchValue({ dateOnly: momentLike, time: '' });
      quoteTripLegServiceMock.update.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'ok' }),
      );

      // Act
      component.submit();

      // Assert
      const sentLeg = quoteTripLegServiceMock.update.mock.calls[0][0];
      expect(sentLeg.departureDate.getMonth()).toBe(4);
      expect(sentLeg.departureDate.getDate()).toBe(20);
      expect(sentLeg.departureDate.getHours()).toBe(0);
    });

    it('should default to now when dateOnly is empty on submit (defensive - required validator normally blocks this)', () => {
      // Arrange
      const component = createComponent({
        isEdit: true,
        quoteTripId: 'qt1',
        data: { id: 'l1', origin: 'A', destination: 'B', departureDate: new Date(2024, 0, 1) },
      });
      component.form.get('dateOnly')!.clearValidators();
      component.form.patchValue({ dateOnly: null });
      quoteTripLegServiceMock.update.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'ok' }),
      );

      // Act
      component.submit();

      // Assert
      expect(quoteTripLegServiceMock.update).toHaveBeenCalled();
    });

    it('should send a null arrivalDate when arrivalDateOnly is empty', () => {
      // Arrange
      const component = createComponent({
        isEdit: true,
        quoteTripId: 'qt1',
        data: { id: 'l1', origin: 'A', destination: 'B', departureDate: new Date(2024, 0, 1) },
      });
      component.form.get('sameDayArrival')!.setValue(false);
      component.form.get('arrivalDateOnly')!.setValue(null);
      quoteTripLegServiceMock.update.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'ok' }),
      );

      // Act
      component.submit();

      // Assert
      const sentLeg = quoteTripLegServiceMock.update.mock.calls[0][0];
      expect(sentLeg.arrivalDate).toBeNull();
    });

    it('should resolve arrivalDate when arrivalDateOnly is a real Date', () => {
      // Arrange
      const component = createComponent({
        isEdit: true,
        quoteTripId: 'qt1',
        data: { id: 'l1', origin: 'A', destination: 'B', departureDate: new Date(2024, 0, 1) },
      });
      component.form.get('sameDayArrival')!.setValue(false);
      component.form.get('arrivalDateOnly')!.setValue(new Date(2024, 0, 3));
      quoteTripLegServiceMock.update.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'ok' }),
      );

      // Act
      component.submit();

      // Assert
      const sentLeg = quoteTripLegServiceMock.update.mock.calls[0][0];
      expect(sentLeg.arrivalDate.getDate()).toBe(3);
    });

    it('should treat an invalid arrival date string as null when constructed', () => {
      // Arrange
      const existing: QuoteTripLeg = {
        id: 'l1',
        origin: 'A',
        destination: 'B',
        departureDate: new Date(2024, 0, 1) as any,
        arrivalDate: 'not-a-date' as any,
      } as unknown as QuoteTripLeg;

      // Act
      const component = createComponent({ isEdit: true, data: existing });

      // Assert
      expect(component.form.value.sameDayArrival).toBe(true);
    });

    it('should treat a missing departure date as null when constructed', () => {
      // Arrange
      const existing: QuoteTripLeg = {
        id: 'l1',
        origin: 'A',
        destination: 'B',
      } as unknown as QuoteTripLeg;

      // Act
      const component = createComponent({ isEdit: true, data: existing });

      // Assert
      expect(component.form.value.dateOnly).toBeNull();
    });

    it('should fall back to null when the existing leg has no id', () => {
      // Arrange
      const existing = { origin: 'A', destination: 'B' } as unknown as QuoteTripLeg;
      const component = createComponent({ isEdit: true, data: existing });
      component.form.patchValue({ dateOnly: new Date(2024, 0, 1) });
      quoteTripLegServiceMock.update.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'ok' }),
      );

      // Act
      component.submit();

      // Assert
      expect(quoteTripLegServiceMock.update.mock.calls[0][0].id).toBeNull();
    });

    it('should fall back distanceKm and notes to 0 and empty string when explicitly cleared to null', () => {
      // Arrange
      const component = createComponent({
        isEdit: true,
        quoteTripId: 'qt1',
        data: { id: 'l1', origin: 'A', destination: 'B', departureDate: new Date(2024, 0, 1) },
      });
      component.form.patchValue({ distanceKm: null, notes: null });
      quoteTripLegServiceMock.update.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'ok' }),
      );

      // Act
      component.submit();

      // Assert
      const sentLeg = quoteTripLegServiceMock.update.mock.calls[0][0];
      expect(sentLeg.distanceKm).toBe(0);
      expect(sentLeg.notes).toBe('');
    });

    it('should fall back a stop distanceKm and notes to 0 and empty string when explicitly cleared to null in add mode', () => {
      // Arrange
      const component = createComponent({ quoteTripId: 'qt1' });
      component.form.patchValue({ origin: 'A' });
      component.stops.at(0).patchValue({
        destination: 'B',
        dateOnly: new Date(2024, 0, 1),
        distanceKm: null,
        notes: null,
      });
      quoteTripLegServiceMock.add.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'ok' }),
      );

      // Act
      component.submit();

      // Assert
      const sentLeg = quoteTripLegServiceMock.add.mock.calls[0][0];
      expect(sentLeg.distanceKm).toBe(0);
      expect(sentLeg.notes).toBe('');
    });

    it('should not add any legs when the stops array is empty (defensive, called directly)', () => {
      // Arrange
      const component = createComponent({ quoteTripId: 'qt1' });
      component.form.patchValue({ origin: 'A' });
      component.form.removeControl('stops');

      // Act
      (component as any).submitAdd();

      // Assert
      expect(quoteTripLegServiceMock.add).not.toHaveBeenCalled();
    });

    it('should default hours and minutes to 0 when the time string is empty', () => {
      // Arrange
      const component = createComponent({
        isEdit: true,
        quoteTripId: 'qt1',
        data: { id: 'l1', origin: 'A', destination: 'B', departureDate: new Date(2024, 0, 1) },
      });
      component.form.patchValue({ dateOnly: '10/05/2024', time: '' });
      quoteTripLegServiceMock.update.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'ok' }),
      );

      // Act
      component.submit();

      // Assert
      const sentLeg = quoteTripLegServiceMock.update.mock.calls[0][0];
      expect(sentLeg.departureDate.getHours()).toBe(0);
      expect(sentLeg.departureDate.getMinutes()).toBe(0);
    });

    it('should default month and day to 1 when a malformed date string parses to 0', () => {
      // Arrange
      const component = createComponent({
        isEdit: true,
        quoteTripId: 'qt1',
        data: { id: 'l1', origin: 'A', destination: 'B', departureDate: new Date(2024, 0, 1) },
      });
      component.form.patchValue({ dateOnly: '0/0/2024', time: '08:00' });
      quoteTripLegServiceMock.update.mockReturnValue(
        of({ status: ResponseStatus.Success, message: 'ok' }),
      );

      // Act
      component.submit();

      // Assert
      const sentLeg = quoteTripLegServiceMock.update.mock.calls[0][0];
      expect(sentLeg.departureDate.getMonth()).toBe(0);
      expect(sentLeg.departureDate.getDate()).toBe(1);
    });
  });

  describe('isSameCalendarDay (private, direct)', () => {
    it('should return false when there is an arrival date but no departure date', () => {
      // Arrange
      const component = createComponent(null);

      // Act
      // Assert
      expect((component as any).isSameCalendarDay(null, new Date(2024, 0, 1))).toBe(false);
    });
  });
});
