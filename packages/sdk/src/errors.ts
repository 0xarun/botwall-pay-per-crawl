// BotWall SDK Error Classes

import { BotWallError } from './types';

export class BotWallSDKError extends Error {
  public code: BotWallError['code'];
  public status?: number;
  public details?: any;

  constructor(error: BotWallError) {
    super(error.message);
    this.name = 'BotWallSDKError';
    this.code = error.code;
    this.status = error.status;
    this.details = error.details;
  }
}

export class InvalidCredentialsError extends BotWallSDKError {
  constructor(message = 'Invalid bot or site credentials') {
    super({
      code: 'INVALID_CREDENTIALS',
      message,
      status: 401
    });
    this.name = 'InvalidCredentialsError';
  }
}

export class InsufficientCreditsError extends BotWallSDKError {
  constructor(message = 'Insufficient credits to perform this action') {
    super({
      code: 'INSUFFICIENT_CREDITS',
      message,
      status: 402
    });
    this.name = 'InsufficientCreditsError';
  }
}

export class NetworkError extends BotWallSDKError {
  constructor(message = 'Network error occurred', details?: any) {
    super({
      code: 'NETWORK_ERROR',
      message,
      details
    });
    this.name = 'NetworkError';
  }
}

export class ValidationError extends BotWallSDKError {
  constructor(message = 'Validation error', details?: any) {
    super({
      code: 'VALIDATION_ERROR',
      message,
      details
    });
    this.name = 'ValidationError';
  }
}

// Helper function to create errors from HTTP responses
export async function createErrorFromResponse(response: Response): Promise<BotWallSDKError> {
  let message: string;
  try {
    const errorData = await response.json() as { message?: string };
    message = errorData.message || `HTTP ${response.status}`;
  } catch {
    message = `HTTP ${response.status}: ${response.statusText}`;
  }

  switch (response.status) {
    case 401:
      return new InvalidCredentialsError(message);
    case 402:
      return new InsufficientCreditsError(message);
    case 400:
      return new ValidationError(message);
    default:
      return new NetworkError(message);
  }
} 