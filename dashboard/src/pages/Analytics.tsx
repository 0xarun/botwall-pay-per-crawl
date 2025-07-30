import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '../lib/utils';

interface AnalyticsOverview {
  totalCrawls: number;
  successfulCrawls: number;
  blockedCrawls: number;
  failedCrawls: number;
  successRate: number;
  totalEarnings: number;
}

interface PopularBot {
  bot_name: string;
  requests: number;
  successful_requests: number;
  blocked_requests: number;
}

interface PopularPath {
  path: string;
  visits: number;
  successful_visits: number;
  blocked_visits: number;
}

interface TimelineData {
  date: string;
  total_crawls: number;
  successful_crawls: number;
  blocked_crawls: number;
}

export default function Analytics() {
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [timeRange, setTimeRange] = useState<number>(7);
  const queryClient = useQueryClient();

  // Get user's sites
  const { data: sites } = useQuery({
    queryKey: ['sites'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/sites`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch sites');
      return response.json();
    }
  });

  // Analytics overview
  const { data: overview } = useQuery({
    queryKey: ['analytics-overview', selectedSite, timeRange],
    queryFn: async (): Promise<AnalyticsOverview> => {
      const response = await fetch(`${API_BASE_URL}/analytics/overview?site_id=${selectedSite}&days=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch analytics overview');
      return response.json();
    },
    enabled: !!selectedSite
  });

  // Popular bots
  const { data: popularBots } = useQuery({
    queryKey: ['popular-bots', selectedSite, timeRange],
    queryFn: async (): Promise<PopularBot[]> => {
      const response = await fetch(`${API_BASE_URL}/analytics/popular-bots?site_id=${selectedSite}&days=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch popular bots');
      return response.json();
    },
    enabled: !!selectedSite
  });

  // Popular paths
  const { data: popularPaths } = useQuery({
    queryKey: ['popular-paths', selectedSite, timeRange],
    queryFn: async (): Promise<PopularPath[]> => {
      const response = await fetch(`${API_BASE_URL}/analytics/popular-paths?site_id=${selectedSite}&days=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch popular paths');
      return response.json();
    },
    enabled: !!selectedSite
  });

  // Timeline data
  const { data: timeline } = useQuery({
    queryKey: ['timeline', selectedSite, timeRange],
    queryFn: async (): Promise<TimelineData[]> => {
      const response = await fetch(`${API_BASE_URL}/analytics/timeline?site_id=${selectedSite}&days=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch timeline');
      return response.json();
    },
    enabled: !!selectedSite
  });

  // Known bots
  const { data: knownBots = [] } = useQuery({
    queryKey: ['known-bots'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/known-bots`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch known bots');
      return response.json();
    }
  });

  // Site bot preferences
  const { data: botPrefs = [] } = useQuery({
    queryKey: ['site-bot-prefs', selectedSite],
    queryFn: async () => {
      if (!selectedSite) return [];
      const response = await fetch(`${API_BASE_URL}/sites/${selectedSite}/bot-prefs`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch bot preferences');
      return response.json();
    },
    enabled: !!selectedSite
  });

  // Update bot preference mutation
  const updateBotPref = useMutation({
    mutationFn: async ({ known_bot_id, blocked }: { known_bot_id: string; blocked: boolean }) => {
      const response = await fetch(`${API_BASE_URL}/sites/${selectedSite}/bot-prefs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ known_bot_id, blocked })
      });
      if (!response.ok) throw new Error('Failed to update bot preference');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-bot-prefs', selectedSite] });
    }
  });

  if (!sites || sites.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Analytics Dashboard</h1>
        <p className="text-muted-foreground">No sites found. Create a site first to view analytics.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track bot activity and crawl performance</p>
        </div>
        
        {/* Site Selector */}
        <div className="flex gap-2">
          <select 
            value={selectedSite} 
            onChange={(e) => setSelectedSite(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">Select a site</option>
            {sites.map((site: any) => (
              <option key={site.id} value={site.id}>{site.name}</option>
            ))}
          </select>
          
          {/* Time Range Selector */}
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="px-3 py-2 border rounded-md"
          >
            <option value={1}>24h</option>
            <option value={7}>7d</option>
            <option value={28}>28d</option>
            <option value={90}>3mo</option>
          </select>
        </div>
      </div>

      {!selectedSite ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Select a site to view analytics</p>
        </div>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Crawls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview?.totalCrawls || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Last {timeRange} days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview?.successRate?.toFixed(1) || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  {overview?.successfulCrawls || 0} successful
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Blocked Crawls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overview?.blockedCrawls || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Last {timeRange} days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${overview?.totalEarnings?.toFixed(2) || '0.00'}</div>
                <p className="text-xs text-muted-foreground">
                  From signed bots
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Timeline Chart */}
          {timeline && timeline.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Crawl Activity Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-end justify-between gap-1">
                  {timeline.map((day, index) => {
                    const maxCrawls = Math.max(...timeline.map(d => d.total_crawls));
                    const height = maxCrawls > 0 ? (day.total_crawls / maxCrawls) * 100 : 0;
                    
                    return (
                      <div key={day.date} className="flex-1 flex flex-col items-center">
                        <div 
                          className="w-full bg-blue-500 rounded-t"
                          style={{ height: `${height}%` }}
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(day.date).toLocaleDateString()}
                        </div>
                        <div className="text-xs font-medium">{day.total_crawls}</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Tables */}
          <Tabs defaultValue="bots" className="space-y-4">
            <TabsList>
              <TabsTrigger value="bots">Popular Bots</TabsTrigger>
              <TabsTrigger value="paths">Popular Paths</TabsTrigger>
              <TabsTrigger value="preferences">Bot Preferences</TabsTrigger>
            </TabsList>

            <TabsContent value="bots" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Top Bots by Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bot Name</TableHead>
                        <TableHead>Total Requests</TableHead>
                        <TableHead>Successful</TableHead>
                        <TableHead>Blocked</TableHead>
                        <TableHead>Success Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {popularBots?.map((bot) => (
                        <TableRow key={bot.bot_name}>
                          <TableCell className="font-medium">{bot.bot_name}</TableCell>
                          <TableCell>{bot.requests}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-green-600">
                              {bot.successful_requests}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-red-600">
                              {bot.blocked_requests}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {bot.requests > 0 
                              ? `${((bot.successful_requests / bot.requests) * 100).toFixed(1)}%`
                              : '0%'
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="paths" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Top Paths by Visits</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Path</TableHead>
                        <TableHead>Total Visits</TableHead>
                        <TableHead>Successful</TableHead>
                        <TableHead>Blocked</TableHead>
                        <TableHead>Success Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {popularPaths?.map((path) => (
                        <TableRow key={path.path}>
                          <TableCell className="font-medium">{path.path}</TableCell>
                          <TableCell>{path.visits}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-green-600">
                              {path.successful_visits}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-red-600">
                              {path.blocked_visits}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {path.visits > 0 
                              ? `${((path.successful_visits / path.visits) * 100).toFixed(1)}%`
                              : '0%'
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Bot Blocking Preferences</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Control which known bots are allowed or blocked for this site
                  </p>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bot Name</TableHead>
                        <TableHead>User Agent Pattern</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {knownBots.map((bot: any) => {
                        const pref = botPrefs.find((p: any) => p.known_bot_id === bot.id);
                        const blocked = pref ? pref.blocked : false;
                        return (
                          <TableRow key={bot.id}>
                            <TableCell className="font-medium">{bot.name}</TableCell>
                            <TableCell className="font-mono text-xs max-w-[200px] truncate" title={bot.user_agent_pattern}>
                              {bot.user_agent_pattern}
                            </TableCell>
                            <TableCell>
                              <Badge variant={blocked ? 'destructive' : 'default'}>
                                {blocked ? 'Blocked' : 'Allowed'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={!blocked}
                                onCheckedChange={(checked) => {
                                  updateBotPref.mutate({ known_bot_id: bot.id, blocked: !checked });
                                }}
                                disabled={updateBotPref.isPending}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
} 