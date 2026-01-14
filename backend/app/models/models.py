from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Enum as SQLEnum, ForeignKey, Index
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.db.database import Base


class UserRole(str, enum.Enum):
    """User roles enum."""
    ADMIN = "admin"
    PREMIUM = "premium"
    BASIC = "basic"


class DataType(str, enum.Enum):
    """Data type enum for price records."""
    PRICE = "price"
    SOLAR_CAPTURE = "solar_capture"
    WIND_CAPTURE = "wind_capture"


class User(Base):
    """User model."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    role = Column(SQLEnum(UserRole), default=UserRole.BASIC, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<User(username='{self.username}', role='{self.role}')>"


class Node(Base):
    """Node model - represents electrical nodes in ERCOT."""
    __tablename__ = "nodes"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    market = Column(String(50), nullable=False)  # e.g., "ERCOT"
    zone = Column(String(50))  # Optional zone/region
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationship with price records
    price_records = relationship("PriceRecord", back_populates="node", cascade="all, delete-orphan")
    
    # Index for geospatial queries
    __table_args__ = (
        Index('idx_node_location', 'latitude', 'longitude'),
        Index('idx_node_market', 'market'),
    )
    
    def __repr__(self):
        return f"<Node(code='{self.code}', name='{self.name}')>"


class PriceRecord(Base):
    """Price record model - stores hourly data for each node."""
    __tablename__ = "price_records"
    
    id = Column(Integer, primary_key=True, index=True)
    node_id = Column(Integer, ForeignKey("nodes.id"), nullable=False, index=True)
    timestamp = Column(DateTime, nullable=False, index=True)
    
    # Data fields
    price = Column(Float)  # $/MWh
    solar_capture = Column(Float)  # MW
    wind_capture = Column(Float)  # MW
    
    # Market info
    market = Column(String(50), nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationship with node
    node = relationship("Node", back_populates="price_records")
    
    # Composite indexes for efficient queries
    __table_args__ = (
        Index('idx_price_node_timestamp', 'node_id', 'timestamp'),
        Index('idx_price_timestamp', 'timestamp'),
        Index('idx_price_market_timestamp', 'market', 'timestamp'),
    )
    
    def __repr__(self):
        return f"<PriceRecord(node_id={self.node_id}, timestamp='{self.timestamp}', price={self.price})>"
