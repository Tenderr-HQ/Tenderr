from django.contrib.auth.models import BaseUserManager
from django.db import models


class UserQuerySet(models.QuerySet):
    def active(self):
        return self.filter(is_active=True)

    def public(self):
        return self.active().filter(is_profile_private=False)

    def searchable(self):
        return self.public()


class UserManager(BaseUserManager):
    use_in_migrations = True

    def get_queryset(self):
        return UserQuerySet(self.model, using=self._db)

    def _create_user(self, email, username, password, **extra):
        if not email:
            raise ValueError('Email is required.')
        if not username:
            raise ValueError('Username is required.')
        email = self.normalize_email(email).lower().strip()
        user = self.model(email=email, username=username.strip(), **extra)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_user(self, email, username, password=None, **extra):
        extra.setdefault('is_staff', False)
        extra.setdefault('is_superuser', False)
        return self._create_user(email, username, password, **extra)

    def create_superuser(self, email, username, password=None, **extra):
        extra.setdefault('is_staff', True)
        extra.setdefault('is_superuser', True)
        extra.setdefault('is_active', True)
        if extra.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        return self._create_user(email, username, password, **extra)

    def get_by_natural_key(self, username):
        return self.get(email__iexact=username)

    def public_by_username(self, username: str):
        return self.get_queryset().public().filter(username__iexact=username).first()