import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ChatService } from '../../../core/services/chat.service';

interface ChatMessage {
  content: string;
  sender: 'assistant' | 'user';
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
})
export class ChatbotComponent {
  private chatService = inject(ChatService);

  @ViewChild('messageList') private messageList?: ElementRef<HTMLElement>;

  isOpen = false;
  isLoading = false;
  message = '';
  messages: ChatMessage[] = [
    {
      sender: 'assistant',
      content:
        'Hello! I can help with general hospital and health-related questions. I cannot access patient, case, or appointment data.',
    },
  ];

  toggle(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.scrollToLatest();
    }
  }

  sendMessage(): void {
    const text = this.message.trim();
    if (!text || this.isLoading) {
      return;
    }

    this.messages.push({ sender: 'user', content: text });
    this.message = '';
    this.isLoading = true;
    this.scrollToLatest();

    this.chatService
      .sendMessage(text)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (response) => {
          this.messages.push({
            sender: 'assistant',
            content:
              response.data?.reply ||
              'I could not generate a response. Please try again.',
          });
          this.scrollToLatest();
        },
        error: () => {
          this.messages.push({
            sender: 'assistant',
            content:
              'The chat service is temporarily unavailable. Please try again later.',
          });
          this.scrollToLatest();
        },
      });
  }

  private scrollToLatest(): void {
    setTimeout(() => {
      const list = this.messageList?.nativeElement;
      if (list) {
        list.scrollTop = list.scrollHeight;
      }
    });
  }
}
