"""
app/seed.py — Automatic database seeder for auth-service demo accounts.
"""
import uuid
import structlog
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.models.auth import Organization, User
from app.core.security import hash_password

log = structlog.get_logger(__name__)

DEFAULT_ORG_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")

DEMO_USERS = [
    {
        "id": uuid.UUID("00000000-0000-0000-0000-000000000010"),
        "email": "admin@wareops.dev",
        "display_name": "Admin User",
    },
    {
        "id": uuid.UUID("00000000-0000-0000-0000-000000000011"),
        "email": "manager@wareops.dev",
        "display_name": "Manager User",
    },
    {
        "id": uuid.UUID("00000000-0000-0000-0000-000000000012"),
        "email": "supervisor@wareops.dev",
        "display_name": "Supervisor User",
    },
    {
        "id": uuid.UUID("00000000-0000-0000-0000-000000000013"),
        "email": "operator@wareops.dev",
        "display_name": "Operator User",
    },
]

async def seed_initial_data() -> None:
    """Ensure initial organization and demo user accounts exist."""
    async with AsyncSessionLocal() as session:
        try:
            # Check default Organization
            result = await session.execute(
                select(Organization).where(Organization.id == DEFAULT_ORG_ID)
            )
            org = result.scalars().first()

            if not org:
                log.info("Seeding default organization...", org_id=str(DEFAULT_ORG_ID))
                org = Organization(
                    id=DEFAULT_ORG_ID,
                    name="WAREOps Enterprise",
                    slug="wareops-enterprise",
                    is_active=True,
                )
                session.add(org)
                await session.commit()

            # Seed Users
            default_password_hash = hash_password("Password123!")

            for u_data in DEMO_USERS:
                res = await session.execute(
                    select(User).where(User.email == u_data["email"])
                )
                existing_user = res.scalars().first()
                if not existing_user:
                    log.info("Seeding demo user...", email=u_data["email"])
                    new_user = User(
                        id=u_data["id"],
                        org_id=DEFAULT_ORG_ID,
                        email=u_data["email"],
                        display_name=u_data["display_name"],
                        password_hash=default_password_hash,
                        status="ACTIVE",
                        mfa_enabled=False,
                    )
                    session.add(new_user)
            await session.commit()
            log.info("Database seeding completed successfully.")
        except Exception as exc:
            await session.rollback()
            log.error("Failed to seed initial auth data", error=str(exc))
