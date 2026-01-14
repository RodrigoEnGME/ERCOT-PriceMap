import { apiClient } from './api';
import { Node, NodeWithLatestPrice } from '../types';

export const nodeService = {
  async getNodes(params?: {
    skip?: number;
    limit?: number;
    market?: string;
    active_only?: boolean;
  }): Promise<Node[]> {
    const response = await apiClient.get<Node[]>('/nodes', { params });
    return response.data;
  },

  async getNodesWithPrices(params?: {
    market?: string;
    active_only?: boolean;
  }): Promise<NodeWithLatestPrice[]> {
    const response = await apiClient.get<NodeWithLatestPrice[]>(
      '/nodes/with-prices',
      { params }
    );
    return response.data;
  },

  async getNodeById(id: number): Promise<Node> {
    const response = await apiClient.get<Node>(`/nodes/${id}`);
    return response.data;
  },
};
