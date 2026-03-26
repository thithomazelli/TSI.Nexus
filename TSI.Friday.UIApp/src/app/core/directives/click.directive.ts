import {
  Directive,
  HostListener,
  Input,
  ElementRef,
  Renderer2,
} from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { WebApiResponse } from '../utilities';

@Directive({
  selector: '[appClick]',
})
export class ClickDirective {
  @Input('appClick') action$!: () => Observable<WebApiResponse<any> | null>;

  private spinnerEl: HTMLElement | null = null;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
  ) {}

  @HostListener('click')
  onClick() {
    if (!this.action$ || typeof this.action$ !== 'function') {
      return;
    }

    this.setDisabled(true);
    this.setLoadingClass(true);
    this.addSpinner();
    this.action$()
      .pipe(
        tap({
          next: () => this.finishLoading(),
          error: () => this.finishLoading(),
          complete: () => this.finishLoading(),
        }),
      )
      .subscribe();
  }

  private finishLoading() {
    this.setFormDisabled(false);
    this.setDisabled(false);
    this.setLoadingClass(false);
    this.removeSpinner();
  }

  private setDisabled(disabled: boolean) {
    const nativeEl = this.el.nativeElement;
    // Só trata elementos nativos que aceitam disabled
    if (nativeEl.tagName && nativeEl.tagName.toLowerCase() !== 'a') {
      this.renderer.setProperty(nativeEl, 'disabled', disabled);
    }
    // Se o botão está dentro de um form, desabilita o form inteiro
    this.setFormDisabled(disabled);
  }

  private setFormDisabled(disabled: boolean) {
    let parent = this.el.nativeElement.parentElement;
    while (parent) {
      if (parent.tagName && parent.tagName.toLowerCase() === 'form') {
        this.renderer.setProperty(parent, 'disabled', disabled);
        // Desabilita todos os controles do form
        const elements = parent.querySelectorAll(
          'input, button, select, textarea',
        );
        elements.forEach((el: HTMLElement) => {
          if (el !== this.el.nativeElement) {
            this.renderer.setProperty(el, 'disabled', disabled);
          }
        });
        break;
      }
      parent = parent.parentElement;
    }
    // Desabilita todos os controles do form, incluindo <a>
    const elements = parent.querySelectorAll(
      'input, button, select, textarea, a',
    );
    elements.forEach((el: HTMLElement) => {
      if (el !== this.el.nativeElement) {
        if (el.tagName && el.tagName.toLowerCase() === 'a') {
          if (disabled) {
            el.setAttribute('aria-disabled', 'true');
            el.setAttribute('tabindex', '-1');
            el.classList.add('disabled');
            if (!(el as any).__aClickHandler) {
              (el as any).__aClickHandler = (e: Event) => {
                e.preventDefault();
                e.stopImmediatePropagation();
                return false;
              };
              el.addEventListener('click', (el as any).__aClickHandler, true);
            }
          } else {
            el.removeAttribute('aria-disabled');
            el.removeAttribute('tabindex');
            el.classList.remove('disabled');
            if ((el as any).__aClickHandler) {
              el.removeEventListener(
                'click',
                (el as any).__aClickHandler,
                true,
              );
              (el as any).__aClickHandler = null;
            }
          }
        } else {
          this.renderer.setProperty(el, 'disabled', disabled);
        }
      }
    });
  }

  private setLoadingClass(loading: boolean) {
    if (loading) {
      this.renderer.addClass(this.el.nativeElement, 'app-click-loading');
    } else {
      this.renderer.removeClass(this.el.nativeElement, 'app-click-loading');
    }
  }

  private addSpinner() {
    if (this.spinnerEl) return;
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
