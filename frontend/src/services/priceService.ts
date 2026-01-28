import { apiClient } from './api';
import {
  NodePriceEvolution,
  PriceDistribution,
  CongestionData,
  AggregatedStats,
  AvailableYears,
  HourlySnapshot,
  DataType,
} from '../types';

export const priceService = {
  async getAvailableYears(): Promise<AvailableYears> {
    const response = await apiClient.get<AvailableYears>('/prices/available-years');
    return response.data;
  },

  async getPriceEvolution(
    nodeId: number,
    startDate: string,
    endDate: string,
    dataType: DataType = DataType.PRICE
  ): Promise<NodePriceEvolution> {
    const response = await apiClient.get<NodePriceEvolution>(
      `/prices/evolution/${nodeId}`,
      {
        params: { start_date: startDate, end_date: endDate, data_type: dataType },
      }
    );
    return response.data;
  },

  async getYearlyComparison(
    nodeId: number,
    month: number,
    day: number,
    hour: number,
    dataType: DataType = DataType.PRICE
  ): Promise<any> {
    const response = await apiClient.get(
      `/prices/yearly-comparison/${nodeId}`,
      {
        params: { month, day, hour, data_type: dataType },
      }
    );
    return response.data;
  },

  async getMonthlyComparison(
    nodeId: number,
    year: number,
    day: number,
    hour: number,
    dataType: DataType = DataType.PRICE
  ): Promise<any> {
    const response = await apiClient.get(
      `/prices/monthly-comparison/${nodeId}`,
      {
        params: { year, day, hour, data_type: dataType },
      }
    );
    return response.data;
  },

  async getPriceDistribution(
    nodeId: number,
    startDate: string,
    endDate: string,
    dataType: DataType = DataType.PRICE
  ): Promise<PriceDistribution> {
    const response = await apiClient.get<PriceDistribution>(
      `/prices/distribution/${nodeId}`,
      {
        params: { start_date: startDate, end_date: endDate, data_type: dataType },
      }
    );
    return response.data;
  },

  async getAllNodesDistribution(
    timestamp: string,
    market: string = 'ERCOT',
    dataType: DataType = DataType.PRICE
  ): Promise<any> {
    const response = await apiClient.get(
      '/prices/all-nodes-distribution',
      {
        params: { timestamp, market, data_type: dataType },
      }
    );
    return response.data;
  },

  async getCongestionPricing(
    node1Id: number,
    node2Id: number,
    startDate: string,
    endDate: string
  ): Promise<CongestionData[]> {
    const response = await apiClient.get<CongestionData[]>('/prices/congestion', {
      params: {
        node1_id: node1Id,
        node2_id: node2Id,
        start_date: startDate,
        end_date: endDate,
      },
    });
    return response.data;
  },

  async getAggregatedStats(
    nodeId: number,
    startDate: string,
    endDate: string,
    dataType: DataType = DataType.PRICE
  ): Promise<AggregatedStats> {
    const response = await apiClient.get<AggregatedStats>(
      `/prices/stats/${nodeId}`,
      {
        params: { start_date: startDate, end_date: endDate, data_type: dataType },
      }
    );
    return response.data;
  },

  async getHourlySnapshot(
    timestamp: string,
    market: string = 'ERCOT'
  ): Promise<HourlySnapshot[]> {
    const response = await apiClient.get<HourlySnapshot[]>(
      '/prices/hourly-snapshot',
      {
        params: { timestamp, market },
      }
    );
    return response.data;
  },

  async getVoronoiMap(
    timestamp: string,
    market: string = 'MDA',
    dataType: DataType = DataType.PRICE
  ): Promise<any> {
    const response = await apiClient.get<any>(
      '/prices/voronoi-map',
      {
        params: { timestamp, market, datatype: dataType },
      }
    );
    return response.data;
  },
  async getStatusIndicators(
    timestamp: string,
    market: string = 'MDA',
    dataType: DataType = DataType.PRICE
  ): Promise<any[]> {
    const response = await apiClient.get<any[]>(
      '/prices/status-indicators',
      {
        params: { 
          timestamp, 
          market,
          datatype: dataType
        },
      }
    );
    return response.data;
  },
};
