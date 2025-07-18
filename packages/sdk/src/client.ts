// BotWall SDK Core Client

// Using global fetch for Node.js 18+ or browser environments
import { BotConfig, SiteConfig, VerifyResponse, FetchOptions, BotWallResponse } from './types';
import { createErrorFromResponse, NetworkError } from './errors';

export class BotWallClient {
  private apiUrl: string;

  constructor(apiUrl?: string) {
    // Use BACKEND_URL from environment, fallback to '/api' for relative proxy in dev
    // To set: add BACKEND_URL=http://localhost:3001/api (or your prod URL) to your .env file
    this.apiUrl = apiUrl || process.env.BACKEND_URL || '/api';
  }

  /**
   * Verify bot and site credentials, check credits, and deduct 1 credit
   * @param botConfig - Bot configuration with ID and API key
   * @param siteConfig - Site configuration with ID
   * @param options - Additional options like path and user agent
   * @returns Promise<VerifyResponse>
   */
  async verify(
    botConfig: BotConfig,
    siteConfig: SiteConfig,
    options: FetchOptions = {}
  ): Promise<VerifyResponse> {
    try {
      const response = await fetch(`${this.apiUrl}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          botId: botConfig.botId,
          botApiKey: botConfig.apiKey,
          siteId: siteConfig.id,
          path: options.path || '/',
          userAgent: options.userAgent
        }),
      });

      if (!response.ok) {
        throw await createErrorFromResponse(response);
      }

      const data = await response.json() as VerifyResponse;
      return data;
    } catch (error) {
      if (error instanceof NetworkError) {
        throw error;
      }
      throw new NetworkError(`Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Manually deduct credits from a bot (alternative to automatic deduction)
   * @param botConfig - Bot configuration with ID and API key
   * @param creditsToDeduct - Number of credits to deduct (default: 1)
   * @returns Promise<{ creditsDeducted: number; remainingCredits: number }>
   */
  async deductCredits(
    botConfig: BotConfig,
    creditsToDeduct: number = 1
  ): Promise<{ creditsDeducted: number; remainingCredits: number }> {
    try {
      const response = await fetch(`${this.apiUrl}/verify/deduct-credits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          botId: botConfig.botId,
          botApiKey: botConfig.apiKey,
          creditsToDeduct
        }),
      });

      if (!response.ok) {
        throw await createErrorFromResponse(response);
      }

      const data = await response.json() as { creditsDeducted: number; remainingCredits: number };
      return data;
    } catch (error) {
      if (error instanceof NetworkError) {
        throw error;
      }
      throw new NetworkError(`Credit deduction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get bot information including current credit balance
   * @param botConfig - Bot configuration with ID and API key
   * @returns Promise<{ botId: string; botName: string; credits: number }>
   */
  async getBotInfo(botConfig: BotConfig): Promise<{ botId: string; botName: string; credits: number }> {
    try {
      const response = await fetch(`${this.apiUrl}/bots/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          botId: botConfig.botId,
          botApiKey: botConfig.apiKey
        }),
      });

      if (!response.ok) {
        throw await createErrorFromResponse(response);
      }

      const data = await response.json() as { botId: string; botName: string; credits: number };
      return data;
    } catch (error) {
      if (error instanceof NetworkError) {
        throw error;
      }
      throw new NetworkError(`Failed to get bot info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 