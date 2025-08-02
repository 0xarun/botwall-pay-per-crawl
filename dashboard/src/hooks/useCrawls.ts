// React Query hook for managing crawls data
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { API_BASE_URL } from '../lib/utils';

export interface Crawl {
  id: string;
  bot_id: string;
  site_id: string;
  status: 'success' | 'failed' | 'blocked';
  path: string;
  user_agent?: string;
  timestamp: string;
  bot_name?: string;
  site_name?: string;
  site_domain?: string;
}

export interface CrawlStats {
  totalCrawls: number;
  successfulCrawls: number;
  failedCrawls: number;
  blockedCrawls: number;
  totalEarnings?: number;
}

export function useCrawls(page: number = 1, limit: number = 20, excludeBrowsers: boolean = true) {
  const { user, profile } = useAuth();

  // Fetch crawls for site owners (crawls on their sites)
  const {
    data: siteOwnerCrawlsData,
    isLoading: isLoadingSiteCrawls,
    error: siteCrawlsError
  } = useQuery({
    queryKey: ['crawls', 'site-owner', user?.id, page, limit, excludeBrowsers],
    queryFn: async () => {
      if (!user || profile?.role !== 'site_owner') {
        return { crawls: [], pagination: null, filters: null };
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        excludeBrowsers: excludeBrowsers.toString()
      });

      const response = await fetch(`${API_BASE_URL}/crawls/site-owner?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch site crawls');
      }

      const data = await response.json();
      return data;
    },
    enabled: !!user && profile?.role === 'site_owner'
  });

  // Fetch crawls for bot developers (crawls from their bots)
  const {
    data: botDeveloperCrawlsData,
    isLoading: isLoadingBotCrawls,
    error: botCrawlsError
  } = useQuery({
    queryKey: ['crawls', 'bot-developer', user?.id, page, limit, excludeBrowsers],
    queryFn: async () => {
      if (!user || profile?.role !== 'bot_developer') {
        return { crawls: [], pagination: null, filters: null };
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        excludeBrowsers: excludeBrowsers.toString()
      });

      const response = await fetch(`${API_BASE_URL}/crawls/bot-developer?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bot crawls');
      }

      const data = await response.json();
      return data;
    },
    enabled: !!user && profile?.role === 'bot_developer'
  });

  return {
    siteOwnerCrawls: siteOwnerCrawlsData?.crawls || [],
    siteOwnerPagination: siteOwnerCrawlsData?.pagination,
    siteOwnerFilters: siteOwnerCrawlsData?.filters,
    botDeveloperCrawls: botDeveloperCrawlsData?.crawls || [],
    botDeveloperPagination: botDeveloperCrawlsData?.pagination,
    botDeveloperFilters: botDeveloperCrawlsData?.filters,
    isLoadingSiteCrawls,
    isLoadingBotCrawls,
    siteCrawlsError,
    botCrawlsError
  };
}

export function useCrawlStats() {
  const { user, profile } = useAuth();

  // Fetch crawl statistics for site owners
  const {
    data: siteOwnerStats,
    isLoading: isLoadingSiteStats,
    error: siteStatsError
  } = useQuery({
    queryKey: ['crawl-stats', 'site-owner', user?.id],
    queryFn: async (): Promise<CrawlStats> => {
      if (!user || profile?.role !== 'site_owner') {
        return { totalCrawls: 0, successfulCrawls: 0, failedCrawls: 0, blockedCrawls: 0 };
      }

      const response = await fetch(`${API_BASE_URL}/crawls/stats/site-owner`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch site crawl stats');
      }

      const data = await response.json();
      // If the response has a message and stats, return stats; else, return data directly
      if (data && typeof data === 'object' && 'totalCrawls' in data) {
        return data;
      } else if (data && typeof data === 'object' && 'stats' in data) {
        return data.stats;
      }
      return { totalCrawls: 0, successfulCrawls: 0, failedCrawls: 0, blockedCrawls: 0 };
    },
    enabled: !!user && profile?.role === 'site_owner'
  });

  // Fetch crawl statistics for bot developers
  const {
    data: botDeveloperStats,
    isLoading: isLoadingBotStats,
    error: botStatsError
  } = useQuery({
    queryKey: ['crawl-stats', 'bot-developer', user?.id],
    queryFn: async (): Promise<CrawlStats> => {
      if (!user || profile?.role !== 'bot_developer') {
        return { totalCrawls: 0, successfulCrawls: 0, failedCrawls: 0, blockedCrawls: 0 };
      }

      const response = await fetch(`${API_BASE_URL}/crawls/stats/bot-developer`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bot crawl stats');
      }

      const data = await response.json();
      // If the response has a message and stats, return stats; else, return data directly
      if (data && typeof data === 'object' && 'totalCrawls' in data) {
        return data;
      } else if (data && typeof data === 'object' && 'stats' in data) {
        return data.stats;
      }
      return { totalCrawls: 0, successfulCrawls: 0, failedCrawls: 0, blockedCrawls: 0 };
    },
    enabled: !!user && profile?.role === 'bot_developer'
  });

  return {
    siteOwnerStats,
    botDeveloperStats,
    isLoadingSiteStats,
    isLoadingBotStats,
    siteStatsError,
    botStatsError
  };
}

export function useSiteBotLogs(siteId: string, limit: number = 100) {
  return useQuery({
    queryKey: ['site-bot-logs', siteId, limit],
    queryFn: async () => {
      if (!siteId) return [];
      
      // For now, just fetch from bot_crawl_logs table
      const response = await fetch(`${API_BASE_URL}/sites/${siteId}/bot-logs?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch bot logs');
      }
      
      const botLogs = await response.json();
      
      // Format the data
      return botLogs.map((log: any) => ({
        ...log,
        source: 'bot_crawl_logs',
        bot_name: log.bot_name || log.known_bot_name || 'Unknown'
      }));
    },
    enabled: !!siteId
  });
}

export function useSiteBotPreferences(siteId: string) {
  return useQuery({
    queryKey: ['site-bot-prefs', siteId],
    queryFn: async () => {
      if (!siteId) return [];
      const response = await fetch(`${API_BASE_URL}/sites/${siteId}/bot-prefs`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch bot preferences');
      }
      return await response.json();
    },
    enabled: !!siteId
  });
}

export function useKnownBots() {
  return useQuery({
    queryKey: ['known-bots'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/known-bots`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch known bots');
      }
      return await response.json();
    }
  });
}

export function useUpdateSiteBotPreference(siteId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ known_bot_id, blocked }: { known_bot_id: string; blocked: boolean }) => {
      const response = await fetch(`${API_BASE_URL}/sites/${siteId}/bot-prefs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ known_bot_id, blocked })
      });
      if (!response.ok) {
        throw new Error('Failed to update bot preference');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-bot-prefs', siteId] });
    }
  });
} 

export function useUnknownBots() {
  return useQuery({
    queryKey: ['unknown-bots'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/unknown-bots`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch unknown bots');
      }
      return await response.json();
    }
  });
}

export function useSiteUnknownBotPreferences(siteId: string) {
  return useQuery({
    queryKey: ['site-unknown-bot-prefs', siteId],
    queryFn: async () => {
      if (!siteId) return [];
      const response = await fetch(`${API_BASE_URL}/sites/${siteId}/unknown-bot-prefs`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch unknown bot preferences');
      }
      return await response.json();
    },
    enabled: !!siteId
  });
}

export function useUpdateSiteUnknownBotPreference(siteId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ unknown_bot_id, blocked }: { unknown_bot_id: string; blocked: boolean }) => {
      const response = await fetch(`${API_BASE_URL}/sites/${siteId}/unknown-bot-prefs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ unknown_bot_id, blocked })
      });
      if (!response.ok) {
        throw new Error('Failed to update unknown bot preference');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-unknown-bot-prefs', siteId] });
      queryClient.invalidateQueries({ queryKey: ['site-bot-prefs', siteId] });
    }
  });
} 