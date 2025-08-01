import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { CheckCircle, XCircle, AlertTriangle, Clock, RefreshCw, ExternalLink } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface MiddlewareVerification {
  id: string;
  site_id: string;
  status: 'installed' | 'not_installed' | 'error' | 'unknown';
  last_check: string;
  last_successful_check: string | null;
  verification_token: string;
  middleware_version: string | null;
  error_message: string | null;
  domain: string;
}

interface MiddlewareStatusProps {
  siteId: string;
  siteDomain: string;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'installed':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'not_installed':
      return <XCircle className="h-5 w-5 text-red-500" />;
    case 'error':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    default:
      return <Clock className="h-5 w-5 text-gray-500" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'installed':
      return <Badge variant="default" className="bg-green-100 text-green-800">Installed</Badge>;
    case 'not_installed':
      return <Badge variant="destructive">Not Installed</Badge>;
    case 'error':
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Error</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleString();
};

const getTimeAgo = (dateString: string | null) => {
  if (!dateString) return 'Never';
  
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  return `${diffDays} days ago`;
};

export const MiddlewareStatus: React.FC<MiddlewareStatusProps> = ({ siteId, siteDomain }) => {
  const [verification, setVerification] = useState<MiddlewareVerification | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchVerificationStatus = async () => {
    try {
      const response = await fetch(`/api/sites/${siteId}/middleware-status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setVerification(data);
      } else {
        console.error('Failed to fetch verification status');
      }
    } catch (error) {
      console.error('Error fetching verification status:', error);
    }
  };

  const triggerVerification = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`/api/sites/${siteId}/verify-middleware`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Verification initiated",
          description: "Check the instructions below to complete the verification.",
        });
        
        // Show instructions in a more prominent way
        setVerification(prev => prev ? {
          ...prev,
          verification_url: data.verificationUrl,
          instructions: data.instructions
        } : null);
      } else {
        const errorData = await response.json();
        toast({
          title: "Verification failed",
          description: errorData.message || "Failed to initiate verification",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to trigger verification",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVerificationStatus();
  }, [siteId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading middleware status...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {verification && getStatusIcon(verification.status)}
            Middleware Status
          </div>
          <div className="flex items-center gap-2">
            {verification && getStatusBadge(verification.status)}
            <Button
              variant="outline"
              size="sm"
              onClick={triggerVerification}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Verifying...' : 'Verify'}
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Monitor the installation and health status of your Botwall middleware
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {verification ? (
          <>
            {/* Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Status:</span>
                  <span className="text-sm">{verification.status}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Last Check:</span>
                  <span className="text-sm">{getTimeAgo(verification.last_check)}</span>
                </div>
                {verification.last_successful_check && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Last Success:</span>
                    <span className="text-sm">{getTimeAgo(verification.last_successful_check)}</span>
                  </div>
                )}
                {verification.middleware_version && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Version:</span>
                    <span className="text-sm">{verification.middleware_version}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Domain:</span>
                  <span className="text-sm">{verification.domain}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Token:</span>
                  <span className="text-sm font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                    {verification.verification_token.substring(0, 8)}...
                  </span>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {verification.error_message && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Error:</strong> {verification.error_message}
                </AlertDescription>
              </Alert>
            )}

            {/* Installation Instructions */}
            {verification.status === 'unknown' && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p><strong>Middleware not detected.</strong> To verify your installation:</p>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      <li>Add the health check endpoint to your middleware</li>
                      <li>Call the endpoint periodically (every 5-10 minutes)</li>
                      <li>Include the verification token in the request</li>
                      <li>Click "Verify" to check the status</li>
                    </ol>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Health Check URL */}
            {verification.verification_url && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Health Check URL:</h4>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-gray-100 p-2 rounded break-all">
                    {verification.verification_url}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(verification.verification_url)}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            )}

            {/* Detailed Instructions */}
            {verification.instructions && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Installation Instructions:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                  {verification.instructions.map((instruction: string, index: number) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ol>
              </div>
            )}

            <Separator />

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchVerificationStatus}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Status
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://${siteDomain}`, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Visit Site
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No verification data available</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={triggerVerification}
            >
              Initialize Verification
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 