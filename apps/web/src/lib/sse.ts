'use client';

type SSEEventHandler = (data: any) => void;

class SSEClient {
  private eventSource: EventSource | null = null;
  private listeners: Map<string, Set<SSEEventHandler>> = new Map();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnecting: boolean = false;
  private token: string | null = null;
  private retryCount: number = 0;
  private maxRetries: number = 10;
  private isExplicitlyClosed: boolean = false;

  /**
   * Connect to backend SSE Stream with JWT Token
   */
  connect(token?: string) {
    if (typeof window === 'undefined') return;

    if (token) {
      this.token = token;
    } else if (!this.token) {
      // Try fetching token from localStorage
      this.token = localStorage.getItem('token') || '';
    }

    if (!this.token) {
      console.warn('[SSE] No auth token available, skipping SSE connection');
      return;
    }

    // If already open or connecting, avoid duplicate
    if (this.eventSource && this.eventSource.readyState === EventSource.OPEN) {
      return;
    }

    this.isExplicitlyClosed = false;
    this.close();

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const sseUrl = `${baseUrl}/sse/stream?token=${encodeURIComponent(this.token)}`;

    try {
      this.isConnecting = true;
      this.eventSource = new EventSource(sseUrl, { withCredentials: true });

      this.eventSource.onopen = () => {
        console.log('⚡ [SSE Connected] Real-time stream active');
        this.isConnecting = false;
        this.retryCount = 0;
        this.emitLocal('connection:status', { status: 'CONNECTED' });
      };

      this.eventSource.onerror = (err) => {
        console.warn('[SSE Error] Connection interrupted, scheduling reconnect...', err);
        this.isConnecting = false;
        this.emitLocal('connection:status', { status: 'DISCONNECTED' });
        this.close();

        if (!this.isExplicitlyClosed) {
          this.scheduleReconnect();
        }
      };

      // Register all known event types onto native EventSource
      const eventNames = [
        'connected',
        'presence:status',
        'message:new',
        'message:edited',
        'message:deleted',
        'message:reaction_updated',
        'task:created',
        'task:updated',
        'task:status_changed',
        'task:deleted',
        'task:comment_added',
        'task:comment_updated',
        'task:comment_deleted',
        'file:uploaded',
        'file:deleted',
        'notification:new',
      ];

      for (const event of eventNames) {
        this.eventSource.addEventListener(event, (e: MessageEvent) => {
          try {
            const parsedData = JSON.parse(e.data);
            this.emitLocal(event, parsedData);
          } catch {
            this.emitLocal(event, e.data);
          }
        });
      }
    } catch (err) {
      console.error('[SSE Init Error]', err);
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule exponential backoff reconnection
   */
  private scheduleReconnect() {
    if (this.isExplicitlyClosed || this.reconnectTimeout) return;

    const delay = Math.min(1000 * Math.pow(1.5, this.retryCount), 15000);
    this.retryCount++;

    console.log(`[SSE] Reconnecting in ${(delay / 1000).toFixed(1)}s (attempt ${this.retryCount})...`);

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, delay);
  }

  /**
   * Subscribe to an event
   */
  on(event: string, handler: SSEEventHandler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    // If new event added after EventSource created, register listener
    if (this.eventSource && this.eventSource.readyState === EventSource.OPEN) {
      this.eventSource.addEventListener(event, (e: MessageEvent) => {
        try {
          const parsed = JSON.parse(e.data);
          handler(parsed);
        } catch {
          handler(e.data);
        }
      });
    }

    return () => this.off(event, handler);
  }

  /**
   * Unsubscribe from an event
   */
  off(event: string, handler: SSEEventHandler) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Internal event emitter
   */
  private emitLocal(event: string, data: any) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((h) => {
        try {
          h(data);
        } catch (err) {
          console.error(`[SSE Handler Error for '${event}']`, err);
        }
      });
    }
  }

  /**
   * Disconnect and clear resources
   */
  disconnect() {
    this.isExplicitlyClosed = true;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.close();
    console.log('[SSE] Disconnected cleanly');
  }

  private close() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  isConnected(): boolean {
    return this.eventSource !== null && this.eventSource.readyState === EventSource.OPEN;
  }
}

// Global SSE Singleton Client
let sseClientInstance: SSEClient | null = null;

export const getSSEClient = (): SSEClient => {
  if (!sseClientInstance) {
    sseClientInstance = new SSEClient();
  }
  return sseClientInstance;
};
