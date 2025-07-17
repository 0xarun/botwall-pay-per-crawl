import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Globe, DollarSign } from 'lucide-react';
import { useSites, CreateSiteData } from '@/hooks/useSites';

const createSiteSchema = z.object({
  name: z.string().min(1, 'Site name is required').max(100, 'Site name must be less than 100 characters'),
  domain: z.string().min(1, 'Domain is required').url('Please enter a valid URL'),
  price_per_crawl: z.number().min(0.001, 'Price must be at least $0.001').max(100, 'Price must be less than $100')
});

type CreateSiteFormData = z.infer<typeof createSiteSchema>;

interface CreateSiteFormProps {
  onSuccess?: () => void;
}

export function CreateSiteForm({ onSuccess }: CreateSiteFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { createSite, isCreating } = useSites();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<CreateSiteFormData>({
    resolver: zodResolver(createSiteSchema),
    defaultValues: {
      price_per_crawl: 0.01
    }
  });

  const onSubmit = async (data: CreateSiteFormData) => {
    try {
      await createSite(data);
      reset();
      setIsOpen(false);
      onSuccess?.();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add New Site
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Add New Site
          </DialogTitle>
          <DialogDescription>
            Register your website to start monetizing bot access. You'll get a site ID and API key to protect your routes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Site Name</Label>
            <Input
              id="name"
              placeholder="My Awesome Website"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="domain">Domain</Label>
            <Input
              id="domain"
              placeholder="https://example.com"
              {...register('domain')}
            />
            {errors.domain && (
              <p className="text-sm text-destructive">{errors.domain.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="price_per_crawl" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Price per Crawl
            </Label>
            <Input
              id="price_per_crawl"
              type="number"
              step="0.001"
              min="0.001"
              max="100"
              placeholder="0.01"
              {...register('price_per_crawl', { valueAsNumber: true })}
            />
            {errors.price_per_crawl && (
              <p className="text-sm text-destructive">{errors.price_per_crawl.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Set the price bot developers will pay for each crawl request
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
              {isCreating ? 'Creating...' : 'Create Site'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 