import { useAuth } from '@/hooks/useAuth';
import { useBots } from '@/hooks/useBots';
import { useCrawls } from '@/hooks/useCrawls';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Bot, CreditCard, Activity, Code, Coins, Trash2, Copy, Eye, EyeOff } from 'lucide-react';
import { CreateBotForm } from '@/components/forms/CreateBotForm';
import { CreditPurchase } from '@/components/CreditPurchase';
import { TransactionHistory } from '@/components/TransactionHistory';
import { WebhookTester } from '@/components/WebhookTester';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';

export default function BotDeveloperDashboard() {
  const { profile, signOut } = useAuth();
  const { bots, isLoading: botsLoading, deleteBot, isDeleting } = useBots();
  const { botDeveloperCrawls, isLoadingBotCrawls, botDeveloperStats } = useCrawls();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Manual refresh handler
  const handleRefreshBots = () => {
    queryClient.invalidateQueries({ queryKey: ['bots', profile?.id] });
    toast({
      title: 'Bots refreshed',
      description: 'Bot list and credit balances updated.',
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
            <span className="text-muted-foreground">Bot Developer Dashboard</span>
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
          <Button variant="outline" size="sm" onClick={handleRefreshBots}>
            Refresh Bots
          </Button>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Bots</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {botsLoading ? '...' : bots.length}
              </div>
              <p className="text-xs text-muted-foreground">
                {bots.length === 0 ? 'No bots created yet' : 'Bots registered'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Credit Balance</CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {botsLoading ? '...' : totalCredits}
              </div>
              <p className="text-xs text-muted-foreground">
                {totalCredits === 0 ? 'Purchase credits to start crawling' : 'Available credits'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Requests Made</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingBotCrawls ? '...' : botDeveloperStats?.totalCrawls || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {botDeveloperStats?.successfulCrawls || 0} successful, {botDeveloperStats?.failedCrawls || 0} failed
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
                {isLoadingBotCrawls || !botDeveloperStats?.totalCrawls ? '--' : 
                  `${Math.round((botDeveloperStats.successfulCrawls / botDeveloperStats.totalCrawls) * 100)}%`}
              </div>
              <p className="text-xs text-muted-foreground">
                Successful requests
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="bots" className="space-y-6">
          <TabsList>
            <TabsTrigger value="bots">My Bots</TabsTrigger>
            <TabsTrigger value="activity">Crawl Activity</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>

          <TabsContent value="bots" className="space-y-6">
            {/* Add Bot Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create Your First Bot
                </CardTitle>
                <CardDescription>
                  Register a new bot to get API keys and start accessing protected content through our SDK.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CreateBotForm />
              </CardContent>
            </Card>

            {/* Bots List */}
            {bots.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {bots.map((bot) => (
                  <Card key={bot.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-muted-foreground font-mono mb-1">Bot ID: {bot.bot_id}</div>
                          <CardTitle className="flex items-center gap-2">
                            <Bot className="h-5 w-5" />
                            {bot.bot_name}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {bot.usage_reason || 'No usage reason provided'}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={bot.credits > 0 ? 'default' : 'destructive'}>
                            {bot.credits} credits
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(bot.public_key || '', 'Public Key')}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
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
                  Monitor your bot's access to protected content
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingBotCrawls ? (
                  <div className="text-center py-8">Loading crawl data...</div>
                ) : !Array.isArray(botDeveloperCrawls) || botDeveloperCrawls.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No crawl activity yet. Start using the SDK to access protected content.
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
                      {(Array.isArray(botDeveloperCrawls) ? botDeveloperCrawls.slice(0, 20) : []).map((crawl) => (
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

          <TabsContent value="payments" className="space-y-6">
            {/* Credit Purchase */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Purchase Credits
                </CardTitle>
                <CardDescription>
                  Buy credits to access protected content. Each crawl request costs 1 credit.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CreditPurchase onSuccess={() => {
                  // Auto-refresh bots after mock purchase
                  queryClient.invalidateQueries({ queryKey: ['bots', profile?.id] });
                  toast({
                    title: 'Credits updated',
                    description: 'Your bot credits have been updated.',
                  });
                }} />
              </CardContent>
            </Card>

            {/* Transaction History */}
            <TransactionHistory />

            {/* Development Tools */}
            <WebhookTester />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}