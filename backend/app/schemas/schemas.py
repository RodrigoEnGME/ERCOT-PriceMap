from pydantic import BaseModel, EmailStr, Field, validator
from datetime import datetime
from typing import Optional, List
from enum import Enum


class UserRole(str, Enum):
    """User roles."""
    ADMIN = "admin"
    PREMIUM = "premium"
    BASIC = "basic"


class DataType(str, Enum):
    """Data types for filtering."""
    PRICE = "price"
    SOLAR_CAPTURE = "solar_capture"
    WIND_CAPTURE = "wind_capture"
    NEGATIVE_HOURS = "negative_hours"
    NODES = "nodes"


class AggregationType(str, Enum):
    """Aggregation types for data analysis."""
    AVG = "avg"
    MAX = "max"
    MIN = "min"
    SUM = "sum"


# User Schemas
class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=100)
    full_name: Optional[str] = None


class UserCreate(UserBase):
    """User creation schema."""
    password: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    """User update schema."""
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = Field(None, min_length=8)
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    """User response schema."""
    id: int
    role: UserRole
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# Authentication Schemas
class Token(BaseModel):
    """Token response schema."""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Token payload data."""
    username: Optional[str] = None


class LoginRequest(BaseModel):
    """Login request schema."""
    username: str
    password: str


# Node Schemas
class NodeBase(BaseModel):
    """Base node schema."""
    code: str = Field(..., max_length=50)
    name: str = Field(..., max_length=255)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    market: str = Field(..., max_length=50)
    zone: Optional[str] = Field(None, max_length=50)


class NodeCreate(NodeBase):
    """Node creation schema."""
    pass


class NodeUpdate(BaseModel):
    """Node update schema."""
    name: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    zone: Optional[str] = None
    is_active: Optional[bool] = None


class NodeResponse(NodeBase):
    """Node response schema."""
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class NodeWithLatestPrice(NodeResponse):
    """Node with latest price data."""
    latest_price: Optional[float] = None
    latest_timestamp: Optional[datetime] = None


# Price Record Schemas
class PriceRecordBase(BaseModel):
    """Base price record schema."""
    node_id: int
    timestamp: datetime
    price: Optional[float] = None
    solar_capture: Optional[float] = None
    wind_capture: Optional[float] = None
    negative_hours: Optional[float] = None
    market: str


class PriceRecordCreate(PriceRecordBase):
    """Price record creation schema."""
    pass


class PriceRecordResponse(PriceRecordBase):
    """Price record response schema."""
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class PriceRecordWithNode(PriceRecordResponse):
    """Price record with node information."""
    node: NodeResponse


# Analytics Schemas
class TimeSeriesData(BaseModel):
    """Time series data point."""
    timestamp: datetime
    value: float


class NodePriceEvolution(BaseModel):
    """Node price evolution over time."""
    node_id: int
    node_code: str
    node_name: str
    data: List[TimeSeriesData]


class YearlyComparison(BaseModel):
    """Price data for a specific year."""
    year: int
    value: float


class MonthlyComparison(BaseModel):
    """Price data for a specific month."""
    month: int
    value: Optional[float]


class NodeYearlyComparison(BaseModel):
    """Price comparison across years for same date/hour."""
    node_id: int
    node_code: str
    node_name: str
    month: int
    day: int
    hour: int
    data: List[YearlyComparison]


class NodeMonthlyComparison(BaseModel):
    """Price comparison across months for same day/hour in a year."""
    node_id: int
    node_code: str
    node_name: str
    year: int
    day: int
    hour: int
    data: List[MonthlyComparison]


class NodePricePoint(BaseModel):
    """Single node price point."""
    node_id: int
    node_code: str
    node_name: str
    price: float


class PriceDistribution(BaseModel):
    """Price distribution data."""
    node_id: int
    node_code: str
    prices: List[float]  # Sorted from highest to lowest


class AllNodesPriceDistribution(BaseModel):
    """Price distribution across all nodes for a specific timestamp."""
    timestamp: datetime
    data: List[NodePricePoint]  # Sorted from highest to lowest


class CongestionData(BaseModel):
    """Congestion pricing between two nodes."""
    node1_id: int
    node2_id: int
    node1_code: str
    node2_code: str
    timestamp: datetime
    node1_price: Optional[float]
    node2_price: Optional[float]
    congestion_price: Optional[float]


class AggregatedStats(BaseModel):
    """Aggregated statistics."""
    avg: Optional[float] = None
    max: Optional[float] = None
    min: Optional[float] = None
    count: int


class SystemStats(BaseModel):
    """System-wide aggregated statistics."""
    avg_price: Optional[float] = None
    total_solar: Optional[float] = None
    total_wind: Optional[float] = None
    timestamp: datetime


# Filter Schemas
class PriceQueryFilters(BaseModel):
    """Filters for price queries."""
    node_ids: Optional[List[int]] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    year: Optional[int] = Field(None, ge=2023, le=2030)
    month: Optional[int] = Field(None, ge=1, le=12)
    day: Optional[int] = Field(None, ge=1, le=31)
    hour: Optional[int] = Field(None, ge=0, le=23)
    market: Optional[str] = None
    data_type: DataType = DataType.PRICE
    aggregation: Optional[AggregationType] = None


class AvailableYears(BaseModel):
    """Available years in the database."""
    years: List[int]
    markets: List[str]


# Pagination Schemas
class PaginatedResponse(BaseModel):
    """Generic paginated response."""
    items: List[dict]
    total: int
    page: int
    page_size: int
    total_pages: int


# Export Schema
class ExportRequest(BaseModel):
    """Export data request."""
    node_ids: List[int]
    start_date: datetime
    end_date: datetime
    data_type: DataType = DataType.PRICE
    include_aggregations: bool = True
