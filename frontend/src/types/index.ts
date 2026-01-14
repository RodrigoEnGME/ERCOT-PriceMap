// User types
export enum UserRole {
  ADMIN = 'admin',
  PREMIUM = 'premium',
  BASIC = 'basic',
}

export interface User {
  id: number;
  email: string;
  username: string;
  full_name?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  full_name?: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

// Node types
export interface Node {
  id: number;
  code: string;
  name: string;
  latitude: number;
  longitude: number;
  market: string;
  zone?: string;
  is_active: boolean;
  created_at: string;
}

export interface NodeWithLatestPrice extends Node {
  latest_price?: number;
  latest_timestamp?: string;
}

// Price types
export enum DataType {
  PRICE = 'price',
  SOLAR_CAPTURE = 'solar_capture',
  WIND_CAPTURE = 'wind_capture',
}

export enum AggregationType {
  AVG = 'avg',
  MAX = 'max',
  MIN = 'min',
  SUM = 'sum',
}

export interface PriceRecord {
  id: number;
  node_id: number;
  timestamp: string;
  price?: number;
  solar_capture?: number;
  wind_capture?: number;
  market: string;
  created_at: string;
}

export interface TimeSeriesData {
  timestamp: string;
  value: number;
}

export interface NodePriceEvolution {
  node_id: number;
  node_code: string;
  node_name: string;
  data: TimeSeriesData[];
}

export interface PriceDistribution {
  node_id: number;
  node_code: string;
  prices: number[];
}

export interface CongestionData {
  node1_id: number;
  node2_id: number;
  node1_code: string;
  node2_code: string;
  timestamp: string;
  node1_price?: number;
  node2_price?: number;
  congestion_price?: number;
}

export interface AggregatedStats {
  avg?: number;
  max?: number;
  min?: number;
  count: number;
}

export interface AvailableYears {
  years: number[];
  markets: string[];
}

export interface HourlySnapshot {
  node_id: number;
  code: string;
  name: string;
  latitude: number;
  longitude: number;
  price: number;
  timestamp: string;
}

// Filter types
export interface FilterState {
  selectedYear?: number;
  selectedMonth?: number;
  selectedDay?: number;
  selectedHour?: number;
  selectedDate?: Date;
  selectedNode1?: number;
  selectedNode2?: number;
  aggregationType: AggregationType;
  dataType: DataType;
  market: string;
}

// Export types
export interface ExportRequest {
  node_ids: number[];
  start_date: string;
  end_date: string;
  data_type: DataType;
  include_aggregations: boolean;
}
