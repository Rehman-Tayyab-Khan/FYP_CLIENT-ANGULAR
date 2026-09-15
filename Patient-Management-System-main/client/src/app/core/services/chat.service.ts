import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../interceptors/api-response.interceptor';
import { ChatRequest, ChatResponse } from '../models/chat.model';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.expressApiUrl}/chat`;

  sendMessage(message: string): Observable<ApiResponse<ChatResponse>> {
    const payload: ChatRequest = { message };
    return this.http.post<ApiResponse<ChatResponse>>(this.apiUrl, payload);
  }
}
