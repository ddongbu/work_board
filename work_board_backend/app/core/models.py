import datetime
from sqlalchemy import (
    PrimaryKeyConstraint, UniqueConstraint, ForeignKey,
    Integer, Identity, DateTime, String, Boolean, Text, text
)
from sqlalchemy.orm import DeclarativeBase, mapped_column, Mapped
from typing import Optional




class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = 'user'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='user_pkey'),
        UniqueConstraint('email', name='user_email_key'),
        {'schema': 'app'}
    )

    id: Mapped[int] = mapped_column(
        Integer,
        Identity(always=True, start=1, increment=1),
        primary_key=True,
    )
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    nickname: Mapped[str] = mapped_column(String(50), nullable=False)
    profile_image_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=text('NOW()')
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=text('NOW()'), onupdate=datetime.datetime.utcnow
    )


class UserPassword(Base):
    __tablename__ = 'user_pw'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='user_pw_pkey'),
        {'schema': 'app'}
    )

    id: Mapped[int] = mapped_column(
        Integer,
        Identity(always=True, start=1, increment=1),
        primary_key=True,
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey('app.user.id'), nullable=False
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(
        Boolean, server_default=text('true'), nullable=False
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=text('NOW()')
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=text('NOW()'), onupdate=datetime.datetime.utcnow
    )


class Post(Base):
    __tablename__ = 'post'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='post_pkey'),
        {'schema': 'app'}
    )

    id: Mapped[int] = mapped_column(
        Integer,
        Identity(always=True, start=1, increment=1),
        primary_key=True,
    )
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey('app.user.id', ondelete='CASCADE'), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    thumbnail_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    is_published: Mapped[bool] = mapped_column(
        Boolean, server_default=text('true'), nullable=False
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=text('NOW()')
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=text('NOW()')
    )


class PostLike(Base):
    __tablename__ = 'post_like'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='post_like_pkey'),
        UniqueConstraint('post_id', 'user_id', name='post_like_post_user_key'),
        {'schema': 'app'}
    )

    id: Mapped[int] = mapped_column(
        Integer, Identity(always=True, start=1, increment=1), primary_key=True
    )
    post_id: Mapped[int] = mapped_column(
        Integer, ForeignKey('app.post.id', ondelete='CASCADE'), nullable=False
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey('app.user.id', ondelete='CASCADE'), nullable=False
    )
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=text('NOW()')
    )


class Comment(Base):
    __tablename__ = 'comment'
    __table_args__ = (
        PrimaryKeyConstraint('id', name='comment_pkey'),
        {'schema': 'app'}
    )

    id: Mapped[int] = mapped_column(
        Integer, Identity(always=True, start=1, increment=1), primary_key=True
    )
    post_id: Mapped[int] = mapped_column(
        Integer, ForeignKey('app.post.id', ondelete='CASCADE'), nullable=False
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey('app.user.id', ondelete='CASCADE'), nullable=False
    )
    parent_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey('app.comment.id', ondelete='CASCADE'), nullable=True
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=text('NOW()')
    )
    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=text('NOW()'), onupdate=datetime.datetime.utcnow
    )
