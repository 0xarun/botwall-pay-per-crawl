/**
 * Browser filtering utility for Botwall
 * Filters out common browser user agents to focus on bot traffic
 */

// Common browser user agent patterns
const BROWSER_PATTERNS = [
  // Chrome
  /Chrome\/\d+\.\d+\.\d+\.\d+ Safari\/537\.36/,
  /Chrome\/\d+\.\d+\.\d+ Safari\/537\.36/,
  
  // Firefox
  /Firefox\/\d+\.\d+/,
  /Mozilla\/5\.0.*Firefox/,
  
  // Safari
  /Safari\/\d+\.\d+/,
  /Mozilla\/5\.0.*Safari/,
  
  // Edge
  /Edge\/\d+\.\d+/,
  /Edg\/\d+\.\d+/,
  
  // Internet Explorer
  /MSIE \d+\.\d+/,
  /Trident\/\d+\.\d+/,
  
  // Opera
  /Opera\/\d+\.\d+/,
  /OPR\/\d+\.\d+/,
  
  // Common mobile browsers
  /Mobile.*Safari/,
  /Android.*Chrome/,
  /iPhone.*Safari/,
  /iPad.*Safari/,
  
  // Generic browser patterns
  /Mozilla\/5\.0.*AppleWebKit\/537\.36.*Chrome/,
  /Mozilla\/5\.0.*AppleWebKit\/537\.36.*Safari/,
  /Mozilla\/5\.0.*Gecko/,
  
  // Botwall verification script (keep this)
  /Botwall-Verification\/\d+\.\d+/,
  
  // Common development tools
  /PostmanRuntime\/\d+\.\d+/,
  /curl\/\d+\.\d+/,
  /Wget\/\d+\.\d+/,
  
  // Empty or null user agents
  /^$/,
  /^null$/,
  /^undefined$/
];

/**
 * Check if a user agent is a common browser
 * @param userAgent - The user agent string to check
 * @returns true if it's a common browser, false if it's likely a bot
 */
export function isCommonBrowser(userAgent: string): boolean {
  if (!userAgent || userAgent.trim() === '') {
    return true;
  }
  
  const ua = userAgent.trim();
  
  // Check against browser patterns
  for (const pattern of BROWSER_PATTERNS) {
    if (pattern.test(ua)) {
      return true;
    }
  }
  
  // Additional checks for common browser indicators
  const browserIndicators = [
    'Mozilla/5.0',
    'AppleWebKit',
    'Chrome',
    'Safari',
    'Firefox',
    'Edge',
    'MSIE',
    'Opera'
  ];
  
  // If it contains multiple browser indicators, it's likely a browser
  const indicatorCount = browserIndicators.filter(indicator => 
    ua.includes(indicator)
  ).length;
  
  return indicatorCount >= 2;
}

/**
 * Filter out common browsers from an array of crawl data
 * @param crawls - Array of crawl objects with user_agent property
 * @param excludeBrowsers - Whether to exclude browsers (default: true)
 * @returns Filtered array
 */
export function filterBrowsers(crawls: any[], excludeBrowsers: boolean = true): any[] {
  if (!excludeBrowsers) {
    return crawls;
  }
  
  return crawls.filter(crawl => {
    const userAgent = crawl.user_agent || crawl.userAgent || '';
    return !isCommonBrowser(userAgent);
  });
}

/**
 * Generate SQL WHERE clause to exclude common browsers
 * @param excludeBrowsers - Whether to exclude browsers
 * @returns SQL WHERE clause or empty string
 */
export function getBrowserFilterSQL(excludeBrowsers: boolean = true): string {
  if (!excludeBrowsers) {
    return '';
  }
  
  const conditions = [
    "user_agent NOT LIKE '%Chrome/%Safari/537.36%'",
    "user_agent NOT LIKE '%Firefox/%'",
    "user_agent NOT LIKE '%Safari/%'",
    "user_agent NOT LIKE '%Edge/%'",
    "user_agent NOT LIKE '%Edg/%'",
    "user_agent NOT LIKE '%MSIE %'",
    "user_agent NOT LIKE '%Trident/%'",
    "user_agent NOT LIKE '%Opera/%'",
    "user_agent NOT LIKE '%OPR/%'",
    "user_agent NOT LIKE '%Mobile%Safari%'",
    "user_agent NOT LIKE '%Android%Chrome%'",
    "user_agent NOT LIKE '%iPhone%Safari%'",
    "user_agent NOT LIKE '%iPad%Safari%'",
    "user_agent NOT LIKE '%PostmanRuntime/%'",
    "user_agent NOT LIKE '%curl/%'",
    "user_agent NOT LIKE '%Wget/%'",
    "user_agent IS NOT NULL",
    "user_agent != ''",
    "user_agent != 'null'",
    "user_agent != 'undefined'"
  ];
  
  return `AND (${conditions.join(' AND ')})`;
} 