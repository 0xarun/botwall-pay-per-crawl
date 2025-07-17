import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Webhook, Play, CheckCircle, AlertCircle } from 'lucide-react';
import { useProcessWebhook } from '@/hooks/usePayments';
import { useToast } from '@/hooks/use-toast';

export function WebhookTester() {
  const [webhookData, setWebhookData] = useState(`{
  "event_name": "order_created",
  "data": {
    "id": "test_order_123",
    "attributes": {
      "custom": {
        "bot_id": "bot_123",
        "transaction_id": "txn_456",
        "credits": "1000",
        "amount": "8.00"
      }
    }
  }
}`);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string } | null>(null);
  const { processWebhook, isProcessing: isProcessingWebhook } = useProcessWebhook();
  const { toast } = useToast();

  const handleTestWebhook = async () => {
    setIsProcessing(true);
    setLastResult(null);

    try {
      const parsedData = JSON.parse(webhookData);
      await processWebhook(parsedData);
      
      setLastResult({
        success: true,
        message: 'Webhook processed successfully! Credits should be added to the bot.'
      });
      
      toast({
        title: 'Webhook Test Successful',
        description: 'The webhook was processed and credits were added.',
      });
    } catch (error: any) {
      setLastResult({
        success: false,
        message: error.message || 'Failed to process webhook'
      });
      
      toast({
        title: 'Webhook Test Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const loadSampleWebhook = () => {
    setWebhookData(`{
  "event_name": "order_created",
  "data": {
    "id": "test_order_${Date.now()}",
    "attributes": {
      "custom": {
        "bot_id": "bot_123",
        "transaction_id": "txn_${Date.now()}",
        "credits": "1000",
        "amount": "8.00"
      }
    }
  }
}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Webhook className="h-5 w-5" />
          Webhook Tester (Development)
        </CardTitle>
        <CardDescription>
          Test webhook processing for development. This simulates LemonSqueezy webhook events.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="webhook-data">Webhook Data (JSON)</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={loadSampleWebhook}
            >
              Load Sample
            </Button>
          </div>
          <Textarea
            id="webhook-data"
            value={webhookData}
            onChange={(e) => setWebhookData(e.target.value)}
            placeholder="Paste webhook JSON data here..."
            className="font-mono text-sm"
            rows={10}
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleTestWebhook}
            disabled={isProcessing || isProcessingWebhook}
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            {isProcessing || isProcessingWebhook ? 'Processing...' : 'Test Webhook'}
          </Button>
        </div>

        {lastResult && (
          <div className={`p-4 rounded-lg border ${
            lastResult.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {lastResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <Badge variant={lastResult.success ? 'default' : 'destructive'}>
                {lastResult.success ? 'Success' : 'Error'}
              </Badge>
            </div>
            <p className="mt-2 text-sm">{lastResult.message}</p>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>💡 This component helps test the webhook processing flow during development.</p>
          <p>• Use "Load Sample" to get a sample webhook payload</p>
          <p>• Modify the data to test different scenarios</p>
          <p>• In production, this would be handled by the Edge Function</p>
        </div>
      </CardContent>
    </Card>
  );
} 