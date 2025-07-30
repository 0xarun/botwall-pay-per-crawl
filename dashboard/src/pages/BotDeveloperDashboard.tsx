import { useAuth } from '@/hooks/useAuth';
import { useBots } from '@/hooks/useBots';
import { useCrawls, useCrawlStats } from '@/hooks/useCrawls';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Bot, CreditCard, Activity, Code, Coins, Trash2, Copy, Eye, EyeOff, BarChart3, TrendingUp, Zap } from 'lucide-react';
import { CreateBotForm } from '@/components/forms/CreateBotForm';
import { CreditPurchase } from '@/components/CreditPurchase';
import { TransactionHistory } from '@/components/TransactionHistory';
import { WebhookTester } from '@/components/WebhookTester';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Sidebar, SidebarNav } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

export default function BotDeveloperDashboard() {
  const { profile, signOut } = useAuth();
  const { bots, isLoading: botsLoading, deleteBot, isDeleting } = useBots();
  const { botDeveloperCrawls, isLoadingBotCrawls } = useCrawls();
  const { botDeveloperStats, isLoadingBotStats } = useCrawlStats();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState('bots');

  const handleDeleteBot = async (botId: string, botName: string) => {
    if (confirm(`Are you sure you want to delete "${botName}"? This action cannot be undone.`)) {
      try {
        await deleteBot(botId);
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

  const totalCredits = bots.reduce((sum, bot) => sum + bot.credits, 0);

  const handleRefreshBots = () => {
    queryClient.invalidateQueries({ queryKey: ['bots', profile?.id] });
    queryClient.invalidateQueries({ queryKey: ['crawl-stats', 'bot-developer', profile?.id] });
    toast({
      title: 'Data refreshed',
      description: 'Bot list, credit balances, and stats updated.',
    });
  };

  // Sidebar navigation items
  const sidebarItems = [
    {
      title: 'Bots',
      href: 'bots',
      icon: Bot,
      badge: bots?.length?.toString() || '0'
    },
    {
      title: 'Crawl Activities',
      href: 'activities',
      icon: Activity,
      badge: botDeveloperStats?.totalCrawls?.toString() || '0'
    },
    {
      title: 'Payment Analytics',
      href: 'analytics',
      icon: BarChart3
    },
    {
      title: 'Payments',
      href: 'payments',
      icon: CreditCard
    }
  ];

  const renderBotsSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Bots</h2>
          <p className="text-muted-foreground">Manage your bots and credit balances</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleRefreshBots} className="font-medium">
            Refresh
          </Button>
          <CreateBotForm />
        </div>
        </div>
        
        {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-background/80 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold">Active Bots</CardTitle>
            <Bot className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
            <div className="text-3xl font-bold mb-2">
              {botsLoading ? '...' : bots?.length || 0}
              </div>
            <p className="text-sm text-muted-foreground">
              {bots?.length === 0 ? 'No bots created yet' : 'Bots created'}
              </p>
            </CardContent>
          </Card>

        <Card className="bg-background/80 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold">Total Credits</CardTitle>
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
            <div className="text-3xl font-bold mb-2">
                {botsLoading ? '...' : totalCredits}
              </div>
            <p className="text-sm text-muted-foreground">
              Available across all bots
              </p>
            </CardContent>
          </Card>

        <Card className="bg-background/80 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold">Crawl Requests</CardTitle>
            <Activity className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
            <div className="text-3xl font-bold mb-2">
                {isLoadingBotStats ? '...' : botDeveloperStats?.totalCrawls || 0}
              </div>
            <p className="text-sm text-muted-foreground">
                {botDeveloperStats?.successfulCrawls || 0} successful, {botDeveloperStats?.failedCrawls || 0} failed
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
                {isLoadingBotStats || !botDeveloperStats?.totalCrawls ? '--' : 
                  `${Math.round((botDeveloperStats.successfulCrawls / botDeveloperStats.totalCrawls) * 100)}%`}
              </div>
            <p className="text-sm text-muted-foreground">
                Successful requests
              </p>
            </CardContent>
          </Card>
        </div>

      {/* Bots List */}
            <Card>
              <CardHeader>
          <CardTitle>Your Bots</CardTitle>
                <CardDescription>
            Manage your bots and view their credit balances
                </CardDescription>
              </CardHeader>
              <CardContent>
          {botsLoading ? (
            <div className="text-center py-8">Loading bots...</div>
          ) : bots && bots.length > 0 ? (
            <div className="space-y-6">
                {bots.map((bot) => (
                <Card key={bot.id} className="border-border/50">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Bot className="h-8 w-8 text-primary" />
                        <div>
                          <div className="text-xs text-muted-foreground font-mono mb-1">Bot ID: {bot.bot_id}</div>
                          <CardTitle className="flex items-center gap-2">
                            {bot.bot_name}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {bot.usage_reason || 'No usage reason provided'}
                          </CardDescription>
                        </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={bot.credits > 0 ? 'default' : 'destructive'}>
                            {bot.credits} credits
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Bot Name:</span>
                          <div className="font-mono text-xs bg-muted p-2 rounded mt-1 truncate">
                            {bot.bot_name}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Created:</span>
                          <div className="mt-1">
                            {formatDistanceToNow(new Date(bot.created_at), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                    
                      {/* Ed25519 Public Key */}
                      {bot.public_key && (
                        <div className="space-y-2">
                          <span className="text-sm font-medium">Ed25519 Public Key</span>
                          <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                            <code className="text-xs font-mono break-all flex-1">{bot.public_key}</code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(bot.public_key, 'Public Key')}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="text-xs text-muted-foreground">Generated at: {bot.generated_at}</div>
                        </div>
                      )}
                    
                      {/* SDK Code */}
                      <div className="space-y-2">
                        <span className="text-sm font-medium">SDK Usage:</span>
                        <div className="bg-muted p-3 rounded-md">
                          <pre className="text-xs overflow-x-auto">
                            <code>{`import { signRequest, sendCrawlRequest } from '@botwall/sdk';

const headers = {
  'crawler-id': 'YOUR_BOT_ID',
  'crawler-max-price': '0.05',
  'signature-input': 'crawler-id crawler-max-price',
};

headers['signature'] = signRequest(headers, 'YOUR_PRIVATE_KEY_BASE64');

await sendCrawlRequest('https://target-site.com/api/protected', headers);`}</code>
                          </pre>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(`import { generateKeypair, signRequest, sendCrawlRequest } from '@botwall/sdk';\n\n// 1. Generate keypair (once)\nconst { publicKey, privateKey } = generateKeypair();\n// Register publicKey with BotWall, keep privateKey safe\n\n// 2. Prepare headers for a crawl\nconst headers = {\n  'crawler-id': 'mybot.com',\n  'crawler-max-price': '0.05',\n  'signature-input': 'host path',\n  'host': 'techblog.com',\n  'path': '/api/data',\n};\n\n// 3. Sign the request\nheaders['signature'] = signRequest(headers, privateKey);\n\n// 4. Send the request (manual or with helper)\nconst response = await sendCrawlRequest('https://techblog.com/api/data', headers, privateKey);\nconst data = await response.json();\nconsole.log(data);`, 'SDK code')}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy SDK Code
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteBot(bot.id, bot.bot_name)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4" />
                        Delete Bot
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
          ) : (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No bots yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first bot to start crawling protected sites
              </p>
              <CreateBotForm />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderActivitiesSection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Crawl Activities</h2>
        <p className="text-muted-foreground">Monitor your bot's crawl requests and performance</p>
      </div>

            <Card>
              <CardHeader>
          <CardTitle>Recent Crawl Requests</CardTitle>
                <CardDescription>
            Track all your bot activities and their success rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingBotCrawls ? (
            <div className="text-center py-8">Loading activities...</div>
          ) : botDeveloperCrawls && botDeveloperCrawls.length > 0 ? (
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
                {botDeveloperCrawls.slice(0, 10).map((crawl) => (
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
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No activities yet</h3>
              <p className="text-muted-foreground">
                Crawl activities will appear here once your bots start making requests
              </p>
            </div>
                )}
              </CardContent>
            </Card>
    </div>
  );

  const renderAnalyticsSection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Payment Analytics</h2>
        <p className="text-muted-foreground">Track your credit usage and spending patterns</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Credit Usage</CardTitle>
            <CardDescription>
              Monitor your credit consumption over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">Total Credits Used</h3>
                  <p className="text-sm text-muted-foreground">Lifetime credit consumption</p>
                </div>
                               <div className="text-right">
                 <div className="text-2xl font-bold text-primary">
                   {botDeveloperStats?.totalCrawls || 0}
                 </div>
               </div>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">Total Spent</h3>
                  <p className="text-sm text-muted-foreground">Total amount spent on credits</p>
                </div>
                               <div className="text-right">
                 <div className="text-2xl font-bold text-warning">
                   $0.00
                 </div>
               </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>
              Key performance indicators for your bots
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">Success Rate</h3>
                  <p className="text-sm text-muted-foreground">Successful vs failed requests</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-success">
                    {isLoadingBotStats || !botDeveloperStats?.totalCrawls ? '--' : 
                      `${Math.round((botDeveloperStats.successfulCrawls / botDeveloperStats.totalCrawls) * 100)}%`}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">Avg Response Time</h3>
                  <p className="text-sm text-muted-foreground">Average request response time</p>
                </div>
                <div className="text-right">
                                   <div className="text-2xl font-bold">
                   --
                 </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderPaymentsSection = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Payments</h2>
        <p className="text-muted-foreground">Purchase credits and view transaction history</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
            <CardTitle>Purchase Credits</CardTitle>
                <CardDescription>
              Buy credits to power your bots
                </CardDescription>
              </CardHeader>
              <CardContent>
            <CreditPurchase />
              </CardContent>
            </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              View your payment history and credit purchases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TransactionHistory />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Webhook Tester</CardTitle>
          <CardDescription>
            Test your webhook integration for credit purchases
          </CardDescription>
        </CardHeader>
        <CardContent>
            <WebhookTester />
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'bots':
        return renderBotsSection();
      case 'activities':
        return renderActivitiesSection();
      case 'analytics':
        return renderAnalyticsSection();
      case 'payments':
        return renderPaymentsSection();
      default:
        return renderBotsSection();
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
            <span className="text-lg text-muted-foreground font-medium">Bot Developer Dashboard</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground font-medium">
              Welcome, {profile?.full_name || profile?.email}
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