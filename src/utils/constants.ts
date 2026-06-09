// src/utils/constants.ts

export const LLM_CONFIG = {
  DEFAULT_MODEL: 'deepseek-chat',
  DEFAULT_BASE_URL: 'https://api.deepseek.com/v1',
  DEFAULT_TEMPERATURE: 0.8,
  DEFAULT_MAX_TOKENS: 4096,
  MAX_TOOL_ROUNDS: 3,
  REQUEST_TIMEOUT_MS: 30_000,
  MAX_RETRIES: 3,
  RETRY_BASE_DELAY_MS: 1000,
} as const;

export const STORAGE_KEYS = {
  API_CONFIG: 'sg_api_config',
  CHARACTERS: 'sg_characters',
  ACTIVE_CHARACTER: 'sg_active_character',
  CHAT_HISTORY: 'sg_chat_history',
  DISCLAIMER_READ: 'sg_disclaimer_read',
} as const;
