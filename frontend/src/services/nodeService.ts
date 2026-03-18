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
    
    // ✅ Ordenar los nodos por zona
    const nodes = response.data;
    const sortedNodes = nodes.sort((a, b) => {
      // Definir orden de prioridad por zona
      const getZoneOrder = (zone: string | null | undefined) => {
        if (!zone) return 99; // Sin zona al final
        
        const zoneLower = zone.toLowerCase();
        
        // Central/Grid cells
        if (zoneLower.includes('central') || zoneLower.includes('grid')) return 1;
        
        // Hubs
        if (zoneLower.includes('hub')) return 2;
        
        // Load Zones
        if (zoneLower.includes('load') || zoneLower.startsWith('lz')) return 3;
        
        // Reserves/Ancillary
        if (zoneLower.includes('reserve') || zoneLower.includes('ancillary')) return 4;
        
        return 5; // Otros
      };
      
      const orderA = getZoneOrder(a.zone);
      const orderB = getZoneOrder(b.zone);
      
      // Ordenar por grupo de zona
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      
      // Dentro de la misma zona, ordenar por ID
      return a.id - b.id;
    });
    
    return sortedNodes;
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
