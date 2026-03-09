import fs from 'fs';
import path from 'path';
import { logger } from './logger.js';

/**
 * Parse the .env file and return values for the requested keys.
 * Does NOT load anything into process.env — callers decide what to
 * do with the values. This keeps secrets out of the process environment
 * so they don't leak to child processes.
 */
export function readEnvFile(keys: string[]): Record<string, string> {
  const envFile = path.join(process.cwd(), '.env');
  let content: string;
  try {
    content = fs.readFileSync(envFile, 'utf-8');
  } catch (err) {
    logger.debug({ err }, '.env file not found, using defaults');
    return {};
  }

  const result: Record<string, string> = {};
  const wanted = new Set(keys);

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    if (!wanted.has(key)) continue;
    let value = trimmed.slice(eqIdx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (value) result[key] = value;
  }

  return result;
}

/**
 * Return the Anthropic base URL for API calls.
 * Reads ANTHROPIC_BASE_URL from .env first, then falls back to process.env.
 */
export function getAnthropicBaseUrl(): string | undefined {
  const envValues = readEnvFile(['ANTHROPIC_BASE_URL']);
  return envValues.ANTHROPIC_BASE_URL || process.env.ANTHROPIC_BASE_URL;
}

/**
 * Return the model name to use.
 * Reads CLAUDE_MODEL from .env first, then falls back to process.env.
 */
export function getModelName(): string | undefined {
  const envValues = readEnvFile(['CLAUDE_MODEL']);
  return envValues.CLAUDE_MODEL || process.env.CLAUDE_MODEL;
}

/**
 * Return the small/fast model name used by the SDK for background operations
 * (Task tool subagents, etc.). Reads ANTHROPIC_SMALL_FAST_MODEL from .env
 * first, then falls back to process.env.
 */
export function getSmallFastModelName(): string | undefined {
  const envValues = readEnvFile(['ANTHROPIC_SMALL_FAST_MODEL']);
  return envValues.ANTHROPIC_SMALL_FAST_MODEL || process.env.ANTHROPIC_SMALL_FAST_MODEL;
}
