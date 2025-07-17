import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Coins, Zap, Crown, Sparkles } from 'lucide-react';
import { useBots } from '@/hooks/useBots';
import { useCreateCheckout, useMockCreditPurchase, CREDIT_PACKAGES, CreditPackage } from '@/hooks/usePayments';
import { useToast } from '@/hooks/use-toast';

interface CreditPurchaseProps {
  onSuccess?: () => void;
}

export function CreditPurchase({ onSuccess }: CreditPurchaseProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBotId, setSelectedBotId] = useState<string>('');
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const { bots, isLoading: botsLoading } = useBots();
  const { createCheckout, isCreating } = useCreateCheckout();
  const { mockPurchase, isPurchasing } = useMockCreditPurchase();
  const { toast } = useToast();

  const handlePurchase = async (useMock: boolean = false) => {
    if (!selectedBotId || !selectedPackage) {
      toast({
        title: 'Selection required',
        description: 'Please select a bot and credit package.',
        variant: 'destructive',
      });
      return;
    }

    if (useMock) {
      // Use mock purchase for development
      await mockPurchase({
        botId: selectedBotId,
        credits: selectedPackage.credits,
        amount: selectedPackage.price
      });
      setIsOpen(false);
      onSuccess?.();
    } else {
      // Use real LemonSqueezy checkout
      await createCheckout({
        botId: selectedBotId,
        packName: selectedPackage.name
      });
      setIsOpen(false);
      onSuccess?.();
    }
  };

  const getPackageIcon = (packageId: string) => {
    switch (packageId) {
      case 'starter':
        return <Coins className="h-5 w-5" />;
      case 'pro':
        return <Zap className="h-5 w-5" />;
      case 'enterprise':
        return <Crown className="h-5 w-5" />;
      default:
        return <Coins className="h-5 w-5" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="w-full">
          <CreditCard className="mr-2 h-4 w-4" />
          Buy Credits
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Purchase Credits
          </DialogTitle>
          <DialogDescription>
            Buy credits to access protected content. Each crawl request costs 1 credit.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Bot Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Bot</label>
            <Select value={selectedBotId} onValueChange={setSelectedBotId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a bot to credit" />
              </SelectTrigger>
              <SelectContent>
                {botsLoading ? (
                  <SelectItem value="" disabled>Loading bots...</SelectItem>
                ) : bots.length === 0 ? (
                  <SelectItem value="" disabled>No bots available</SelectItem>
                ) : (
                  bots.map((bot) => (
                    <SelectItem key={bot.id} value={bot.bot_id}>
                      {bot.bot_name} ({bot.credits} credits)
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Credit Packages */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Select Package</label>
            <div className="grid gap-3">
              {CREDIT_PACKAGES.map((pkg) => (
                <Card
                  key={pkg.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedPackage?.id === pkg.id
                      ? 'ring-2 ring-primary bg-primary/5'
                      : ''
                  } ${pkg.popular ? 'border-primary/50' : ''}`}
                  onClick={() => setSelectedPackage(pkg)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getPackageIcon(pkg.id)}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{pkg.credits} Credits</span>
                            {pkg.popular && (
                              <Badge variant="default" className="text-xs">
                                <Sparkles className="h-3 w-3 mr-1" />
                                Popular
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ${pkg.price.toFixed(2)}
                            {pkg.savings && pkg.savings > 0 && (
                              <span className="text-primary ml-2">
                                ({pkg.savings}% savings)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-lg font-bold">${pkg.price.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">
                        ${(pkg.price / pkg.credits).toFixed(3)}/credit
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Purchase Summary */}
          {selectedPackage && selectedBotId && (
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Package:</span>
                    <span className="font-medium">{selectedPackage.credits} Credits</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Price:</span>
                    <span className="font-medium">${selectedPackage.price.toFixed(2)}</span>
                  </div>
                  {selectedPackage.savings && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Savings:</span>
                      <span className="font-medium text-primary">
                        {selectedPackage.savings}%
                      </span>
                    </div>
                  )}
                  <div className="border-t pt-2">
                    <div className="flex justify-between">
                      <span className="font-semibold">Total:</span>
                      <span className="font-bold text-lg">${selectedPackage.price.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            
            {/* Mock Purchase Button (for development) */}
            <Button
              variant="outline"
              onClick={() => handlePurchase(true)}
              disabled={!selectedBotId || !selectedPackage || isPurchasing}
              className="flex-1"
            >
              {isPurchasing ? 'Processing...' : 'Mock Purchase'}
            </Button>
            
            {/* Real Purchase Button */}
            <Button
              onClick={() => handlePurchase(false)}
              disabled={!selectedBotId || !selectedPackage || isCreating}
              className="flex-1"
            >
              {isCreating ? 'Opening Checkout...' : 'Purchase Credits'}
            </Button>
          </div>

          {/* Development Note */}
          <div className="text-xs text-muted-foreground text-center">
            <p>💡 For development, use "Mock Purchase" to simulate credit addition without payment.</p>
            <p>In production, "Purchase Credits" will open LemonSqueezy checkout.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 