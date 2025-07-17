// React Query hook for managing payments and transactions
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useState } from 'react';

const API_BASE_URL = 'http://localhost:3001/api';

export interface Transaction {
  id: string;
  user_id: string;
  bot_id?: string;
  amount: number;
  credits: number;
  status: 'pending' | 'completed' | 'failed';
  lemon_order_id?: string;
  created_at: string;
}

export interface CreateCheckoutData {
  botId: string;
  packName: string;
}

export function useTransactions() {
  const { user } = useAuth();

  // Fetch all transactions for the current user
  const {
    data: transactions = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async (): Promise<Transaction[]> => {
      if (!user) throw new Error('User not authenticated');

      const response = await fetch(`${API_BASE_URL}/transactions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      return data;
    },
    enabled: !!user
  });

  return {
    transactions,
    isLoading,
    error
  };
}

export function useCreateCheckout() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createCheckoutMutation = useMutation({
    mutationFn: async (data: CreateCheckoutData): Promise<{ checkoutUrl: string }> => {
      if (!user) throw new Error('User not authenticated');

      const response = await fetch(`${API_BASE_URL}/transactions/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create checkout');
      }

      const result = await response.json();
      return result;
    },
    onSuccess: (data) => {
      // Open checkout in new window
      window.open(data.checkoutUrl, '_blank');
      toast({
        title: 'Checkout opened',
        description: 'Complete your purchase in the new window.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create checkout',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  return {
    createCheckout: createCheckoutMutation.mutate,
    isCreating: createCheckoutMutation.isPending
  };
}

export function useProcessPayment() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const processPaymentMutation = useMutation({
    mutationFn: async (transactionId: string): Promise<void> => {
      if (!user) throw new Error('User not authenticated');

      const response = await fetch(`${API_BASE_URL}/transactions/process/${transactionId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process payment');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['bots', user?.id] });
      toast({
        title: 'Payment processed',
        description: 'Your credits have been added to your bot.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to process payment',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  return {
    processPayment: processPaymentMutation.mutate,
    isProcessing: processPaymentMutation.isPending
  };
} 

// Credit package type and default packages
export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  popular?: boolean;
  savings?: number;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    credits: 100,
    price: 5.0,
    popular: false,
    savings: 0,
  },
  {
    id: 'pro',
    name: 'Pro Pack',
    credits: 250,
    price: 10.0,
    popular: true,
    savings: 20,
  },
  {
    id: 'enterprise',
    name: 'Enterprise Pack',
    credits: 1000,
    price: 25.0,
    popular: false,
    savings: 50,
  },
]; 

// Mock credit purchase hook (for development/testing)
export function useMockCreditPurchase() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isPurchasing, setIsPurchasing] = useState(false);

  const mockPurchase = async ({ botId, credits, amount }: { botId: string; credits: number; amount: number }) => {
    setIsPurchasing(true);
    try {
      // Call backend to add credits (dev only)
      const response = await fetch(`http://localhost:3001/api/bots/${botId}/mock-add-credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ credits })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add mock credits');
      }
      await response.json();
      // Refresh bots
      queryClient.invalidateQueries({ queryKey: ['bots', user?.id] });
      toast({
        title: 'Mock Purchase Successful',
        description: `Added ${credits} credits to bot (${botId}) for $${amount}.`,
      });
    } catch (error: any) {
      toast({
        title: 'Mock Purchase Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  return { mockPurchase, isPurchasing };
}

// Mock webhook processing hook (for development/testing)
export function useProcessWebhook() {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const processWebhook = async (transactionId: string, status: string) => {
    setIsProcessing(true);
    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast({
        title: 'Webhook Processed',
        description: `Transaction ${transactionId} status set to ${status}.`,
      });
    } catch (error: any) {
      toast({
        title: 'Webhook Processing Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return { processWebhook, isProcessing };
} 