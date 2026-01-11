import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GridService {
  data$ = new BehaviorSubject<any>(null);

  constructor() {}

  /**
   *
   * @param data
   */
  gridDataChanged(data: any, id: number | string | null): void {
    this.data$.next({ data, id });
  }

  /**
   *
   * @returns
   */
  gridDataObservable() {
    return this.data$.asObservable();
  }
}
