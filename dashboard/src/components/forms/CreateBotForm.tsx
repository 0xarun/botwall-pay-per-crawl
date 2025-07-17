import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Bot, Code, Key, Eye, Copy } from 'lucide-react';
import { useBots, CreateBotData, BotOnboarding } from '@/hooks/useBots';

const createBotSchema = z.object({
  bot_name: z.string().min(1, 'Bot name is required').max(100, 'Bot name must be less than 100 characters'),
  usage_reason: z.string().optional()
});

type CreateBotFormData = z.infer<typeof createBotSchema>;

interface CreateBotFormProps {
  onSuccess?: () => void;
}

export function CreateBotForm({ onSuccess }: CreateBotFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [onboarding, setOnboarding] = useState<BotOnboarding | null>(null);
  const { createBot, isCreating } = useBots();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<CreateBotFormData>({
    resolver: zodResolver(createBotSchema)
  });

  const onSubmit = async (data: CreateBotFormData) => {
    try {
      const result = await createBot(data);
      setOnboarding(result);
      reset();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setOnboarding(null);
    onSuccess?.();
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Optionally show a toast here
    } catch {}
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Create New Bot
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Create New Bot
          </DialogTitle>
          <DialogDescription>
            Register a new bot to get API keys and start accessing protected content through our SDK.
          </DialogDescription>
        </DialogHeader>
        {onboarding ? (
          <div className="space-y-4">
            <div className="bg-yellow-100 dark:bg-yellow-900 p-4 rounded">
              <div className="flex items-center gap-2 mb-2">
                <Key className="h-5 w-5 text-yellow-700 dark:text-yellow-200" />
                <span className="font-semibold text-yellow-800 dark:text-yellow-100">Private Key (shown only once)</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <code className="bg-white dark:bg-gray-800 p-2 rounded font-mono text-xs break-all flex-1">{onboarding.bot.private_key?.value}</code>
                <Button size="icon" variant="ghost" onClick={() => copyToClipboard(onboarding.bot.private_key?.value || '', 'Private Key')}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-xs text-yellow-800 dark:text-yellow-200">
                {onboarding.bot.private_key?.description}
              </div>
            </div>
            <div className="bg-muted p-3 rounded">
              <div className="font-mono text-xs mb-1">Public Key:</div>
              <code className="font-mono text-xs break-all">{onboarding.bot.public_key}</code>
            </div>
            <div className="text-xs text-muted-foreground">Generated at: {onboarding.bot.generated_at}</div>
            {onboarding.docs?.info && (
              <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded text-xs mt-2">
                {onboarding.docs.info}
              </div>
            )}
            <Button className="w-full mt-4" onClick={handleClose}>Done</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bot_name">Bot Name</Label>
              <Input
                id="bot_name"
                placeholder="My Data Crawler"
                {...register('bot_name')}
              />
              {errors.bot_name && (
                <p className="text-sm text-destructive">{errors.bot_name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="usage_reason" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                Usage Reason (Optional)
              </Label>
              <Textarea
                id="usage_reason"
                placeholder="Describe what your bot will be used for..."
                rows={3}
                {...register('usage_reason')}
              />
              {errors.usage_reason && (
                <p className="text-sm text-destructive">{errors.usage_reason.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Help site owners understand how your bot will use their data
              </p>
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isCreating}
                className="flex-1"
              >
                {isCreating ? 'Creating...' : 'Create Bot'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
} 