import { Component, ElementRef, Renderer2 } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { ClickDirective } from './click.directive';

describe('ClickDirective', () => {
  // A minimal Renderer2 stand-in that operates on real DOM nodes directly, so the directive's
  // property/class/element manipulation can be asserted the same way it would render in a browser
  // without needing a full TestBed host-component render.
  function fakeRenderer(): Renderer2 {
    return {
      setProperty: (el: Element, name: string, value: unknown) => {
        (el as unknown as Record<string, unknown>)[name] = value;
      },
      addClass: (el: Element | null, name: string) => el?.classList.add(name),
      removeClass: (el: Element, name: string) => el.classList.remove(name),
      createElement: (name: string) => document.createElement(name),
      appendChild: (parent: Element, child: Element | null) => child && parent.appendChild(child),
      removeChild: (parent: Element, child: Element) => parent.removeChild(child),
    } as unknown as Renderer2;
  }

  function clickEvent(): Event {
    return { preventDefault: vi.fn() } as unknown as Event;
  }

  it('should do nothing when no action is bound', () => {
    // Arrange
    const button = document.createElement('button');
    const directive = new ClickDirective(new ElementRef(button), fakeRenderer());

    // Act
    // Assert
    expect(() => directive.onClick(clickEvent())).not.toThrow();
  });

  it('should do nothing when the bound action is not a function', () => {
    // Arrange
    const button = document.createElement('button');
    const directive = new ClickDirective(new ElementRef(button), fakeRenderer());
    directive.action$ = 'not-a-function' as never;

    // Act
    // Assert
    expect(() => directive.onClick(clickEvent())).not.toThrow();
  });

  describe('while the action is running', () => {
    function setup(buttonType = 'button') {
      const button = document.createElement('button');
      button.type = buttonType as 'button' | 'submit';
      const directive = new ClickDirective(new ElementRef(button), fakeRenderer());
      const action$ = new Subject<null>();
      directive.action$ = () => action$;
      return { button, directive, action$ };
    }

    it('should disable the button and show the loading spinner when clicked', () => {
      // Arrange
      const { button, directive } = setup();

      // Act
      directive.onClick(clickEvent());

      // Assert
      expect(button.disabled).toBe(true);
      expect(button.classList.contains('app-click-loading')).toBe(true);
      expect(button.querySelector('.app-click-spinner')).toBeTruthy();
    });

    it('should restore the button and remove the spinner when the action completes', () => {
      // Arrange
      const { button, directive, action$ } = setup();

      // Act
      directive.onClick(clickEvent());
      action$.next(null);
      action$.complete();

      // Assert
      expect(button.disabled).toBe(false);
      expect(button.classList.contains('app-click-loading')).toBe(false);
      expect(button.querySelector('.app-click-spinner')).toBeNull();
    });

    it('should restore the button when the action errors', () => {
      // Arrange
      const { button, directive, action$ } = setup();

      // Act
      directive.onClick(clickEvent());
      action$.error(new Error('fail'));

      // Assert
      expect(button.disabled).toBe(false);
      expect(button.classList.contains('app-click-loading')).toBe(false);
    });

    it('should prevent the default action when the button is a submit button, to avoid double-firing a wrapping ngSubmit', () => {
      // Arrange
      const { directive } = setup('submit');
      const event = clickEvent();

      // Act
      directive.onClick(event);

      // Assert
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should not call preventDefault when the button is a plain button', () => {
      // Arrange
      const { directive } = setup('button');
      const event = clickEvent();

      // Act
      directive.onClick(event);

      // Assert
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should disable the other controls inside the same form and restore them afterwards', () => {
      // Arrange
      const form = document.createElement('form');
      const button = document.createElement('button');
      const otherInput = document.createElement('input');
      const otherLink = document.createElement('a');
      form.appendChild(button);
      form.appendChild(otherInput);
      form.appendChild(otherLink);

      const directive = new ClickDirective(new ElementRef(button), fakeRenderer());
      const action$ = new Subject<null>();
      directive.action$ = () => action$;

      // Act
      directive.onClick(clickEvent());

      // Assert
      expect(otherInput.disabled).toBe(true);
      expect(otherLink.getAttribute('aria-disabled')).toBe('true');
      expect(otherLink.classList.contains('disabled')).toBe(true);

      // Act
      action$.next(null);
      action$.complete();

      // Assert
      expect(otherInput.disabled).toBe(false);
      expect(otherLink.hasAttribute('aria-disabled')).toBe(false);
      expect(otherLink.classList.contains('disabled')).toBe(false);
    });

    it('should block clicks on a disabled sibling link while the action is running', () => {
      // Arrange
      const form = document.createElement('form');
      const button = document.createElement('button');
      const otherLink = document.createElement('a');
      form.appendChild(button);
      form.appendChild(otherLink);

      const directive = new ClickDirective(new ElementRef(button), fakeRenderer());
      const action$ = new Subject<null>();
      directive.action$ = () => action$;

      directive.onClick(clickEvent());

      // Act
      const linkClick = new MouseEvent('click', { cancelable: true });
      otherLink.dispatchEvent(linkClick);

      // Assert
      expect(linkClick.defaultPrevented).toBe(true);
    });

    it('should not add a second spinner when a re-entrant click happens while one is already showing', () => {
      // Arrange
      const { button, directive } = setup();

      // Act
      directive.onClick(clickEvent());
      directive.onClick(clickEvent());

      // Assert
      expect(button.querySelectorAll('.app-click-spinner').length).toBe(1);
    });

    it('should re-apply the disabled state to a sibling link that was already disabled before the click', () => {
      // Arrange
      const form = document.createElement('form');
      const button = document.createElement('button');
      const otherLink = document.createElement('a');
      otherLink.setAttribute('aria-disabled', 'true');
      otherLink.setAttribute('tabindex', '-1');
      otherLink.classList.add('disabled');
      form.appendChild(button);
      form.appendChild(otherLink);

      const directive = new ClickDirective(new ElementRef(button), fakeRenderer());
      const action$ = new Subject<null>();
      directive.action$ = () => action$;

      // Act
      directive.onClick(clickEvent());
      action$.next(null);
      action$.complete();

      // Assert
      expect(otherLink.getAttribute('aria-disabled')).toBe('true');
      expect(otherLink.getAttribute('tabindex')).toBe('-1');
      expect(otherLink.classList.contains('disabled')).toBe(true);
    });

    it('should not re-attach the blocking click handler to a sibling link on a re-entrant click', () => {
      // Arrange
      const form = document.createElement('form');
      const button = document.createElement('button');
      const otherLink = document.createElement('a');
      form.appendChild(button);
      form.appendChild(otherLink);
      const addEventListenerSpy = vi.spyOn(otherLink, 'addEventListener');

      const directive = new ClickDirective(new ElementRef(button), fakeRenderer());
      directive.action$ = () => new Subject<null>();

      // Act
      directive.onClick(clickEvent());
      directive.onClick(clickEvent());

      // Assert
      expect(addEventListenerSpy).toHaveBeenCalledTimes(1);
    });

    it('should skip renderer.setProperty on the host element itself when it is an anchor', () => {
      // Arrange
      const link = document.createElement('a');
      const renderer = fakeRenderer();
      const setPropertySpy = vi.spyOn(renderer, 'setProperty');
      const directive = new ClickDirective(new ElementRef(link), renderer);
      directive.action$ = () => new Subject<null>();

      // Act
      directive.onClick(clickEvent());

      // Assert
      expect(setPropertySpy).not.toHaveBeenCalledWith(link, 'disabled', true);
    });
  });

  describe('setDisabled(false) (re-enabling siblings, direct call)', () => {
    it('should remove aria-disabled/tabindex/class and detach the blocking handler when a link is re-enabled', () => {
      // Arrange
      const form = document.createElement('form');
      const button = document.createElement('button');
      const otherLink = document.createElement('a');
      form.appendChild(button);
      form.appendChild(otherLink);
      const directive = new ClickDirective(new ElementRef(button), fakeRenderer());

      // Act
      (directive as unknown as { setDisabled: (d: boolean) => void }).setDisabled(true);
      (directive as unknown as { setDisabled: (d: boolean) => void }).setDisabled(false);

      // Assert
      expect(otherLink.hasAttribute('aria-disabled')).toBe(false);
      expect(otherLink.hasAttribute('tabindex')).toBe(false);
      expect(otherLink.classList.contains('disabled')).toBe(false);

      const linkClick = new MouseEvent('click', { cancelable: true });
      otherLink.dispatchEvent(linkClick);
      expect(linkClick.defaultPrevented).toBe(false);
    });

    it('should not throw when re-enabling a link that was never disabled', () => {
      // Arrange
      const form = document.createElement('form');
      const button = document.createElement('button');
      const otherLink = document.createElement('a');
      form.appendChild(button);
      form.appendChild(otherLink);
      const directive = new ClickDirective(new ElementRef(button), fakeRenderer());

      // Act
      // Assert
      expect(() =>
        (directive as unknown as { setDisabled: (d: boolean) => void }).setDisabled(false),
      ).not.toThrow();
    });
  });

  describe('addSpinner/removeSpinner edge cases', () => {
    it('should not throw when the renderer fails to create the spinner element', () => {
      // Arrange
      const button = document.createElement('button');
      const renderer = fakeRenderer();
      vi.spyOn(renderer, 'createElement').mockReturnValueOnce(null as unknown as Element);
      const directive = new ClickDirective(new ElementRef(button), renderer);
      directive.action$ = () => new Subject<null>();

      // Act
      // Assert
      expect(() => directive.onClick(clickEvent())).not.toThrow();
    });

    it('should do nothing when removeSpinner is called but no spinner was ever added', () => {
      // Arrange
      const button = document.createElement('button');
      const directive = new ClickDirective(new ElementRef(button), fakeRenderer());

      // Act
      // Assert
      expect(() =>
        (directive as unknown as { removeSpinner: () => void }).removeSpinner(),
      ).not.toThrow();
    });
  });

  // The @HostListener('click') decorator makes Angular's Ivy compiler generate a dispatch wrapper
  // (ClickDirective_click_HostBindingHandler) around onClick() - only a real DOM click through
  // TestBed exercises it, the same reasoning as currency-format.directive.spec.ts.
  describe('real DOM click event (Ivy host-binding dispatch)', () => {
    @Component({
      standalone: true,
      imports: [ClickDirective],
      template: `<button type="button" [appClick]="action">Go</button>`,
    })
    class HostComponent {
      action = () => of(null);
    }

    it('should run onClick through the compiled host-listener binding when a real click event fires', () => {
      // Arrange
      const fixture = TestBed.createComponent(HostComponent);
      fixture.detectChanges();
      const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');

      // Act
      button.click();

      // Assert
      expect(button.querySelector('.app-click-spinner')).toBeFalsy();
    });
  });
});
