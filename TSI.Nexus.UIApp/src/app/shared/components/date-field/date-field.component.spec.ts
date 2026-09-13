import { DateFieldComponent } from './date-field.component';

describe('DateFieldComponent', () => {
  let component: DateFieldComponent;

  beforeEach(() => {
    component = new DateFieldComponent();
  });

  it('should create the component when instantiated', () => {
    // Act
    // Assert
    expect(component).toBeTruthy();
  });

  it('should assign each instance a unique fieldId when instantiated', () => {
    // Arrange
    // Act
    const other = new DateFieldComponent();

    // Assert
    expect(component.fieldId).not.toBe(other.fieldId);
  });

  describe('writeValue', () => {
    it('should set value to null when the input is falsy', () => {
      // Act
      component.writeValue(null);
      // Assert
      expect(component.value).toBeNull();

      component.writeValue(undefined);
      expect(component.value).toBeNull();

      component.writeValue('');
      expect(component.value).toBeNull();
    });

    it('should keep a real Date instance as-is when writeValue is called with a Date', () => {
      // Arrange
      const date = new Date(2024, 0, 5);

      // Act
      component.writeValue(date);

      // Assert
      expect(component.value).toBe(date);
    });

    it('should parse a date string into a Date when writeValue is called with a string', () => {
      // Act
      component.writeValue('2024-01-05T00:00:00');

      // Assert
      expect(component.value).toBeInstanceOf(Date);
      expect(component.value?.getFullYear()).toBe(2024);
    });
  });

  describe('CVA plumbing', () => {
    it('should propagate value changes through the registered onChange when onModelChange is called', () => {
      // Arrange
      const onChange = vi.fn();
      component.registerOnChange(onChange);
      const date = new Date(2024, 5, 1);

      // Act
      component.onModelChange(date);

      // Assert
      expect(component.value).toBe(date);
      expect(onChange).toHaveBeenCalledWith(date);
    });

    it('should combine isDisabled input and form-driven disabled state with OR', () => {
      // Assert
      expect(component.effectiveDisabled).toBe(false);

      // Act
      component.setDisabledState(true);

      // Assert
      expect(component.effectiveDisabled).toBe(true);

      component.setDisabledState(false);
      component.isDisabled = true;
      expect(component.effectiveDisabled).toBe(true);
    });

    it('should not let setDisabledState(false) override effectiveDisabled when isDisabled is explicitly true', () => {
      // Arrange
      component.isDisabled = true;

      // Act
      component.setDisabledState(false);

      // Assert
      expect(component.effectiveDisabled).toBe(true);
    });

    it('should default onTouched to a no-op and let registerOnTouched replace it when called', () => {
      // Act
      // Assert
      expect(() => component.onTouched()).not.toThrow();

      const onTouched = vi.fn();
      component.registerOnTouched(onTouched);
      component.onTouched();

      expect(onTouched).toHaveBeenCalled();
    });
  });

  describe('toggleCalendar', () => {
    it('should do nothing when no picker is attached', () => {
      // Act
      // Assert
      expect(() => component.toggleCalendar()).not.toThrow();
    });

    it('should delegate to the picker view child when a picker is present', () => {
      // Arrange
      const toggle = vi.fn();
      component.picker = { toggle } as unknown as DateFieldComponent['picker'];

      // Act
      component.toggleCalendar();

      // Assert
      expect(toggle).toHaveBeenCalled();
    });
  });

  describe('onInputKeydown', () => {
    function keyEvent(key: string, modifiers: Partial<KeyboardEvent> = {}): KeyboardEvent {
      return { key, preventDefault: vi.fn(), ...modifiers } as unknown as KeyboardEvent;
    }

    it('should allow the key when it is a digit or the "/" separator', () => {
      // Arrange
      const event = keyEvent('5');

      // Act
      component.onInputKeydown(event);

      // Assert
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow the key when it is a navigation/editing control key', () => {
      // Arrange
      const event = keyEvent('Backspace');

      // Act
      component.onInputKeydown(event);

      // Assert
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should block the key when it is a letter', () => {
      // Arrange
      const event = keyEvent('a');

      // Act
      component.onInputKeydown(event);

      // Assert
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow the key when it is combined with a modifier such as Ctrl', () => {
      // Arrange
      const event = keyEvent('c', { ctrlKey: true });

      // Act
      component.onInputKeydown(event);

      // Assert
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('onInputChange', () => {
    function inputEvent(value: string): Event {
      const input = { value, setSelectionRange: vi.fn() } as unknown as HTMLInputElement;
      return { target: input } as unknown as Event;
    }

    it('should auto-insert separators when digits are typed', () => {
      // Arrange
      const event = inputEvent('01012024');

      // Act
      component.onInputChange(event);

      // Assert
      expect((event.target as HTMLInputElement).value).toBe('01/01/2024');
    });

    it('should strip non-digit characters when formatting the input', () => {
      // Arrange
      const event = inputEvent('01/01/2024');

      // Act
      component.onInputChange(event);

      // Assert
      expect((event.target as HTMLInputElement).value).toBe('01/01/2024');
    });

    it('should parse and propagate the date when a valid complete date is entered', () => {
      // Arrange
      const onChange = vi.fn();
      component.registerOnChange(onChange);

      // Act
      component.onInputChange(inputEvent('05012024'));

      // Assert
      expect(onChange).toHaveBeenCalled();
      const emitted = onChange.mock.calls[0][0] as Date;
      expect(emitted.getFullYear()).toBe(2024);
      expect(emitted.getMonth()).toBe(0);
      expect(emitted.getDate()).toBe(5);
    });

    it('should not propagate the date when it is impossible (e.g. Feb 30th)', () => {
      // Arrange
      const onChange = vi.fn();
      component.registerOnChange(onChange);

      // Act
      component.onInputChange(inputEvent('30022024'));

      // Assert
      expect(onChange).not.toHaveBeenCalled();
    });

    it('should not propagate the date when fewer than 8 digits have been entered', () => {
      // Arrange
      const onChange = vi.fn();
      component.registerOnChange(onChange);

      // Act
      component.onInputChange(inputEvent('0501'));

      // Assert
      expect(onChange).not.toHaveBeenCalled();
    });

    it('should leave the value unformatted when 2 or fewer digits have been entered', () => {
      // Arrange
      const event = inputEvent('5');

      // Act
      component.onInputChange(event);

      // Assert
      expect((event.target as HTMLInputElement).value).toBe('5');
    });
  });

  describe('onCalendarShow', () => {
    it('should do nothing when the overlay or input element is missing', () => {
      // Act
      // Assert
      expect(() => component.onCalendarShow(null as unknown as HTMLElement)).not.toThrow();
    });

    it('should position the overlay below the field when there is room below', () => {
      // Arrange
      const inputEl = {
        getBoundingClientRect: () => ({ top: 100, bottom: 130, left: 20 }),
      } as unknown as HTMLElement;
      component.picker = {
        inputfieldViewChild: { nativeElement: inputEl },
      } as unknown as DateFieldComponent['picker'];

      Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
      Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });

      const overlay = {
        offsetHeight: 200,
        offsetWidth: 250,
        style: {} as CSSStyleDeclaration,
      } as unknown as HTMLElement;

      // Act
      component.onCalendarShow(overlay);

      // Assert
      expect(overlay.style.position).toBe('fixed');
      expect(overlay.style.top).toBe('130px');
    });

    it('should flip the overlay above the field when there is not enough room below', () => {
      // Arrange
      const inputEl = {
        getBoundingClientRect: () => ({ top: 700, bottom: 730, left: 20 }),
      } as unknown as HTMLElement;
      component.picker = {
        inputfieldViewChild: { nativeElement: inputEl },
      } as unknown as DateFieldComponent['picker'];

      Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
      Object.defineProperty(window, 'innerWidth', { value: 1200, configurable: true });

      const overlay = {
        offsetHeight: 200,
        offsetWidth: 250,
        style: {} as CSSStyleDeclaration,
      } as unknown as HTMLElement;

      // Act
      component.onCalendarShow(overlay);

      // Assert
      expect(overlay.style.position).toBe('fixed');
      expect(overlay.style.top).toBe('500px');
    });
  });
});
