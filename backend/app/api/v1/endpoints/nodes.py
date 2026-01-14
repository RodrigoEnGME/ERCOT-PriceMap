from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.db.database import get_db
from app.models import Node, PriceRecord, User
from app.schemas import (
    NodeCreate, NodeUpdate, NodeResponse, NodeWithLatestPrice
)
from app.api.dependencies import get_current_active_user, require_admin

router = APIRouter(prefix="/nodes", tags=["Nodes"])


@router.get("", response_model=List[NodeResponse])
def get_nodes(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    market: Optional[str] = None,
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get list of nodes."""
    query = db.query(Node)
    
    if active_only:
        query = query.filter(Node.is_active == True)
    
    if market:
        query = query.filter(Node.market == market)
    
    # SQL Server requiere ORDER BY cuando se usa OFFSET/LIMIT
    nodes = query.order_by(Node.id).offset(skip).limit(limit).all()
    return nodes


@router.get("/with-prices", response_model=List[NodeWithLatestPrice])
def get_nodes_with_latest_price(
    market: Optional[str] = None,
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get nodes with their latest price."""
    query = db.query(Node)
    
    if active_only:
        query = query.filter(Node.is_active == True)
    
    if market:
        query = query.filter(Node.market == market)
    
    nodes = query.all()
    
    result = []
    for node in nodes:
        # Get latest price record
        latest_record = (
            db.query(PriceRecord)
            .filter(PriceRecord.node_id == node.id)
            .order_by(PriceRecord.timestamp.desc())
            .first()
        )
        
        node_data = NodeWithLatestPrice(
            id=node.id,
            code=node.code,
            name=node.name,
            latitude=node.latitude,
            longitude=node.longitude,
            market=node.market,
            zone=node.zone,
            is_active=node.is_active,
            created_at=node.created_at,
            latest_price=latest_record.price if latest_record else None,
            latest_timestamp=latest_record.timestamp if latest_record else None
        )
        result.append(node_data)
    
    return result


@router.get("/{node_id}", response_model=NodeResponse)
def get_node(
    node_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get a specific node by ID."""
    node = db.query(Node).filter(Node.id == node_id).first()
    
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Node not found"
        )
    
    return node


@router.post("", response_model=NodeResponse, status_code=status.HTTP_201_CREATED)
def create_node(
    node_data: NodeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create a new node (admin only)."""
    # Check if code already exists
    existing = db.query(Node).filter(Node.code == node_data.code).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Node code already exists"
        )
    
    db_node = Node(**node_data.dict())
    db.add(db_node)
    db.commit()
    db.refresh(db_node)
    
    return db_node


@router.put("/{node_id}", response_model=NodeResponse)
def update_node(
    node_id: int,
    node_data: NodeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update a node (admin only)."""
    node = db.query(Node).filter(Node.id == node_id).first()
    
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Node not found"
        )
    
    # Update fields
    update_data = node_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(node, field, value)
    
    db.commit()
    db.refresh(node)
    
    return node


@router.delete("/{node_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_node(
    node_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete a node (admin only)."""
    node = db.query(Node).filter(Node.id == node_id).first()
    
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Node not found"
        )
    
    db.delete(node)
    db.commit()
    
    return None
