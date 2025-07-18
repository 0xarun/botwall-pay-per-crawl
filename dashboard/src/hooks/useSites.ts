// React Query hook for managing sites data
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

// Use VITE_BACKEND_URL from environment, fallback to '/api' for relative proxy in dev
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || '/api';
// To set: add VITE_BACKEND_URL=http://localhost:3001/api (or your prod URL) to your .env file

export interface Site {
  id: string;
  owner_id: string;
  name: string;
  domain: string;
  price_per_crawl: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSiteData {
  name: string;
  domain: string;
  price_per_crawl: number;
}

export interface UpdateSiteData {
  name?: string;
  domain?: string;
  price_per_crawl?: number;
}

export function useSites() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all sites for the current user
  const {
    data: sites = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['sites', user?.id],
    queryFn: async (): Promise<Site[]> => {
      if (!user) throw new Error('User not authenticated');

      const response = await fetch(`${API_BASE_URL}/sites`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sites');
      }

      const data = await response.json();
      // Support both array and { sites: [...] }
      return Array.isArray(data) ? data : data.sites;
    },
    enabled: !!user
  });

  // Create a new site
  const createSiteMutation = useMutation({
    mutationFn: async (siteData: CreateSiteData): Promise<Site> => {
      if (!user) throw new Error('User not authenticated');

      const response = await fetch(`${API_BASE_URL}/sites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(siteData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create site');
      }

      const data = await response.json();
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites', user?.id] });
      toast({
        title: 'Site created successfully',
        description: 'Your site has been registered with BotWall.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create site',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Update a site
  const updateSiteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateSiteData }): Promise<Site> => {
      const response = await fetch(`${API_BASE_URL}/sites/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update site');
      }

      const updatedSite = await response.json();
      return updatedSite;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites', user?.id] });
      toast({
        title: 'Site updated successfully',
        description: 'Your site settings have been updated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update site',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Delete a site
  const deleteSiteMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`${API_BASE_URL}/sites/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete site');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites', user?.id] });
      toast({
        title: 'Site deleted successfully',
        description: 'Your site has been removed from BotWall.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete site',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  return {
    sites,
    isLoading,
    error,
    createSite: createSiteMutation.mutate,
    updateSite: updateSiteMutation.mutate,
    deleteSite: deleteSiteMutation.mutate,
    isCreating: createSiteMutation.isPending,
    isUpdating: updateSiteMutation.isPending,
    isDeleting: deleteSiteMutation.isPending
  };
} 