import os
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker

# Ensure database path is consistent regardless of execution working directory
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "verifyai.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class AuditHistory(Base):
    """
    SQLAlchemy model recording institutional compliance audit history.
    Columns: id, institution_name, status, findings_count, timestamp.
    """
    __tablename__ = "audit_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    institution_name = Column(String, default="Unknown Institution")
    status = Column(String, default="NEEDS_REVIEW")
    findings_count = Column(Integer, default=0)
    timestamp = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "institution_name": self.institution_name,
            "status": self.status,
            "findings_count": self.findings_count,
            "timestamp": self.timestamp.strftime("%Y-%m-%d %H:%M:%S") if self.timestamp else None,
        }

def init_db():
    """Initializes tables in the SQLite database."""
    Base.metadata.create_all(bind=engine)

def save_audit(institution_name: str, status: str, findings_count: int) -> dict:
    """
    Saves an audit verification record to SQLite database and returns the created record dict.
    """
    db = SessionLocal()
    try:
        record = AuditHistory(
            institution_name=institution_name or "Unknown Institution",
            status=status,
            findings_count=findings_count,
            timestamp=datetime.utcnow(),
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        print(f"[Database] Saved Audit #{record.id}: {record.institution_name} - Status: {record.status} ({record.findings_count} findings)")
        return record.to_dict()
    except Exception as e:
        db.rollback()
        print(f"[Database] Error saving audit history: {e}")
        return None
    finally:
        db.close()

def get_recent_audits(limit: int = 10) -> list:
    """
    Fetches the latest audit history entries ordered by most recent first.
    """
    db = SessionLocal()
    try:
        records = (
            db.query(AuditHistory)
            .order_by(AuditHistory.id.desc())
            .limit(limit)
            .all()
        )
        return [r.to_dict() for r in records]
    except Exception as e:
        print(f"[Database] Error retrieving audit history: {e}")
        return []
    finally:
        db.close()
