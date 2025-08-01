import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Globe, DollarSign, Server } from 'lucide-react';
import { useSites, CreateSiteData } from '@/hooks/useSites';
import { RouteSelector } from '@/components/RouteSelector';
import { SiteConfigDisplay } from '@/components/SiteConfigDisplay';

const createSiteSchema = z.object({
  name: z.string().min(1, 'Site name is required').max(100, 'Site name must be less than 100 characters'),
  frontend_domain: z.string().min(1, 'Frontend domain is required'),
  backend_domain: z.string().min(1, 'Backend domain is required'),
  monetized_routes: z.array(z.string()).min(1, 'At least one monetized route is required'),
  price_per_crawl: z.number().min(0.001, 'Price must be at least $0.001').max(100, 'Price must be less than $100')
});

type CreateSiteFormData = z.infer<typeof createSiteSchema>;

interface CreateSiteFormProps {
  onSuccess?: () => void;
}

export function CreateSiteForm({ onSuccess }: CreateSiteFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [createdSite, setCreatedSite] = useState<any>(null);
  const { createSite, isCreating } = useSites();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm<CreateSiteFormData>({
    resolver: zodResolver(createSiteSchema),
    defaultValues: {
      price_per_crawl: 0.01,
      monetized_routes: ['/*']
    }
  });

  const monetizedRoutes = watch('monetized_routes') || ['/*'];

  const onSubmit = async (data: CreateSiteFormData) => {
    try {
      const siteData: CreateSiteData = {
        name: data.name!,
        frontend_domain: data.frontend_domain!,
        backend_domain: data.backend_domain!,
        monetized_routes: data.monetized_routes || ['/*'],
        price_per_crawl: data.price_per_crawl || 0.01
      };
      const result = await createSite(siteData);
      setCreatedSite(result);
      setShowConfig(true);
      reset();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setShowConfig(false);
    setCreatedSite(null);
    onSuccess?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add New Site
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Add New Site
          </DialogTitle>
          <DialogDescription>
            Register your website to start monetizing bot access. You'll get a site ID and API key to protect your routes.
          </DialogDescription>
        </DialogHeader>
        {!showConfig ? (
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
              <Label htmlFor="frontend_domain" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Frontend Domain
              </Label>
              <Input
                id="frontend_domain"
                placeholder="example.com"
                {...register('frontend_domain')}
              />
              {errors.frontend_domain && (
                <p className="text-sm text-destructive">{errors.frontend_domain.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Your main website domain (e.g., example.com)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="backend_domain" className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                Backend Domain
              </Label>
              <Input
                id="backend_domain"
                placeholder="api.example.com"
                {...register('backend_domain')}
              />
              {errors.backend_domain && (
                <p className="text-sm text-destructive">{errors.backend_domain.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Your API server domain where middleware will be installed
              </p>
            </div>

            <RouteSelector
              routes={monetizedRoutes}
              onChange={(routes) => setValue('monetized_routes', routes)}
              label="💰 Monetized Routes (Pay-per-crawl)"
              placeholder="e.g., /api/*, /docs/*"
            />
            {errors.monetized_routes && (
              <p className="text-sm text-destructive">{errors.monetized_routes.message}</p>
            )}

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
                onClick={handleClose}
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
        ) : (
          <div className="space-y-4">
            {createdSite && (
              <SiteConfigDisplay
                siteId={createdSite.siteId}
                siteName={createdSite.site.name}
                frontendDomain={createdSite.site.frontend_domain}
                backendDomain={createdSite.site.backend_domain}
                monetizedRoutes={createdSite.site.monetized_routes}
                pricePerCrawl={createdSite.site.price_per_crawl}
                middlewareCode={createdSite.middlewareCode}
                instructions={createdSite.instructions}
              />
            )}
            <div className="flex justify-end">
              <Button onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 