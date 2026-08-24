import {
  Directive,
  HostListener,
  Input,
  ElementRef,
  Renderer2,
} from '@angular/core';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { WebApiResponse } from '../utilities';

@Directive({
  selector: '[appClick]',
})
export class ClickDirective {
  @Input('appClick') action$!: () => Observable<WebApiResponse<any> | null>;

  private spinnerEl: HTMLElement | null = null;
  private _prevDisabledState: Map<HTMLElement, boolean> = new Map();

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
  ) {}

  @HostListener('click')
  onClick() {
    if (!this.action$ || typeof this.action$ !== 'function') {
      return;
    }

    this.saveDisabledState();
    this.setDisabled(true);
    this.setLoadingClass(true);
    this.addSpinner();
    this.action$()
      .pipe(finalize(() => this.finishLoading()))
      .subscribe();
  }

  private saveDisabledState() {
    this._prevDisabledState.clear();
    const nativeEl = this.el.nativeElement;
    // Salva o estado do botão clicado
    this._prevDisabledState.set(nativeEl, nativeEl.disabled);
    // Salva o estado dos campos do form, se houver
    let parent = nativeEl.parentElement;
    while (parent) {
      if (parent.tagName && parent.tagName.toLowerCase() === 'form') {
        const elements = parent.querySelectorAll(
          'input, button, select, textarea, a',
        );
        elements.forEach((el: HTMLElement) => {
          if (el !== nativeEl) {
            // Para <a>, considera aria-disabled
            if (el.tagName && el.tagName.toLowerCase() === 'a') {
              this._prevDisabledState.set(
                el,
                el.getAttribute('aria-disabled') === 'true',
              );
            } else {
              this._prevDisabledState.set(el, (el as any).disabled);
            }
          }
        });
        break;
      }
      parent = parent.parentElement;
    }
  }

  private finishLoading() {
    this.restoreDisabledState();
    this.setLoadingClass(false);
    this.removeSpinner();
  }

  private restoreDisabledState() {
    this._prevDisabledState.forEach((wasDisabled, el) => {
      if (el.tagName && el.tagName.toLowerCase() === 'a') {
        if (wasDisabled) {
          el.setAttribute('aria-disabled', 'true');
          el.setAttribute('tabindex', '-1');
          el.classList.add('disabled');
        } else {
          el.removeAttribute('aria-disabled');
          el.removeAttribute('tabindex');
          el.classList.remove('disabled');
        }
      } else {
        this.renderer.setProperty(el, 'disabled', wasDisabled);
      }
    });
    this._prevDisabledState.clear();
  }

  private setDisabled(disabled: boolean) {
    const nativeEl = this.el.nativeElement;
    // Só trata elementos nativos que aceitam disabled
    if (nativeEl.tagName && nativeEl.tagName.toLowerCase() !== 'a') {
      this.renderer.setProperty(nativeEl, 'disabled', disabled);
    }
    // Se o botão está dentro de um form, desabilita o form inteiro
    let parent = nativeEl.parentElement;
    while (parent) {
      if (parent.tagName && parent.tagName.toLowerCase() === 'form') {
        const elements = parent.querySelectorAll(
          'input, button, select, textarea, a',
        );
        elements.forEach((el: HTMLElement) => {
          if (el !== nativeEl) {
            if (el.tagName && el.tagName.toLowerCase() === 'a') {
              // Handler único por elemento
              const handlerKey = '__aClickHandler_appClick';
              if (disabled) {
                el.setAttribute('aria-disabled', 'true');
                el.setAttribute('tabindex', '-1');
                el.classList.add('disabled');
                if (!(el as any)[handlerKey]) {
                  (el as any)[handlerKey] = (e: Event) => {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    return false;
                  };
                  el.addEventListener('click', (el as any)[handlerKey], true);
                }
              } else {
                el.removeAttribute('aria-disabled');
                el.removeAttribute('tabindex');
                el.classList.remove('disabled');
                if ((el as any)[handlerKey]) {
                  el.removeEventListener(
                    'click',
                    (el as any)[handlerKey],
                    true,
                  );
                  (el as any)[handlerKey] = null;
                }
              }
            } else {
              this.renderer.setProperty(el, 'disabled', disabled);
            }
          }
        });
        break;
      }
      parent = parent.parentElement;
    }
  }

  private setLoadingClass(loading: boolean) {
    if (loading) {
      this.renderer.addClass(this.el.nativeElement, 'app-click-loading');
    } else {
      this.renderer.removeClass(this.el.nativeElement, 'app-click-loading');
    }
  }

  private addSpinner() {
    if (this.spinnerEl) {
      return;
    }
    this.spinnerEl = this.renderer.createElement('span');
    this.renderer.addClass(this.spinnerEl, 'app-click-spinner');
    if (this.spinnerEl) {
      this.spinnerEl.innerHTML = `<svg width="18" height="18" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-dasharray="31.415, 31.415" transform="rotate(0 25 25)"><animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite"/></circle></svg>`;
    }
    this.renderer.appendChild(this.el.nativeElement, this.spinnerEl);
    this.renderer.addClass(this.el.nativeElement, 'position-relative');
  }

  private removeSpinner() {
    if (this.spinnerEl) {
      this.renderer.removeChild(this.el.nativeElement, this.spinnerEl);
      this.spinnerEl = null;
      this.renderer.removeClass(this.el.nativeElement, 'position-relative');
    }
  }
}
