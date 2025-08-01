import { useAuth } from '@/hooks/useAuth';
import { useSites } from '@/hooks/useSites';
import { useCrawls, useCrawlStats, useKnownBots, useSiteBotPreferences, useUpdateSiteBotPreference } from '@/hooks/useCrawls';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs as UITabs, TabsList as UITabsList, TabsTrigger as UITabsTrigger, TabsContent as UITabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { BrowserFilter } from '@/components/ui/browser-filter';
import { Plus, Globe, DollarSign, Activity, Settings, Trash2, Copy, ExternalLink, BarChart3, CreditCard, TrendingUp, Users, Bot, Shield, Code } from 'lucide-react';
import { CreateSiteForm } from '@/components/forms/CreateSiteForm';
import { SiteCredentials } from '@/components/SiteCredentials';
import { PaymentAnalytics } from '@/components/PaymentAnalytics';
import { MiddlewareStatus } from '@/components/MiddlewareStatus';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Sidebar, SidebarNav } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

export default function SiteOwnerDashboard() {
  const { user, signOut } = useAuth();
  const { sites, isLoading: isLoadingSites, createSite, deleteSite, getMiddlewareCode } = useSites();
  
  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [excludeBrowsers, setExcludeBrowsers] = useState(true);
  const itemsPerPage = 20;
  
  const { 
    siteOwnerCrawls, 
    siteOwnerPagination,
    isLoadingSiteCrawls 
  } = useCrawls(currentPage, itemsPerPage, excludeBrowsers);
  
  const { siteOwnerStats, isLoadingSiteStats } = useCrawlStats();
  const { data: knownBots = [], isLoading: isLoadingKnownBots } = useKnownBots();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get the first site for bot preferences (or you could add site selection)
  const currentSite = sites?.[0];
  const { data: siteBotPreferences = [], isLoading: isLoadingSiteBotPreferences } = useSiteBotPreferences(currentSite?.id || '');
  const updateSiteBotPreference = useUpdateSiteBotPreference(currentSite?.id || '');

  // Combine known bots with site preferences
  const botsWithPreferences = knownBots.map(bot => {
    const preference = siteBotPreferences.find((pref: any) => pref.known_bot_id === bot.id);
    return {
      ...bot,
      blocked: preference ? preference.blocked : bot.default_blocked || false,
      preference_id: preference?.id
    };
  });

  // Sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState('sites');

  const handleDeleteSite = async (siteId: string, siteName: string) => {
    if (confirm(`Are you sure you want to delete "${siteName}"? This action cannot be undone.`)) {
      try {
        await deleteSite(siteId);
      } catch (error) {
        // Error handling is done in the hook
      }
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: `${label} copied!`,
        description: 'The text has been copied to your clipboard.',
      });
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Please copy the text manually.',
        variant: 'destructive',
      });
    }
  };

  const handleRefreshSites = () => {
    queryClient.invalidateQueries({ queryKey: ['sites', user?.id] });
    toast({
      title: 'Sites refreshed',
      description: 'Site list and prices updated.',
    });
  };

  const handleGetMiddlewareCode = async (siteId: string) => {
    try {
      const result = await getMiddlewareCode(siteId);
      // Open a new window/tab with the code
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>BotWall Middleware Code - ${result.siteId}</title>
              <style>
                body { font-family: monospace; padding: 20px; background: #1a1a1a; color: #fff; }
                pre { background: #2a2a2a; padding: 20px; border-radius: 8px; overflow-x: auto; }
                .header { margin-bottom: 20px; }
                .instructions { background: #2a2a2a; padding: 20px; border-radius: 8px; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>BotWall Middleware Code</h1>
                <p>Site ID: ${result.siteId}</p>
              </div>
              <pre><code>${result.middlewareCode}</code></pre>
              <div class="instructions">
                <h3>Installation Instructions:</h3>
                <pre>${result.instructions}</pre>
              </div>
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    } catch (error) {
      toast({
        title: 'Failed to get middleware code',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const handleToggleBotPreference = async (botId: string, blocked: boolean) => {
    if (!currentSite?.id) {
      toast({
        title: 'No site selected',
        description: 'Please create a site first to manage bot preferences.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateSiteBotPreference.mutateAsync({ known_bot_id: botId, blocked });
      toast({
        title: `Bot ${blocked ? 'blocked' : 'allowed'}`,
        description: `Bot preference updated successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Failed to update bot preference',
        description: 'Could not update bot preference. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Sidebar navigation items
  const sidebarItems = [
    {
      title: 'Sites',
      href: 'sites',
      icon: Globe,
      badge: sites?.length?.toString() || '0'
    },
    {
      title: 'Middleware',
      href: 'middleware',
      icon: Shield
    },
    {
      title: 'Analytics',
      href: 'analytics',
      icon: BarChart3,
      badge: siteOwnerStats?.totalCrawls?.toString() || '0'
    },
    {
      title: 'Bot Preferences',
      href: 'bot-preferences',
      icon: Settings
    },
    {
      title: 'Crawl Activities',
      href: 'activities',
      icon: Activity,
      badge: siteOwnerStats?.totalCrawls?.toString() || '0'
    },
    {
      title: 'Payments',
      href: 'payments',
      icon: CreditCard
    }
  ];

  const renderActivitiesSection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Crawl Activities</h2>
        <p className="text-muted-foreground">Monitor bot requests to your sites</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Crawl Requests</CardTitle>
              <CardDescription>
                Track all bot activities and their success rates
              </CardDescription>
            </div>
            <BrowserFilter
              excludeBrowsers={excludeBrowsers}
              onToggle={setExcludeBrowsers}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingSiteCrawls ? (
            <div className="text-center py-8">Loading activities...</div>
          ) : siteOwnerCrawls && siteOwnerCrawls.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bot</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Path</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {siteOwnerCrawls.map((crawl) => (
                    <TableRow key={crawl.id}>
                      <TableCell className="font-medium">{crawl.bot_name || 'Unknown Bot'}</TableCell>
                      <TableCell>{crawl.site_name || 'Unknown Site'}</TableCell>
                      <TableCell className="font-mono text-xs">{crawl.path}</TableCell>
                      <TableCell>
                        <Badge variant={crawl.status === 'success' ? "default" : "destructive"}>
                          {crawl.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDistanceToNow(new Date(crawl.timestamp), { addSuffix: true })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {siteOwnerPagination && (
                <Pagination
                  currentPage={siteOwnerPagination.page}
                  totalPages={siteOwnerPagination.totalPages}
                  totalItems={siteOwnerPagination.total}
                  itemsPerPage={siteOwnerPagination.limit}
                  onPageChange={setCurrentPage}
                  className="mt-6"
                />
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No activities yet</h3>
              <p className="text-muted-foreground">
                Bot activities will appear here once bots start crawling your sites
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderSitesSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Sites</h2>
          <p className="text-muted-foreground">Manage your protected sites and pricing</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleRefreshSites} className="font-medium">
            Refresh
          </Button>
          <CreateSiteForm />
        </div>
        </div>
        
        {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-background/80 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold">Total Sites</CardTitle>
            <Globe className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
            <div className="text-3xl font-bold mb-2">
              {isLoadingSites ? '...' : sites?.length || 0}
              </div>
            <p className="text-sm text-muted-foreground">
                {sites?.length === 0 ? 'No sites registered yet' : 'Sites registered'}
              </p>
            </CardContent>
          </Card>

        <Card className="bg-background/80 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold">Total Earnings</CardTitle>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
            <div className="text-3xl font-bold mb-2">
                {isLoadingSiteStats
                  ? '...'
                  : `$${typeof siteOwnerStats?.totalEarnings === 'number'
                      ? siteOwnerStats.totalEarnings.toFixed(2)
                      : '0.00'}`}
              </div>
            <p className="text-sm text-muted-foreground">
                From successful bot crawls
              </p>
            </CardContent>
          </Card>

        <Card className="bg-background/80 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold">Bot Requests</CardTitle>
            <Activity className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
            <div className="text-3xl font-bold mb-2">
                {isLoadingSiteStats ? '...' : siteOwnerStats?.totalCrawls || 0}
              </div>
            <p className="text-sm text-muted-foreground">
                {siteOwnerStats?.successfulCrawls || 0} successful, {siteOwnerStats?.failedCrawls || 0} failed
              </p>
            </CardContent>
          </Card>

        <Card className="bg-background/80 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold">Success Rate</CardTitle>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
            <div className="text-3xl font-bold mb-2">
                {isLoadingSiteStats || !siteOwnerStats?.totalCrawls ? '--' : 
                  `${Math.round((siteOwnerStats.successfulCrawls / siteOwnerStats.totalCrawls) * 100)}%`}
              </div>
            <p className="text-sm text-muted-foreground">
                Successful requests
              </p>
            </CardContent>
          </Card>
        </div>

      {/* Sites List */}
            <Card>
              <CardHeader>
          <CardTitle>Your Sites</CardTitle>
                <CardDescription>
            Manage your protected sites and view their performance
                </CardDescription>
              </CardHeader>
              <CardContent>
          {isLoadingSites ? (
            <div className="text-center py-8">Loading sites...</div>
          ) : sites && sites.length > 0 ? (
            <div className="space-y-6">
                {sites.map((site) => (
                <Card key={site.id} className="border-border/50">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                                              <div className="flex items-center space-x-4">
                        <Globe className="h-8 w-8 text-primary" />
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {site.name}
                          </CardTitle>
                          {site.site_id && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                                {site.site_id}
                              </span>
                            </div>
                          )}
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <ExternalLink className="h-4 w-4" />
                            {site.frontend_domain || site.domain}
                            {site.backend_domain && site.backend_domain !== site.frontend_domain && (
                              <span className="text-xs text-muted-foreground">
                                (API: {site.backend_domain})
                              </span>
                            )}
                          </CardDescription>
                        </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            ${Number(site.price_per_crawl).toFixed(3)}/crawl
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(site.domain, 'Domain')}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Created:</span>
                          <div className="mt-1">
                            {formatDistanceToNow(new Date(site.created_at), { addSuffix: true })}
                        </div>
                      </div>
                                           <div>
                       <span className="text-muted-foreground">Price:</span>
                       <div className="mt-1">
                         <Badge variant="secondary">${Number(site.price_per_crawl).toFixed(3)}/crawl</Badge>
                          </div>
                        </div>
                      </div>
                      
                      {site.monetized_routes && site.monetized_routes.length > 0 && (
                        <div>
                          <span className="text-muted-foreground text-sm">💰 Monetized Routes:</span>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {site.monetized_routes.map((route: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {route}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <SiteCredentials site={site} />
                        {site.site_id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGetMiddlewareCode(site.id)}
                          >
                            <Code className="h-4 w-4 mr-2" />
                            Get Code
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSite(site.id, site.name)}
                        disabled={isLoadingSites}
                        >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Site
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No sites yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first site to start earning from bot crawls
              </p>
              <CreateSiteForm />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderAnalyticsSection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Analytics</h2>
        <p className="text-muted-foreground">Track which bots, LLMs, and search engines access your sites</p>
      </div>

      {/* Bot Activity Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-background/80 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold">Total Requests</CardTitle>
            <Activity className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2 text-primary">
              {siteOwnerStats?.totalCrawls || 0}
            </div>
            <p className="text-sm text-muted-foreground">
              All bot requests
            </p>
          </CardContent>
        </Card>

        <Card className="bg-background/80 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold">Unique Bots</CardTitle>
            <Bot className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2 text-accent">
              {siteOwnerCrawls ? new Set(siteOwnerCrawls.map(c => c.bot_name)).size : 0}
            </div>
            <p className="text-sm text-muted-foreground">
              Different bots detected
            </p>
          </CardContent>
        </Card>

        <Card className="bg-background/80 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold">Success Rate</CardTitle>
            <TrendingUp className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2 text-success">
              {isLoadingSiteStats || !siteOwnerStats?.totalCrawls ? '--' : 
                `${Math.round((siteOwnerStats.successfulCrawls / siteOwnerStats.totalCrawls) * 100)}%`}
            </div>
            <p className="text-sm text-muted-foreground">
              Successful requests
            </p>
          </CardContent>
        </Card>

        <Card className="bg-background/80 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold">Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2 text-warning">
              ${typeof siteOwnerStats?.totalEarnings === 'number'
                ? siteOwnerStats.totalEarnings.toFixed(2)
                : '0.00'}
            </div>
            <p className="text-sm text-muted-foreground">
              Total earnings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Bot Activity Over Time</CardTitle>
            <CardDescription>
              Daily bot request trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Activity Chart</h3>
                <p className="text-muted-foreground">
                  {siteOwnerCrawls && siteOwnerCrawls.length > 0 
                    ? 'Chart will show daily bot activity trends'
                    : 'No data available for chart'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bot Type Distribution</CardTitle>
            <CardDescription>
              Breakdown by bot category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-muted/20 rounded-lg">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Pie Chart</h3>
                <p className="text-muted-foreground">
                  {siteOwnerCrawls && siteOwnerCrawls.length > 0 
                    ? 'Chart will show bot type distribution'
                    : 'No data available for chart'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Bots Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Bots by Requests</CardTitle>
            <CardDescription>
              Most active bots accessing your sites
            </CardDescription>
          </CardHeader>
          <CardContent>
            {siteOwnerCrawls && siteOwnerCrawls.length > 0 ? (
              <div className="space-y-4">
                {(() => {
                  const botCounts = siteOwnerCrawls.reduce((acc, crawl) => {
                    const botName = crawl.bot_name || 'Unknown Bot';
                    acc[botName] = (acc[botName] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>);
                  
                  const topBots = Object.entries(botCounts)
                    .sort(([,a], [,b]) => (b as number) - (a as number))
                    .slice(0, 5);
                  
                  return topBots.map(([botName, count]) => (
                    <div key={botName} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Bot className="h-5 w-5 text-primary" />
                        <div>
                          <h4 className="font-medium">{botName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {botName.includes('GPT') ? 'AI Language Model' : 
                             botName.includes('Google') ? 'Search Engine' :
                             botName.includes('Bing') ? 'Search Engine' :
                             botName.includes('bot') ? 'Web Crawler' : 'Unknown Type'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-primary">{count as number}</div>
                        <div className="text-sm text-muted-foreground">requests</div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No bot activity yet</h3>
                <p className="text-muted-foreground">
                  Bot activity will appear here once bots start accessing your sites
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bot Categories</CardTitle>
            <CardDescription>
              Breakdown by bot type
            </CardDescription>
          </CardHeader>
          <CardContent>
            {siteOwnerCrawls && siteOwnerCrawls.length > 0 ? (
              <div className="space-y-4">
                {(() => {
                  const categories = {
                    'AI Models': 0,
                    'Search Engines': 0,
                    'Web Crawlers': 0,
                    'Unknown': 0
                  };
                  
                  siteOwnerCrawls.forEach(crawl => {
                    const botName = crawl.bot_name || 'Unknown Bot';
                    if (botName.includes('GPT') || botName.includes('Claude') || botName.includes('AI')) {
                      categories['AI Models']++;
                    } else if (botName.includes('Google') || botName.includes('Bing') || botName.includes('DuckDuckGo')) {
                      categories['Search Engines']++;
                    } else if (botName.includes('bot') || botName.includes('crawler') || botName.includes('spider')) {
                      categories['Web Crawlers']++;
                    } else {
                      categories['Unknown']++;
                    }
                  });
                  
                  return Object.entries(categories)
                    .filter(([, count]) => count > 0)
                    .map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{category}</h4>
                          <p className="text-sm text-muted-foreground">
                            {category === 'AI Models' ? 'Language models and AI assistants' :
                             category === 'Search Engines' ? 'Search engine crawlers' :
                             category === 'Web Crawlers' ? 'General web crawlers' : 'Uncategorized bots'}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-primary">{count}</div>
                          <div className="text-sm text-muted-foreground">requests</div>
                        </div>
                      </div>
                    ));
                })()}
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No data yet</h3>
                <p className="text-muted-foreground">
                  Bot categories will appear here once bots start accessing your sites
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Bot Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
            Recent Bot Activity
                </CardTitle>
                <CardDescription>
            Latest bot requests to your sites
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSiteCrawls ? (
            <div className="text-center py-8">Loading bot activity...</div>
          ) : siteOwnerCrawls && siteOwnerCrawls.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bot</TableHead>
                        <TableHead>Site</TableHead>
                        <TableHead>Path</TableHead>
                  <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                {siteOwnerCrawls.slice(0, 10).map((crawl) => (
                        <TableRow key={crawl.id}>
                    <TableCell className="font-medium">{crawl.bot_name || 'Unknown Bot'}</TableCell>
                          <TableCell>{crawl.site_name || 'Unknown Site'}</TableCell>
                    <TableCell className="font-mono text-xs">{crawl.path}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {crawl.bot_name?.includes('GPT') ? 'AI Model' : 
                         crawl.bot_name?.includes('Google') ? 'Search Engine' :
                         crawl.bot_name?.includes('bot') ? 'Web Crawler' : 'Unknown'}
                      </Badge>
                          </TableCell>
                          <TableCell>
                      <Badge variant={crawl.status === 'success' ? "default" : "destructive"}>
                              {crawl.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(crawl.timestamp), { addSuffix: true })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No bot activity yet</h3>
              <p className="text-muted-foreground">
                Bot activity will appear here once bots start accessing your sites
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderBotPreferencesSection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Bot Preferences</h2>
        <p className="text-muted-foreground">Manage which bots can access your sites</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Known Bots</CardTitle>
          <CardDescription>
            Configure access for known bots. Blocked bots appear at the top.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingKnownBots || isLoadingSiteBotPreferences ? (
            <div className="text-center py-8">Loading bot preferences...</div>
          ) : !currentSite ? (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No sites available</h3>
              <p className="text-muted-foreground">
                Create a site first to manage bot preferences
              </p>
            </div>
          ) : botsWithPreferences && botsWithPreferences.length > 0 ? (
            <div className="space-y-3">
              {/* Sort bots: blocked first, then allowed */}
              {botsWithPreferences
                .sort((a, b) => {
                  // Sort by blocked status first (blocked on top), then by name
                  if (a.blocked !== b.blocked) {
                    return a.blocked ? -1 : 1;
                  }
                                     return a.name.localeCompare(b.name);
                })
                .map((bot) => (
                  <div 
                    key={bot.id} 
                    className={cn(
                      "flex items-center justify-between p-4 border rounded-lg",
                      bot.blocked 
                        ? "border-destructive/20 bg-destructive/5" 
                        : "border-success/20 bg-success/5"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <Bot className={cn("h-5 w-5", bot.blocked ? "text-destructive" : "text-success")} />
                      <div>
                                                 <h4 className="font-medium">{bot.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {bot.description || 'No description available'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant={bot.blocked ? "destructive" : "default"}>
                        {bot.blocked ? "Blocked" : "Allowed"}
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleToggleBotPreference(bot.id, !bot.blocked)}
                        disabled={isLoadingKnownBots || isLoadingSiteBotPreferences}
                      >
                        {bot.blocked ? "Allow" : "Block"}
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No known bots available</h3>
              <p className="text-muted-foreground">
                Known bots will appear here once they are configured
              </p>
            </div>
                )}
              </CardContent>
            </Card>
    </div>
  );

  const renderPaymentsSection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Payments</h2>
        <p className="text-muted-foreground">Manage your payment settings and view transaction history</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Payment Settings</CardTitle>
          <CardDescription>
            Configure your payment preferences and view earnings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-semibold">Total Earnings</h3>
                <p className="text-sm text-muted-foreground">Lifetime earnings from bot crawls</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-success">
                  ${typeof siteOwnerStats?.totalEarnings === 'number'
                    ? siteOwnerStats.totalEarnings.toFixed(2)
                    : '0.00'}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-semibold">This Month</h3>
                <p className="text-sm text-muted-foreground">Earnings for current month</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  $0.00
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderMiddlewareSection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Middleware Status</h2>
        <p className="text-muted-foreground">Monitor and verify your Botwall middleware installation</p>
      </div>

      {sites && sites.length > 0 ? (
        <div className="space-y-6">
          {sites.map((site) => (
            <MiddlewareStatus
              key={site.id}
              siteId={site.id}
              siteDomain={site.domain}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No sites configured</h3>
            <p className="text-muted-foreground mb-4">
              Create a site first to monitor middleware status
            </p>
            <CreateSiteForm />
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'sites':
        return renderSitesSection();
      case 'middleware':
        return renderMiddlewareSection();
      case 'activities':
        return renderActivitiesSection();
      case 'analytics':
        return renderAnalyticsSection();
      case 'bot-preferences':
        return renderBotPreferencesSection();
      case 'payments':
        return renderPaymentsSection();
      default:
        return renderSitesSection();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Header */}
      <header className="border-b bg-background/90 backdrop-blur-lg sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-6">
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              BotWall
            </h1>
            <span className="text-lg text-muted-foreground font-medium">Site Owner Dashboard</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground font-medium">
              Welcome, {user?.full_name || user?.email || 'User'}
            </span>
            <Button variant="outline" size="sm" onClick={signOut} className="font-medium">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className={cn(
            "transition-all duration-300",
            isSidebarCollapsed ? "w-16" : "w-64"
          )}
        >
          <SidebarNav
            items={sidebarItems}
            activeItem={activeSection}
            onItemClick={setActiveSection}
          />
        </Sidebar>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}