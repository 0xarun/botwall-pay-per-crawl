// React Query hook for managing bots data
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

// Use VITE_BACKEND_URL from environment, fallback to '/api' for relative proxy in dev
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || '/api';
// To set: add VITE_BACKEND_URL=http://localhost:3001/api (or your prod URL) to your .env file

export interface Bot {
  id: string;
  developer_id: string;
  bot_name: string;
  bot_id: string;
  api_key: string;
  credits: number;
  usage_reason?: string;
  public_key?: string;
  generated_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBotData {
  bot_name: string;
  usage_reason?: string;
}

export interface UpdateBotData {
  bot_name?: string;
  usage_reason?: string;
}

export interface BotOnboarding {
  bot: Bot & { private_key?: { value: string; description: string } };
  docs?: { info: string };
  message: string;
}

export function useBots() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all bots for the current user
  const {
    data: bots = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['bots', user?.id],
    queryFn: async (): Promise<Bot[]> => {
      if (!user) throw new Error('User not authenticated');

      const response = await fetch(`${API_BASE_URL}/bots`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bots');
      }

      const data = await response.json();
      // If the response is wrapped in { bots: [...] }
      if (Array.isArray(data)) return data;
      if (Array.isArray(data.bots)) return data.bots;
      return [];
    },
    enabled: !!user
  });

  // Create a new bot (using /api/register-bot)
  const createBotMutation = useMutation({
    mutationFn: async (botData: CreateBotData): Promise<BotOnboarding> => {
      if (!user) throw new Error('User not authenticated');

      const response = await fetch(`${API_BASE_URL}/register-bot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...botData, developer_id: user.id })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to register bot');
      }

      const data = await response.json();
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots', user?.id] });
      toast({
        title: 'Bot registered successfully',
        description: 'Your bot has been registered with BotWall.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to register bot',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Update a bot
  const updateBotMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateBotData }): Promise<Bot> => {
      const response = await fetch(`${API_BASE_URL}/bots/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update bot');
      }

      const updatedBot = await response.json();
      return updatedBot;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots', user?.id] });
      toast({
        title: 'Bot updated successfully',
        description: 'Your bot settings have been updated.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update bot',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Delete a bot
  const deleteBotMutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`${API_BASE_URL}/bots/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete bot');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bots', user?.id] });
      toast({
        title: 'Bot deleted successfully',
        description: 'Your bot has been removed from BotWall.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete bot',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  return {
    bots,
    isLoading,
    error,
    createBot: createBotMutation.mutateAsync,
    createBotStatus: createBotMutation,
    updateBot: updateBotMutation.mutate,
    deleteBot: deleteBotMutation.mutate,
    isCreating: createBotMutation.isPending,
    isUpdating: updateBotMutation.isPending,
    isDeleting: deleteBotMutation.isPending
  };
} 