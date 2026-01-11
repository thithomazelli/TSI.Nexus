// ...existing code...
import { Directive, ElementRef, HostListener, OnInit } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({ selector: '[appCurrencyFormat]' })
export class CurrencyFormatDirective implements OnInit {
  private formatter = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  constructor(
    private el: ElementRef<HTMLInputElement>,
    private control: NgControl
  ) {}

  ngOnInit(): void {
    const v = this.control.control?.value;
    if (v !== null && v !== undefined && v !== '') {
      this.el.nativeElement.value = this.formatter.format(Number(v));
    } else {
      this.el.nativeElement.value = '';
    }
  }

  @HostListener('focus')
  onFocus(): void {
    const num = this.toNumber(this.el.nativeElement.value);
    this.el.nativeElement.value =
      num != null ? String(num).replace('.', ',') : '';
  }

  @HostListener('input')
  onInput(): void {
    // allow only digits, dot and comma while typing
    const cleaned = this.el.nativeElement.value.replace(/[^\d\.,]/g, '');
    this.el.nativeElement.value = cleaned;
  }

  @HostListener('blur')
  onBlur(): void {
    const num = this.toNumber(this.el.nativeElement.value);
    if (num == null || isNaN(num)) {
      this.control.control?.setValue(null);
      this.el.nativeElement.value = '';
    } else {
      this.control.control?.setValue(num); // store numeric value in form control
      this.el.nativeElement.value = this.formatter.format(num);
    }
  }

  private toNumber(val: string): number | null {
    if (!val && val !== '0') return null;
    let v = String(val).trim();
    // remove non-digit except . and ,
    v = v.replace(/[^\d\.,]/g, '');
    // if both separators present, assume '.' thousands and ',' decimal
    if (v.indexOf('.') > -1 && v.indexOf(',') > -1) {
      v = v.replace(/\./g, '').replace(',', '.');
    } else if (v.indexOf(',') > -1) {
      v = v.replace(',', '.');
    }
    const n = parseFloat(v);
    return isNaN(n) ? null : n;
  }
}
// ...existing code...
