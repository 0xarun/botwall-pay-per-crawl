import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

interface PathDetails {
  path: string;
  total_requests: number;
  successful_requests: number;
  blocked_requests: number;
  failed_requests: number;
  success_rate: number;
  unique_bots: number;
  first_seen: string;
  last_seen: string;
}

interface GeographicData {
  country: string;
  requests: number;
  successful_requests: number;
  blocked_requests: number;
  unique_bots: number;
}

interface PerformanceData {
  date: string;
  total_requests: number;
  successful_requests: number;
  blocked_requests: number;
  success_rate: number;
  unique_bots: number;
  unique_paths: number;
}

interface RealtimeData {
  hour: string;
  requests: number;
  successful_requests: number;
  blocked_requests: number;
  unique_bots: number;
  unique_paths: number;
}

interface BotDetails {
  bot_name: string;
  total_requests: number;
  successful_requests: number;
  blocked_requests: number;
  failed_requests: number;
  success_rate: number;
  unique_paths: number;
  first_seen: string;
  last_seen: string;
  avg_session_duration: number;
}

interface TrendData {
  date: string;
  value: number;
}

export default function Analytics() {
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [timeRange, setTimeRange] = useState<number>(7);
  const [selectedMetric, setSelectedMetric] = useState<string>('requests');
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

  // Path details
  const { data: pathDetails } = useQuery({
    queryKey: ['path-details', selectedSite, timeRange],
    queryFn: async (): Promise<PathDetails[]> => {
      const response = await fetch(`${API_BASE_URL}/analytics/path-details?site_id=${selectedSite}&days=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch path details');
      return response.json();
    },
    enabled: !!selectedSite
  });

  // Geographic data
  const { data: geographicData } = useQuery({
    queryKey: ['geographic', selectedSite, timeRange],
    queryFn: async (): Promise<GeographicData[]> => {
      const response = await fetch(`${API_BASE_URL}/analytics/geographic?site_id=${selectedSite}&days=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch geographic data');
      return response.json();
    },
    enabled: !!selectedSite
  });

  // Performance data
  const { data: performanceData } = useQuery({
    queryKey: ['performance', selectedSite, timeRange],
    queryFn: async (): Promise<PerformanceData[]> => {
      const response = await fetch(`${API_BASE_URL}/analytics/performance?site_id=${selectedSite}&days=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch performance data');
      return response.json();
    },
    enabled: !!selectedSite
  });

  // Real-time data
  const { data: realtimeData } = useQuery({
    queryKey: ['realtime', selectedSite],
    queryFn: async (): Promise<RealtimeData[]> => {
      const response = await fetch(`${API_BASE_URL}/analytics/realtime?site_id=${selectedSite}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch realtime data');
      return response.json();
    },
    enabled: !!selectedSite,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Bot details
  const { data: botDetails } = useQuery({
    queryKey: ['bot-details', selectedSite, timeRange],
    queryFn: async (): Promise<BotDetails[]> => {
      const response = await fetch(`${API_BASE_URL}/analytics/bot-details?site_id=${selectedSite}&days=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch bot details');
      return response.json();
    },
    enabled: !!selectedSite
  });

  // Trends data
  const { data: trendsData } = useQuery({
    queryKey: ['trends', selectedSite, timeRange, selectedMetric],
    queryFn: async (): Promise<TrendData[]> => {
      const response = await fetch(`${API_BASE_URL}/analytics/trends?site_id=${selectedSite}&days=${timeRange}&metric=${selectedMetric}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch trends data');
      return response.json();
    },
    enabled: !!selectedSite
  });

  if (!sites || sites.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              No sites found. Please create a site first to view analytics.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Site Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics Dashboard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-center">
            <Select value={selectedSite} onValueChange={setSelectedSite}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a site" />
              </SelectTrigger>
              <SelectContent>
                {sites.map((site: any) => (
                  <SelectItem key={site.id} value={site.id}>
                    {site.name} ({site.domain})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={timeRange.toString()} onValueChange={(value) => setTimeRange(parseInt(value))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Day</SelectItem>
                <SelectItem value="7">7 Days</SelectItem>
                <SelectItem value="30">30 Days</SelectItem>
                <SelectItem value="90">90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedSite && (
        <>
          {/* Overview Cards */}
          {overview && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Crawls</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview.totalCrawls.toLocaleString()}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview.successRate}%</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Blocked Crawls</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overview.blockedCrawls.toLocaleString()}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${overview.totalEarnings.toFixed(2)}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Detailed Analytics Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="paths">Path Analytics</TabsTrigger>
              <TabsTrigger value="bots">Bot Analytics</TabsTrigger>
              <TabsTrigger value="geographic">Geographic</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="realtime">Real-time</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Popular Bots */}
                <Card>
                  <CardHeader>
                    <CardTitle>Popular Bots</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Bot</TableHead>
                          <TableHead>Requests</TableHead>
                          <TableHead>Success Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {popularBots?.slice(0, 10).map((bot, index) => (
                          <TableRow key={index}>
                            <TableCell>{bot.bot_name}</TableCell>
                            <TableCell>{bot.requests}</TableCell>
                            <TableCell>
                              {bot.requests > 0 ? Math.round((bot.successful_requests / bot.requests) * 100) : 0}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Popular Paths */}
                <Card>
                  <CardHeader>
                    <CardTitle>Popular Paths</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Path</TableHead>
                          <TableHead>Visits</TableHead>
                          <TableHead>Success Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {popularPaths?.slice(0, 10).map((path, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono text-sm">{path.path}</TableCell>
                            <TableCell>{path.visits}</TableCell>
                            <TableCell>
                              {path.visits > 0 ? Math.round((path.successful_visits / path.visits) * 100) : 0}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="paths" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Path Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Path</TableHead>
                        <TableHead>Total Requests</TableHead>
                        <TableHead>Success Rate</TableHead>
                        <TableHead>Unique Bots</TableHead>
                        <TableHead>Last Seen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pathDetails?.map((path, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono text-sm">{path.path}</TableCell>
                          <TableCell>{path.total_requests}</TableCell>
                          <TableCell>{path.success_rate}%</TableCell>
                          <TableCell>{path.unique_bots}</TableCell>
                          <TableCell>{new Date(path.last_seen).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bots" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Bot Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bot Name</TableHead>
                        <TableHead>Total Requests</TableHead>
                        <TableHead>Success Rate</TableHead>
                        <TableHead>Unique Paths</TableHead>
                        <TableHead>Last Seen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {botDetails?.map((bot, index) => (
                        <TableRow key={index}>
                          <TableCell>{bot.bot_name}</TableCell>
                          <TableCell>{bot.total_requests}</TableCell>
                          <TableCell>{bot.success_rate}%</TableCell>
                          <TableCell>{bot.unique_paths}</TableCell>
                          <TableCell>{new Date(bot.last_seen).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="geographic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Geographic Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Country</TableHead>
                        <TableHead>Requests</TableHead>
                        <TableHead>Success Rate</TableHead>
                        <TableHead>Unique Bots</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {geographicData?.map((geo, index) => (
                        <TableRow key={index}>
                          <TableCell>{geo.country}</TableCell>
                          <TableCell>{geo.requests}</TableCell>
                          <TableCell>
                            {geo.requests > 0 ? Math.round((geo.successful_requests / geo.requests) * 100) : 0}%
                          </TableCell>
                          <TableCell>{geo.unique_bots}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Total Requests</TableHead>
                        <TableHead>Success Rate</TableHead>
                        <TableHead>Unique Bots</TableHead>
                        <TableHead>Unique Paths</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {performanceData?.map((perf, index) => (
                        <TableRow key={index}>
                          <TableCell>{new Date(perf.date).toLocaleDateString()}</TableCell>
                          <TableCell>{perf.total_requests}</TableCell>
                          <TableCell>{perf.success_rate}%</TableCell>
                          <TableCell>{perf.unique_bots}</TableCell>
                          <TableCell>{perf.unique_paths}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="realtime" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Real-time Activity (Last 24 Hours)</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Hour</TableHead>
                        <TableHead>Requests</TableHead>
                        <TableHead>Success Rate</TableHead>
                        <TableHead>Unique Bots</TableHead>
                        <TableHead>Unique Paths</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {realtimeData?.map((realtime, index) => (
                        <TableRow key={index}>
                          <TableCell>{new Date(realtime.hour).toLocaleTimeString()}</TableCell>
                          <TableCell>{realtime.requests}</TableCell>
                          <TableCell>
                            {realtime.requests > 0 ? Math.round((realtime.successful_requests / realtime.requests) * 100) : 0}%
                          </TableCell>
                          <TableCell>{realtime.unique_bots}</TableCell>
                          <TableCell>{realtime.unique_paths}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trends" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Trend Analysis
                    <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="requests">Total Requests</SelectItem>
                        <SelectItem value="success_rate">Success Rate</SelectItem>
                        <SelectItem value="unique_bots">Unique Bots</SelectItem>
                        <SelectItem value="unique_paths">Unique Paths</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trendsData?.map((trend, index) => (
                        <TableRow key={index}>
                          <TableCell>{new Date(trend.date).toLocaleDateString()}</TableCell>
                          <TableCell>{trend.value}</TableCell>
                        </TableRow>
                      ))}
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