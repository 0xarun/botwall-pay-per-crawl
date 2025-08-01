/**
 * Generates complete middleware code for site owners
 */
export interface SiteConfig {
  siteId: string;
  monetizedRoutes: string[];
  pricePerCrawl: number;
}

export function generateMiddlewareCode(config: SiteConfig): string {
  const { siteId, monetizedRoutes, pricePerCrawl } = config;
  
  const routesString = monetizedRoutes.map(route => `  '${route}'`).join(',\n');
  
  return `const botwallMiddleware = require('@botwall/middleware');

const config = {
  siteId: '${siteId}',
  monetizedRoutes: [
${routesString}
  ],
  pricePerCrawl: ${pricePerCrawl}
};

app.use(botwallMiddleware(config));`;
}

/**
 * Generates installation instructions
 */
export function generateInstallationInstructions(siteName: string, backendDomain: string): string {
  return `## Installation Instructions

1. **Install the middleware package:**
   \`\`\`bash
   npm install @botwall/middleware
   \`\`\`

2. **Add the middleware to your Express app:**
   Copy the code above and add it to your main server file (e.g., \`app.js\` or \`server.js\`)

3. **Deploy to your backend server:**
   Make sure the middleware is installed on: \`${backendDomain}\`

4. **Test the installation:**
   The middleware will automatically start protecting your monetized routes.

## How it works:
- **Analytics**: All bot requests are tracked (/*)
- **Monetization**: Only specified routes require payment
- **Security**: Only authorized domains can use this site ID
- **Performance**: Minimal overhead (~8ms per request)`;
} 