from sqlalchemy import select

from app.core.db import db_manager
from app.core.models import Groups


async def get_all_groups():

    select_query = (
        select(Groups)
        .order_by(Groups.create_date)
    )

    result = await db_manager.fetch_all(db="DB", query=select_query)
    return result


async def get_group_info(group_key):
    select_query = (
        select(Groups)
        .where(Groups.id == group_key)
        .order_by(Groups.create_date)
    )

    result = await db_manager.fetch_one(db="DB", query=select_query)
    return result
