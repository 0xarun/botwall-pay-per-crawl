import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Copy, Check, Code, Download } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface SiteConfigDisplayProps {
  siteId: string;
  siteName: string;
  frontendDomain: string;
  backendDomain: string;
  monetizedRoutes: string[];
  pricePerCrawl: number;
  middlewareCode: string;
  instructions: string;
}

export const SiteConfigDisplay: React.FC<SiteConfigDisplayProps> = ({
  siteId,
  siteName,
  frontendDomain,
  backendDomain,
  monetizedRoutes,
  pricePerCrawl,
  middlewareCode,
  instructions
}) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(middlewareCode);
      setCopied(true);
      toast({
        title: 'Code copied!',
        description: 'Middleware code has been copied to clipboard.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: 'Failed to copy',
        description: 'Please copy the code manually.',
        variant: 'destructive',
      });
    }
  };

  const downloadCode = () => {
    const blob = new Blob([middlewareCode], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `botwall-middleware-${siteId}.js`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Code downloaded!',
      description: 'Middleware code has been downloaded.',
    });
  };

  return (
    <div className="space-y-6">
      {/* Site Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
              {siteId}
            </span>
            {siteName}
          </CardTitle>
          <CardDescription>
            Your site has been created successfully! Here's your middleware configuration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">🌐 Frontend Domain</h4>
              <p className="text-sm text-muted-foreground">{frontendDomain}</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">🖥️ Backend Domain</h4>
              <p className="text-sm text-muted-foreground">{backendDomain}</p>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="font-medium mb-2">💰 Monetized Routes</h4>
            <div className="flex flex-wrap gap-2">
              {monetizedRoutes.map((route, index) => (
                <Badge key={index} variant="secondary">
                  {route}
                </Badge>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">💵 Price per Crawl</h4>
            <p className="text-sm text-muted-foreground">${pricePerCrawl.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Middleware Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Middleware Code
          </CardTitle>
          <CardDescription>
            Copy this code and add it to your Express.js application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={copyToClipboard} variant="outline" size="sm">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy Code'}
              </Button>
              <Button onClick={downloadCode} variant="outline" size="sm">
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
            
            <div className="relative">
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                <code>{middlewareCode}</code>
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Installation Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Installation Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-sm text-muted-foreground">
              {instructions}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <h3 className="font-medium text-green-800">🎉 Setup Complete!</h3>
            <p className="text-sm text-green-700">
              Your site is now configured for bot monetization. 
              Install the middleware on <strong>{backendDomain}</strong> to start earning.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 