from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView

from .views import (
    EmailVerificationView,
    LoginView,
    LogoutView,
    OAuthLoginView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    RegisterView,
)

app_name = 'authentications'

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('oauth/', OAuthLoginView.as_view(), name='oauth'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token-verify'),
    path('email/verify/', EmailVerificationView.as_view(), name='email-verify'),
    path('password/reset/', PasswordResetRequestView.as_view(), name='password-reset'),
    path('password/reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
]