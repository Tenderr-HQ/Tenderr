from django.urls import path

from .views import (
    AvatarHistoryView,
    AvatarUploadView,
    BlockedListView,
    BlockToggleView,
    ChangeUsernameView,
    CompanionCancelView,
    CompanionRequestView,
    CompanionRespondView,
    DeactivateAccountView,
    MeView,
    MyCompanionsView,
    MyPendingCompanionRequestsView,
    MyStandWithListView,
    PublicProfileView,
    SessionsListView,
    StandWithToggleView,
    UserSearchView,
)

app_name = 'accounts'

urlpatterns = [
    # Self
    path('me/', MeView.as_view(), name='me'),
    path('me/username/', ChangeUsernameView.as_view(), name='change-username'),
    path('me/avatar/', AvatarUploadView.as_view(), name='avatar-upload'),
    path('me/avatar/history/', AvatarHistoryView.as_view(), name='avatar-history'),
    path('me/deactivate/', DeactivateAccountView.as_view(), name='deactivate'),
    path('me/sessions/', SessionsListView.as_view(), name='sessions'),
    path('me/stand-with/', MyStandWithListView.as_view(), name='my-stand-with'),
    path('me/companions/', MyCompanionsView.as_view(), name='my-companions'),
    path('me/companions/pending/', MyPendingCompanionRequestsView.as_view(), name='my-pending-companions'),

    # Search
    path('search/', UserSearchView.as_view(), name='search'),

    # Public
    path('profile/<str:username>/', PublicProfileView.as_view(), name='profile'),

    # Stand With
    path('<str:username>/stand-with/', StandWithToggleView.as_view(), name='stand-with'),

    # Companion
    path('companions/<int:pk>/<str:action>/', CompanionRespondView.as_view(), name='companion-respond'),
    path('companions/<int:pk>/cancel/', CompanionCancelView.as_view(), name='companion-cancel'),

    # Block
    path('<str:username>/block/', BlockToggleView.as_view(), name='block-toggle'),
    path('blocks/', BlockedListView.as_view(), name='blocked-list'),
]