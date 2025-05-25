import { Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';

@Injectable({
  providedIn: 'root',
})
export class PlayService {
  constructor(private apiService: ApiService) {}

  getPlayers() {
    return this.apiService.get('play/get-players');
  }
}
