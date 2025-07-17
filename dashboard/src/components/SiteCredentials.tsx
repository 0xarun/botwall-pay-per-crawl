import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Site } from '@/hooks/useSites';

interface SiteCredentialsProps {
  site: Site;
}

export function SiteCredentials({ site }: SiteCredentialsProps) {
  const { toast } = useToast();

  // Remove all credential display and middleware code. Only show site name, domain, and price per crawl.
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Site Info
        </CardTitle>
        <CardDescription>
          Your site is protected by BotWall. No credentials are needed for integration.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Site Name</label>
          <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
            <span className="text-lg font-bold">{site.name}</span>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Domain</label>
          <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
            <span className="text-lg font-bold">{site.domain}</span>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Price per Crawl</label>
          <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
            <span className="text-lg font-bold">${Number(site.price_per_crawl).toFixed(3)}</span>
            <Badge variant="outline">per request</Badge>
          </div>
        </div>
      </CardContent>
      {/* Middleware Integration Code for Publishers */}
      <div className="pt-4 border-t mt-4">
        <div className="mb-2 font-semibold">Middleware Integration</div>
        <div className="bg-muted p-4 rounded-md mb-2">
          <pre className="text-sm overflow-x-auto">
            <code>{`npm install @botwall/sdk\n\nconst { validateCrawlRequest } = require('@botwall/middleware');\n\n// Protect your API routes (no credentials needed)\napp.use('/api', validateCrawlRequest);`}</code>
          </pre>
        </div>
        <Button
          variant="outline"
          onClick={() => navigator.clipboard.writeText(`npm install @botwall/sdk\n\nconst { validateCrawlRequest } = require('@botwall/middleware');\n\n// Protect your API routes (no credentials needed)\napp.use('/api', validateCrawlRequest);`)}
        >
          Copy Middleware Code
        </Button>
      </div>
    </Card>
  );
} 