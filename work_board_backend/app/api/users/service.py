from sqlalchemy import select

from app.core.db import db_manager
from app.core.models import Users


async def get_all_users():

    select_query = (
        select(Users)
        .order_by(Users.create_date)
    )

    result = await db_manager.fetch_all(db="DB", query=select_query)
    return result
