import fetch from 'node-fetch';

export interface HealthCheckOptions {
  backendUrl: string;
  siteId: string;
  verificationToken: string;
  middlewareVersion?: string;
  intervalMs?: number; // How often to send health checks
  timeoutMs?: number; // Request timeout
}

export interface HealthCheckResult {
  success: boolean;
  status: 'ok' | 'error';
  message?: string;
  timestamp: string;
}

export class MiddlewareHealthChecker {
  private options: HealthCheckOptions;
  private intervalId?: NodeJS.Timeout;
  private isRunning = false;

  constructor(options: HealthCheckOptions) {
    this.options = {
      intervalMs: 5 * 60 * 1000, // 5 minutes default
      timeoutMs: 10000, // 10 seconds default
      ...options
    };
  }

  /**
   * Start periodic health checks
   */
  start(): void {
    if (this.isRunning) {
      console.warn('Health checker is already running');
      return;
    }

    this.isRunning = true;
    
    // Send initial health check
    this.sendHealthCheck();
    
    // Set up periodic health checks
    this.intervalId = setInterval(() => {
      this.sendHealthCheck();
    }, this.options.intervalMs);

    console.log(`🔍 Middleware health checker started (interval: ${this.options.intervalMs / 1000}s)`);
  }

  /**
   * Stop periodic health checks
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    console.log('🛑 Middleware health checker stopped');
  }

  /**
   * Send a single health check
   */
  async sendHealthCheck(): Promise<HealthCheckResult> {
    try {
      const url = `${this.options.backendUrl}/api/sites/${this.options.siteId}/health-check?token=${this.options.verificationToken}`;
      
      if (this.options.middlewareVersion) {
        url += `&version=${encodeURIComponent(this.options.middlewareVersion)}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Botwall-Middleware-HealthCheck/1.0'
        },
        timeout: this.options.timeoutMs
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Health check successful:', data.message);
        return {
          success: true,
          status: 'ok',
          message: data.message,
          timestamp: data.timestamp
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Health check failed:', response.status, errorData.error);
        return {
          success: false,
          status: 'error',
          message: errorData.error || `HTTP ${response.status}`,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('❌ Health check error:', error);
      return {
        success: false,
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get current status
   */
  isActive(): boolean {
    return this.isRunning;
  }
}

/**
 * Convenience function to create and start a health checker
 */
export function startHealthCheck(options: HealthCheckOptions): MiddlewareHealthChecker {
  const checker = new MiddlewareHealthChecker(options);
  checker.start();
  return checker;
}

/**
 * Example usage:
 * 
 * const healthChecker = startHealthCheck({
 *   backendUrl: 'https://your-backend.com',
 *   siteId: 'your-site-id',
 *   verificationToken: 'your-verification-token',
 *   middlewareVersion: '1.0.0'
 * });
 * 
 * // Later, to stop:
 * healthChecker.stop();
 */ 