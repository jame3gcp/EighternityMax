/**
 * OpenAI API 클라이언트 싱글톤
 * API 키 없으면 null 반환. 민감정보(키/프롬프트 본문) 로깅 금지.
 */
import OpenAI from 'openai';
import { config } from '../config/index.js';

let clientInstance = null;

/**
 * @returns {OpenAI | null} API 키가 있으면 클라이언트, 없으면 null
 */
export function getOpenAIClient() {
  if (clientInstance !== null) return clientInstance;
  const key = config.openaiApiKey && config.openaiApiKey.trim();
  if (!key) return null;
  clientInstance = new OpenAI({
    apiKey: key,
    timeout: config.openaiTimeoutMs,
  });
  return clientInstance;
}

/**
 * @returns {boolean} OpenAI 사용 가능 여부
 */
export function isOpenAIAvailable() {
  return !!getOpenAIClient();
}
