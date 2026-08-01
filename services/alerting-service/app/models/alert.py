from sqlalchemy.dialects.postgresql import UUID as PgUUID, ENUM as PgEnum
from sqlalchemy import Column, String, Integer, Numeric, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
import uuid
from app.database import Base

# Enum type already created by init.sql — create_type=False prevents SQLAlchemy
# from trying to CREATE TYPE again.
_mismatch_type = PgEnum(
    'CORRECT_PLACEMENT', 'MISPLACED', 'MISSING', 'DUPLICATE', 'UNKNOWN', 'QUANTITY_DISCREPANCY',
    name='mismatch_type', create_type=False
)
_alert_severity = PgEnum(
    'INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL',
    name='alert_severity', create_type=False
)
_alert_status = PgEnum(
    'OPEN', 'ACKNOWLEDGED', 'ACTION_REQUIRED', 'RESOLVED', 'DISMISSED', 'FALSE_POSITIVE',
    name='alert_status', create_type=False
)


class Product(Base):
    __tablename__ = 'products'
    sku = Column(String(100), primary_key=True)
    name = Column(String(500), nullable=False)
    description = Column(String)
    category = Column(String(100))
    brand = Column(String(200))
    unit_of_measure = Column(String(50), default='EACH')
    weight_kg = Column(Numeric(10, 4))
    length_cm = Column(Numeric(8, 2))
    width_cm = Column(Numeric(8, 2))
    height_cm = Column(Numeric(8, 2))
    barcode_value = Column(String(255))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())


class Inventory(Base):
    __tablename__ = 'inventory'
    id = Column(PgUUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    bin_id = Column(PgUUID(as_uuid=False), nullable=False)
    sku = Column(String(100), ForeignKey('products.sku'), nullable=False)
    expected_qty = Column(Integer, nullable=False, default=1)
    lot_number = Column(String(100))
    expiry_date = Column(DateTime)
    last_wms_sync = Column(DateTime(timezone=True), default=func.now())
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())


class ReconciliationResult(Base):
    __tablename__ = 'reconciliation_results'
    id = Column(PgUUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    observation_id = Column(PgUUID(as_uuid=False), nullable=False)
    warehouse_id = Column(PgUUID(as_uuid=False), nullable=False)
    bin_id = Column(PgUUID(as_uuid=False))
    sku = Column(String(100))
    result_type = Column(_mismatch_type, nullable=False)
    expected_sku = Column(String(100))
    expected_qty = Column(Integer)
    observed_sku = Column(String(100))
    observed_qty = Column(Integer, default=1)
    expected_bin_id = Column(PgUUID(as_uuid=False))
    reconciled_at = Column(DateTime(timezone=True), default=func.now())
    confidence = Column(Numeric(5, 4))


class Alert(Base):
    __tablename__ = 'alerts'
    id = Column(PgUUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    warehouse_id = Column(PgUUID(as_uuid=False), nullable=False)
    reconciliation_id = Column(PgUUID(as_uuid=False), ForeignKey('reconciliation_results.id'))
    observation_id = Column(PgUUID(as_uuid=False))
    bin_id = Column(PgUUID(as_uuid=False))
    sku = Column(String(100))
    alert_type = Column(_mismatch_type, nullable=False)
    severity = Column(_alert_severity, default='MEDIUM')
    status = Column(_alert_status, default='OPEN')
    title = Column(String(500), nullable=False)
    description = Column(String)
    expected_value = Column(String)
    observed_value = Column(String)
    acknowledged_by = Column(PgUUID(as_uuid=False))
    acknowledged_at = Column(DateTime(timezone=True))
    resolved_by = Column(PgUUID(as_uuid=False))
    resolved_at = Column(DateTime(timezone=True))
    resolution_notes = Column(String)
    auto_resolvable = Column(Boolean, default=False)
    rescan_requested = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=func.now())
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
