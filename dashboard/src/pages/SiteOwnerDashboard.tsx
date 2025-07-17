import { useAuth } from '@/hooks/useAuth';
import { useSites } from '@/hooks/useSites';
import { useCrawls, useCrawlStats } from '@/hooks/useCrawls';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Globe, DollarSign, Activity, Settings, Trash2, Edit, Copy, ExternalLink } from 'lucide-react';
import { CreateSiteForm } from '@/components/forms/CreateSiteForm';
import { SiteCredentials } from '@/components/SiteCredentials';
import { PaymentAnalytics } from '@/components/PaymentAnalytics';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';

export default function SiteOwnerDashboard() {
  const { profile, signOut } = useAuth();
  const { sites, isLoading: sitesLoading, deleteSite, isDeleting } = useSites();
  const { siteOwnerCrawls, isLoadingSiteCrawls } = useCrawls();
  const { siteOwnerStats, isLoadingSiteStats } = useCrawlStats();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Manual refresh handler
  const handleRefreshSites = () => {
    queryClient.invalidateQueries({ queryKey: ['sites', profile?.id] });
    toast({
      title: 'Sites refreshed',
      description: 'Site list and prices updated.',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              BotWall
            </h1>
            <span className="text-muted-foreground">Site Owner Dashboard</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {profile?.full_name || profile?.email}
            </span>
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Refresh Button */}
        <div className="flex justify-end mb-4">
          <Button variant="outline" size="sm" onClick={handleRefreshSites}>
            Refresh Sites
          </Button>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sites</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sitesLoading ? '...' : sites.length}
              </div>
              <p className="text-xs text-muted-foreground">
                {sites.length === 0 ? 'No sites registered yet' : 'Sites registered'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingSiteStats
                  ? '...'
                  : `$${typeof siteOwnerStats?.totalEarnings === 'number'
                      ? siteOwnerStats.totalEarnings.toFixed(2)
                      : '0.00'}`}
              </div>
              <p className="text-xs text-muted-foreground">
                From successful bot crawls
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bot Requests</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingSiteStats ? '...' : siteOwnerStats?.totalCrawls || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {siteOwnerStats?.successfulCrawls || 0} successful, {siteOwnerStats?.failedCrawls || 0} failed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingSiteStats || !siteOwnerStats?.totalCrawls ? '--' : 
                  `${Math.round((siteOwnerStats.successfulCrawls / siteOwnerStats.totalCrawls) * 100)}%`}
              </div>
              <p className="text-xs text-muted-foreground">
                Successful requests
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="sites" className="space-y-6">
          <TabsList>
            <TabsTrigger value="sites">My Sites</TabsTrigger>
            <TabsTrigger value="activity">Crawl Activity</TabsTrigger>
            <TabsTrigger value="analytics">Revenue Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="sites" className="space-y-6">
            {/* Add Site Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add Your First Site
                </CardTitle>
                <CardDescription>
                  Register your website to start monetizing bot access. You'll get a site ID and API key to protect your routes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CreateSiteForm />
              </CardContent>
            </Card>

            {/* Sites List */}
            {sites.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {sites.map((site) => (
                  <Card key={site.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Globe className="h-5 w-5" />
                            {site.name}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <ExternalLink className="h-4 w-4" />
                            {site.domain}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            ${Number(site.price_per_crawl).toFixed(3)}/crawl
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(site.site_id, 'Site ID')}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {/* Removed Site ID block as site_id no longer exists */}
                        <div>
                          <span className="text-muted-foreground">Created:</span>
                          <div className="mt-1">
                            {formatDistanceToNow(new Date(site.created_at), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <SiteCredentials site={site} />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSite(site.id, site.name)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            {/* Recent Crawls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Crawl Activity
                </CardTitle>
                <CardDescription>
                  Monitor bot access to your protected content
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSiteCrawls ? (
                  <div className="text-center py-8">Loading crawl data...</div>
                ) : !Array.isArray(siteOwnerCrawls) || siteOwnerCrawls.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No crawl activity yet. Once you integrate the middleware, bot requests will appear here.
                  </div>
                ) : (
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
                      {siteOwnerCrawls.slice(0, 20).map((crawl) => (
                        <TableRow key={crawl.id}>
                          <TableCell className="font-medium">
                            {crawl.bot_name || 'Unknown Bot'}
                          </TableCell>
                          <TableCell>{crawl.site_name || 'Unknown Site'}</TableCell>
                          <TableCell className="font-mono text-xs">
                            {crawl.path}
                          </TableCell>
                          <TableCell>
                            <Badge variant={crawl.status === 'success' ? 'default' : 'destructive'}>
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
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <PaymentAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}