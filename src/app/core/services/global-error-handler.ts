import { ErrorHandler, Injectable, inject } from '@angular/core';
import { LoggerService } from './logger.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private logger = inject(LoggerService);

  handleError(error: any): void {
    const message = error?.message || (typeof error === 'string' ? error : 'Unknown runtime error');
    const stack = error?.stack || 'No stack trace available';

    // Record error in persistent logger
    this.logger.error('Runtime', `Uncaught exception: ${message}`, {
      message,
      stack,
      raw: typeof error === 'object' ? Object.getOwnPropertyNames(error).reduce((acc: any, key) => {
        acc[key] = (error as any)[key];
        return acc;
      }, {}) : error
    });

    // Keep default console behavior for developer visibility
    console.error('[HiTech:GlobalErrorHandler]', error);
  }
}
