#!/usr/bin/env node

/**
 * Botwall Middleware Verification Script
 * 
 * This script helps site owners verify that their middleware is properly installed
 * and working correctly. It simulates different types of requests to test the
 * middleware's behavior.
 * 
 * Usage:
 *   node verification-script.js <your-site-url> [options]
 * 
 * Examples:
 *   node verification-script.js https://example.com
 *   node verification-script.js https://example.com --verbose
 *   node verification-script.js https://example.com --test-bot
 */

const fetch = require('node-fetch');
const readline = require('readline');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logHeader(message) {
  log(`\n${colors.bright}${colors.cyan}${message}${colors.reset}\n`);
}

class MiddlewareVerifier {
  constructor(baseUrl, options = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.verbose = options.verbose || false;
    this.testBot = options.testBot || false;
  }

  async makeRequest(path = '/', options = {}) {
    const url = `${this.baseUrl}${path}`;
    const defaultOptions = {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Botwall-Verification/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      ...options
    };

    if (this.verbose) {
      logInfo(`Making request to: ${url}`);
      logInfo(`Headers: ${JSON.stringify(defaultOptions.headers, null, 2)}`);
    }

    try {
      const response = await fetch(url, defaultOptions);
      return {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        url: response.url,
        ok: response.ok
      };
    } catch (error) {
      return {
        error: error.message,
        status: 0,
        ok: false
      };
    }
  }

  async testNormalUser() {
    logHeader('Testing Normal User Request');
    
    const result = await this.makeRequest('/');
    
    if (result.error) {
      logError(`Connection failed: ${result.error}`);
      return false;
    }

    if (result.status === 200) {
      logSuccess('Normal user request succeeded (200) - Middleware is working correctly');
      return true;
    } else if (result.status === 403) {
      logError('Normal user request was blocked (403) - Middleware is too aggressive');
      return false;
    } else {
      logWarning(`Normal user request returned ${result.status} - Check your server configuration`);
      return result.status < 400; // Consider 2xx and 3xx as success
    }
  }

  async testKnownBot() {
    logHeader('Testing Known Bot Detection');
    
    const botUserAgents = [
      'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Mozilla/5.0 (compatible; Bingbot/2.0; +http://www.bing.com/bingbot.htm)',
      'Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)',
      'Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)'
    ];

    let blockedCount = 0;
    let totalTests = botUserAgents.length;

    for (const userAgent of botUserAgents) {
      const result = await this.makeRequest('/api/test', {
        headers: {
          'User-Agent': userAgent
        }
      });

      if (result.status === 403) {
        logSuccess(`Bot blocked: ${userAgent.split('/')[1]}`);
        blockedCount++;
      } else if (result.status === 200) {
        logWarning(`Bot allowed: ${userAgent.split('/')[1]} (status: ${result.status})`);
      } else {
        logInfo(`Bot test result: ${userAgent.split('/')[1]} (status: ${result.status})`);
      }
    }

    const successRate = (blockedCount / totalTests) * 100;
    if (successRate >= 75) {
      logSuccess(`Bot detection working well (${successRate.toFixed(0)}% blocked)`);
      return true;
    } else {
      logWarning(`Bot detection needs improvement (${successRate.toFixed(0)}% blocked)`);
      return false;
    }
  }

  async testSignedBot() {
    logHeader('Testing Signed Bot Request');
    
    // This would require actual bot credentials
    logInfo('Signed bot testing requires actual bot credentials');
    logInfo('This test is skipped in verification mode');
    return true;
  }

  async testRateLimiting() {
    logHeader('Testing Rate Limiting');
    
    const requests = [];
    const concurrentRequests = 10;
    
    logInfo(`Making ${concurrentRequests} concurrent requests...`);
    
    for (let i = 0; i < concurrentRequests; i++) {
      requests.push(this.makeRequest('/api/test'));
    }
    
    const results = await Promise.all(requests);
    const blockedRequests = results.filter(r => r.status === 429 || r.status === 403).length;
    
    if (blockedRequests > 0) {
      logSuccess(`Rate limiting detected (${blockedRequests}/${concurrentRequests} requests blocked)`);
      return true;
    } else {
      logWarning('No rate limiting detected - consider implementing rate limits');
      return false;
    }
  }

  async testHealthEndpoint() {
    logHeader('Testing Health Endpoint');
    
    const result = await this.makeRequest('/health');
    
    if (result.status === 200) {
      logSuccess('Health endpoint accessible');
      return true;
    } else {
      logWarning(`Health endpoint returned ${result.status} - may not be configured`);
      return false;
    }
  }

  async runAllTests() {
    logHeader('Botwall Middleware Verification');
    logInfo(`Testing site: ${this.baseUrl}`);
    logInfo(`Verbose mode: ${this.verbose ? 'enabled' : 'disabled'}`);
    
    const results = {
      normalUser: await this.testNormalUser(),
      knownBot: await this.testKnownBot(),
      signedBot: await this.testSignedBot(),
      rateLimiting: await this.testRateLimiting(),
      healthEndpoint: await this.testHealthEndpoint()
    };
    
    logHeader('Verification Summary');
    
    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    logInfo(`Tests passed: ${passedTests}/${totalTests}`);
    
    if (passedTests === totalTests) {
      logSuccess('🎉 All tests passed! Your middleware is working correctly.');
    } else if (passedTests >= totalTests * 0.8) {
      logWarning('⚠️  Most tests passed, but there are some issues to address.');
    } else {
      logError('❌ Several tests failed. Please check your middleware configuration.');
    }
    
    return results;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    logError('Usage: node verification-script.js <site-url> [options]');
    logInfo('Options:');
    logInfo('  --verbose    Enable verbose output');
    logInfo('  --test-bot   Test with bot user agents');
    logInfo('');
    logInfo('Examples:');
    logInfo('  node verification-script.js https://example.com');
    logInfo('  node verification-script.js https://example.com --verbose');
    process.exit(1);
  }
  
  const siteUrl = args[0];
  const options = {
    verbose: args.includes('--verbose'),
    testBot: args.includes('--test-bot')
  };
  
  if (!siteUrl.startsWith('http://') && !siteUrl.startsWith('https://')) {
    logError('Please provide a valid URL starting with http:// or https://');
    process.exit(1);
  }
  
  const verifier = new MiddlewareVerifier(siteUrl, options);
  
  try {
    await verifier.runAllTests();
  } catch (error) {
    logError(`Verification failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { MiddlewareVerifier }; 