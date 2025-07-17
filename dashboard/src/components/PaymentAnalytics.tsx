import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, TrendingUp, Users, Activity } from 'lucide-react';
import { useCrawls, useCrawlStats } from '@/hooks/useCrawls';
import { useSites } from '@/hooks/useSites';

export function PaymentAnalytics() {
  const { siteOwnerCrawls } = useCrawls();
  const { siteOwnerStats } = useCrawlStats();
  const { sites } = useSites();

  const totalRevenue = siteOwnerStats?.totalEarnings || 0;
  const totalCrawls = siteOwnerStats?.totalCrawls || 0;
  const uniqueBots = siteOwnerStats?.totalCrawls || 0; // Simplified for now
  const successRate = siteOwnerStats?.totalCrawls ? 
    Math.round((siteOwnerStats.successfulCrawls / siteOwnerStats.totalCrawls) * 100) : 0;

  const getSiteName = (siteId: string) => {
    const site = sites.find(s => s.id === siteId);
    return site?.name || 'Unknown Site';
  };

  return (
    <div className="space-y-6">
      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From bot access fees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCrawls}</div>
            <p className="text-xs text-muted-foreground">
              Crawl requests received
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Bots</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueBots}</div>
            <p className="text-xs text-muted-foreground">
              Different bots accessing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground">
              Successful requests
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Revenue Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Recent Revenue Activity
          </CardTitle>
          <CardDescription>
            Track revenue from bot access to your protected content
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!Array.isArray(siteOwnerCrawls) || siteOwnerCrawls.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-8 w-8 mx-auto mb-2" />
              <p>No revenue activity yet</p>
              <p className="text-sm">Revenue will appear here when bots access your content</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Site</TableHead>
                  <TableHead>Bot</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {siteOwnerCrawls.slice(0, 20).map((crawl) => (
                  <TableRow key={crawl.id}>
                    <TableCell className="font-medium">
                      {getSiteName(crawl.site_id)}
                    </TableCell>
                    <TableCell>{crawl.bot_name || 'Unknown Bot'}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {crawl.path}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-green-600">
                        +${(crawl.site_name ? 1.00 : 0).toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={crawl.status === 'success' ? 'default' : 'destructive'}>
                        {crawl.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 