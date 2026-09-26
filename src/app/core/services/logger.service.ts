import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  id: string;
  timestamp: string;
  isoTime: string;
  level: LogLevel;
  source: string;
  message: string;
  context?: any;
}

const STORAGE_KEY = 'hitech_app_logs';
const MAX_LOGS = 200;

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private _logs = signal<LogEntry[]>(this.loadLogs());
  readonly logs = this._logs.asReadonly();

  constructor() {
    this.info('App', `HiTech initialized (production: ${environment.production})`);
  }

  private loadLogs(): LogEntry[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  private persistLogs(entries: LogEntry[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (e) {
      // LocalStorage full or blocked - drop oldest half
      try {
        const trimmed = entries.slice(0, Math.floor(MAX_LOGS / 2));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      } catch {}
    }
  }

  private createEntry(level: LogLevel, source: string, message: string, context?: any): LogEntry {
    const now = new Date();
    return {
      id: 'log-' + now.getTime() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: now.toLocaleTimeString() + ' ' + now.toLocaleDateString(),
      isoTime: now.toISOString(),
      level,
      source,
      message,
      context: context !== undefined ? this.sanitizeContext(context) : undefined
    };
  }

  private sanitizeContext(context: any): any {
    if (context instanceof Error) {
      return {
        name: context.name,
        message: context.message,
        stack: context.stack
      };
    }
    if (typeof context === 'object' && context !== null) {
      try {
        return JSON.parse(JSON.stringify(context));
      } catch {
        return String(context);
      }
    }
    return context;
  }

  private log(level: LogLevel, source: string, message: string, context?: any): void {
    const entry = this.createEntry(level, source, message, context);

    // Update signal & persistent storage
    this._logs.update(current => {
      const updated = [entry, ...current.slice(0, MAX_LOGS - 1)];
      this.persistLogs(updated);
      return updated;
    });

    // Mirror to browser console
    const tag = `[HiTech:${source}]`;
    switch (level) {
      case 'debug':
        if (!environment.production) {
          console.debug(tag, message, context ?? '');
        }
        break;
      case 'info':
        console.info(tag, message, context ?? '');
        break;
      case 'warn':
        console.warn(tag, message, context ?? '');
        break;
      case 'error':
        console.error(tag, message, context ?? '');
        break;
    }
  }

  debug(source: string, message: string, context?: any): void {
    this.log('debug', source, message, context);
  }

  info(source: string, message: string, context?: any): void {
    this.log('info', source, message, context);
  }

  warn(source: string, message: string, context?: any): void {
    this.log('warn', source, message, context);
  }

  error(source: string, message: string, context?: any): void {
    this.log('error', source, message, context);
  }

  getLogs(): LogEntry[] {
    return this._logs();
  }

  clearLogs(): void {
    this._logs.set([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  exportLogsJson(): void {
    const logs = this._logs();
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hitech-production-logs-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
