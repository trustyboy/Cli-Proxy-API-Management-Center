/**
 * 模型可用性管理 API
 * 用于获取不可用模型列表和重置模型状态
 */

import { apiClient } from './client';

export type UnavailableReason = 'quota_exceeded' | 'suspended' | 'cooldown';

export interface UnavailableModel {
  model_id: string;
  model_name: string;
  provider: string;
  client_id: string;
  reason: UnavailableReason;
  reason_text: string;
  since: string;
}

export interface UnavailableModelsResponse {
  models: UnavailableModel[];
  count: number;
}

export interface ResetModelAvailabilityRequest {
  client_id: string;
}

export interface ResetModelAvailabilityResponse {
  status: string;
  message: string;
  model_id: string;
  client_id: string;
}

const MODEL_AVAILABILITY_ENDPOINT = '/model-availability';

export const modelAvailabilityApi = {
  /**
   * 获取所有不可用模型列表
   */
  async getUnavailableModels(): Promise<UnavailableModelsResponse> {
    const data = await apiClient.get<UnavailableModelsResponse>(MODEL_AVAILABILITY_ENDPOINT);
    return data;
  },

  /**
   * 重置指定模型的可用性状态
   * @param modelId 模型 ID
   * @param clientId 客户端 ID
   */
  async resetModelAvailability(
    modelId: string,
    clientId: string
  ): Promise<ResetModelAvailabilityResponse> {
    const data = await apiClient.post<ResetModelAvailabilityResponse>(
      `${MODEL_AVAILABILITY_ENDPOINT}/${encodeURIComponent(modelId)}/reset`,
      { client_id: clientId }
    );
    return data;
  }
};
