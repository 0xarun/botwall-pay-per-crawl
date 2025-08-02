export interface BotWallConfig {
  siteId: string;
  backendUrl?: string;
  protectedRoutes?: string[];
  analytics?: boolean;
  debug?: boolean;
}

export interface BotActivity {
  siteId: string;
  userAgent: string;
  path: string;
  status: 'success' | 'blocked' | 'monitored';
  timestamp: string;
  ip?: string;
}

class BotWallProtection {
  private config: BotWallConfig;
  private isInitialized = false;

  constructor(config: BotWallConfig) {
    this.config = {
      backendUrl: 'https://botwall-api.onrender.com',
      protectedRoutes: ['/admin/*', '/premium/*'],
      analytics: true,
      debug: false,
      ...config
    };
    
    this.init();
  }

  private init(): void {
    if (this.isInitialized) return;
    
    this.log('Initializing BotWall Frontend Protection...');
    
    // Check if it's a bot request
    if (this.isBot()) {
      this.log('Bot detected, applying protection...');
      this.handleBotRequest();
    } else {
      this.log('Browser detected, allowing access...');
    }
    
    // Always send analytics if enabled
    if (this.config.analytics) {
      this.sendAnalytics();
    }
    
    this.isInitialized = true;
  }

  private isBot(): boolean {
    const userAgent = navigator.userAgent.toLowerCase();
    const botPatterns = [
      'bot', 'crawler', 'spider', 'scraper', 'gpt', 'chatgpt', 'claude', 'anthropic',
      'bingbot', 'googlebot', 'slurp', 'duckduckbot', 'baiduspider', 'yandexbot',
      'facebookexternalhit', 'twitterbot', 'linkedinbot', 'whatsapp', 'telegrambot'
    ];
    
    return botPatterns.some(pattern => userAgent.includes(pattern));
  }

  private getBotName(): string {
    const userAgent = navigator.userAgent;
    const knownBots = [
      { pattern: /gptbot/i, name: 'GPTBot' },
      { pattern: /chatgpt/i, name: 'ChatGPT' },
      { pattern: /claude/i, name: 'Claude' },
      { pattern: /anthropic/i, name: 'Anthropic' },
      { pattern: /bingbot/i, name: 'BingBot' },
      { pattern: /googlebot/i, name: 'GoogleBot' },
      { pattern: /slurp/i, name: 'Yahoo Slurp' },
      { pattern: /duckduckbot/i, name: 'DuckDuckBot' },
      { pattern: /baiduspider/i, name: 'BaiduSpider' },
      { pattern: /yandexbot/i, name: 'YandexBot' },
      { pattern: /facebookexternalhit/i, name: 'Facebook' },
      { pattern: /twitterbot/i, name: 'TwitterBot' },
      { pattern: /linkedinbot/i, name: 'LinkedInBot' },
      { pattern: /whatsapp/i, name: 'WhatsApp' },
      { pattern: /telegrambot/i, name: 'TelegramBot' }
    ];
    
    for (const bot of knownBots) {
      if (bot.pattern.test(userAgent)) {
        return bot.name;
      }
    }
    
    return 'Unknown Bot';
  }

  private isProtectedRoute(): boolean {
    const currentPath = window.location.pathname;
    return this.config.protectedRoutes!.some(route => 
      this.matchRoute(currentPath, route)
    );
  }

  private matchRoute(path: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '\\.')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
  }

  private handleBotRequest(): void {
    if (this.isProtectedRoute()) {
      this.log('Protected route detected, redirecting to payment...');
      this.showPaymentPage();
    } else {
      this.log('Non-protected route, allowing access...');
    }
  }

  private showPaymentPage(): void {
    const paymentUrl = `${this.config.backendUrl}/payment?site=${this.config.siteId}&redirect=${encodeURIComponent(window.location.href)}`;
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
      background: white;
      padding: 2rem;
      border-radius: 8px;
      text-align: center;
      max-width: 400px;
      margin: 1rem;
    `;
    
    content.innerHTML = `
      <h2 style="margin: 0 0 1rem 0; color: #333;">🔒 Content Protected</h2>
      <p style="margin: 0 0 1.5rem 0; color: #666;">
        This content is protected by BotWall. Bots must purchase credits to access this page.
      </p>
      <button id="botwall-payment-btn" style="
        background: #007bff;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 1rem;
      ">Purchase Credits</button>
    `;
    
    overlay.appendChild(content);
    document.body.appendChild(overlay);
    
    // Handle payment button click
    document.getElementById('botwall-payment-btn')?.addEventListener('click', () => {
      window.location.href = paymentUrl;
    });
  }

  private async sendAnalytics(): Promise<void> {
    try {
      const activity: BotActivity = {
        siteId: this.config.siteId,
        userAgent: navigator.userAgent,
        path: window.location.pathname,
        status: this.isBot() ? (this.isProtectedRoute() ? 'blocked' : 'monitored') : 'success',
        timestamp: new Date().toISOString()
      };
      
      await fetch(`${this.config.backendUrl}/api/bot-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          site_id: activity.siteId,
          user_agent: activity.userAgent,
          bot_name: this.isBot() ? this.getBotName() : 'Browser',
          path: activity.path,
          status: activity.status,
          ip_address: null, // Will be detected by backend
          raw_headers: {
            'user-agent': activity.userAgent,
            'referer': document.referrer,
            'origin': window.location.origin
          }
        })
      });
      
      this.log('Analytics sent successfully');
    } catch (error) {
      this.log('Failed to send analytics:', error);
    }
  }

  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[BotWall]', ...args);
    }
  }

  // Public methods for external use
  public static init(config: BotWallConfig): BotWallProtection {
    return new BotWallProtection(config);
  }

  public updateConfig(newConfig: Partial<BotWallConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.log('Configuration updated:', this.config);
  }

  public getConfig(): BotWallConfig {
    return { ...this.config };
  }
}

// Auto-initialize if script is loaded with data attributes
if (typeof window !== 'undefined') {
  const script = document.currentScript as HTMLScriptElement;
  if (script) {
    const siteId = script.getAttribute('data-site-id');
    const backendUrl = script.getAttribute('data-backend-url');
    const protectedRoutes = script.getAttribute('data-protected-routes');
    const analytics = script.getAttribute('data-analytics');
    const debug = script.getAttribute('data-debug');
    
    if (siteId) {
      const config: BotWallConfig = {
        siteId,
        backendUrl: backendUrl || undefined,
        protectedRoutes: protectedRoutes ? protectedRoutes.split(',') : undefined,
        analytics: analytics !== 'false',
        debug: debug === 'true'
      };
      
      BotWallProtection.init(config);
    }
  }
}

// Export for module usage
export default BotWallProtection; 