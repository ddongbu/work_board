import datetime
from typing import Optional

from sqlalchemy import (
    PrimaryKeyConstraint, UniqueConstraint, ForeignKey,
    Integer, Identity, DateTime, String, Boolean, text
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, mapped_column, Mapped


class Base(DeclarativeBase):
    pass


class Groups(Base):
    __tablename__ = 'groups'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='groups_pkey'),
        UniqueConstraint('name', name='groups_name_key'),
        {'comment': '그룹', 'schema': 'app'}
    )

    id: Mapped[int] = mapped_column(Integer,
        Identity(always=True, start=1, increment=1, minvalue=1, maxvalue=2147483647, cycle=False, cache=1),
        primary_key=True,
        comment='그룹 ID'
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, comment='그룹명')
    create_date: Mapped[datetime.datetime] = mapped_column(
        DateTime,
        server_default=text('NOW()'),
        comment='생성 일시'
    )
    update_date: Mapped[datetime.datetime] = mapped_column(
        DateTime,
        comment='수정 일시'
    )


class Users(Base):
    __tablename__ = 'users'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='users_pkey'),
        {'comment': '유저', 'schema': 'app'}
    )

    id: Mapped[int] = mapped_column(
        Integer,
        Identity(always=True, start=1, increment=1, minvalue=1, maxvalue=2147483647, cycle=False, cache=1),
        primary_key=True,
        comment='유저 ID'
    )
    group_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey('app.groups.id'),
        comment='그룹 ID'
    )
    username: Mapped[str] = mapped_column(String(100), nullable=False, comment='사용자명')
    role: Mapped[int] = mapped_column(Integer, server_default=text('1'), comment='역할 (leader, member)')
    create_date: Mapped[datetime.datetime] = mapped_column(
        DateTime,
        server_default=text('NOW()'),
        comment='생성 일시'
    )
    update_date: Mapped[datetime.datetime] = mapped_column(
        DateTime,
        comment='수정 일시'
    )


class FieldDefinitions(Base):
    __tablename__ = 'field_definitions'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='field_definitions_pkey'),
        {'comment': '필드 정의', 'schema': 'app'}
    )

    id: Mapped[int] = mapped_column(
        Integer,
        Identity(always=True, start=1, increment=1, minvalue=1, maxvalue=2147483647, cycle=False, cache=1),
        primary_key=True,
        comment='필드 정의 ID'
    )
    group_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey('app.groups.id'),
        comment='그룹 ID'
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False, comment='필드명')
    field_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment='필드 타입 (text, number, date, select)'
    )
    options: Mapped[Optional[dict]] = mapped_column(JSONB, comment='필드 옵션')
    display_order: Mapped[int] = mapped_column(Integer, server_default=text('0'), comment='표시 순서')
    is_required: Mapped[bool] = mapped_column(Boolean, server_default=text('false'), comment='필수 여부')
    create_date: Mapped[datetime.datetime] = mapped_column(
        DateTime,
        server_default=text('NOW()'),
        comment='생성 일시'
    )
    update_date: Mapped[datetime.datetime] = mapped_column(
        DateTime,
        server_default=text('NOW()'),
        comment='수정 일시'
    )


class Entities(Base):
    __tablename__ = 'entities'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='entities_pkey'),
        {'comment': '엔티티 (실제 데이터)', 'schema': 'app'}
    )

    id: Mapped[int] = mapped_column(
        Integer,
        Identity(always=True, start=1, increment=1, minvalue=1, maxvalue=2147483647, cycle=False, cache=1),
        primary_key=True,
        comment='엔티티 ID'
    )
    group_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey('app.groups.id'),
        comment='그룹 ID'
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, comment='엔티티명')
    custom_fields: Mapped[dict] = mapped_column(
        JSONB,
        server_default=text("'{}'::jsonb"),
        comment='커스텀 필드 데이터'
    )
    create_date: Mapped[datetime.datetime] = mapped_column(
        DateTime,
        server_default=text('NOW()'),
        comment='생성 일시'
    )
    update_date: Mapped[datetime.datetime] = mapped_column(
        DateTime,
        server_default=text('NOW()'),
        comment='수정 일시'
    )

