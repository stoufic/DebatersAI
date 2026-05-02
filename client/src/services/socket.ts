import type { WSMessage } from '../types';

const WS_BASE = `ws://${window.location.hostname}:8000`;

type MessageHandler = (message: WSMessage) => void;

export class DebateSocket {
  private ws: WebSocket | null = null;
  private handlers: Set<MessageHandler> = new Set();

  connect(roomId: string, userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(`${WS_BASE}/api/ws/room/${roomId}?user_id=${userId}`);

      this.ws.onopen = () => resolve();
      this.ws.onerror = (e) => reject(e);
      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data) as WSMessage;
        this.handlers.forEach((handler) => handler(message));
      };
      this.ws.onclose = () => {
        this.handlers.forEach((handler) =>
          handler({ type: 'disconnected' })
        );
      };
    });
  }

  send(data: Partial<WSMessage>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  sendMessage(content: string, stance: string, isVoice = false): void {
    this.send({
      type: 'message',
      content,
      stance,
      is_voice: isVoice,
    });
  }

  endDebate(reason = 'User ended debate'): void {
    this.send({ type: 'end_debate', reason });
  }

  onMessage(handler: MessageHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
  }
}

export const debateSocket = new DebateSocket();
