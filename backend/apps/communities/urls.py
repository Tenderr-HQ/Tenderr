"""
URL map for the communities app.

Mounted at /api/communities/ in config/urls.py.
"""
from django.urls import path

from .views import (
    CommunityDetailView,
    CommunityListView,
    CommunityPostCreateView,
    CommunityPostDeleteView,
    CommunityPostListView,
    DiscussionCloseView,
    DiscussionCreateView,
    DiscussionDetailView,
    DiscussionListView,
    DiscussionMessageCreateView,
    DiscussionMessageListView,
    JoinCommunityView,
    LeaveCommunityView,
    MyMembershipsView,
)

app_name = 'communities'

urlpatterns = [
    # Community list & detail
    path('', CommunityListView.as_view(), name='list'),
    path('<slug:slug>/', CommunityDetailView.as_view(), name='detail'),

    # Membership
    path('<slug:slug>/join/', JoinCommunityView.as_view(), name='join'),
    path('<slug:slug>/leave/', LeaveCommunityView.as_view(), name='leave'),
    path('me/', MyMembershipsView.as_view(), name='my-memberships'),

    # Community posts
    path('<slug:slug>/posts/', CommunityPostListView.as_view(), name='posts'),
    path('<slug:slug>/posts/create/', CommunityPostCreateView.as_view(), name='post-create'),
    path('<slug:slug>/posts/<uuid:post_id>/delete/', CommunityPostDeleteView.as_view(), name='post-delete'),

    # Discussions
    path('<slug:slug>/discussions/', DiscussionListView.as_view(), name='discussions'),
    path('<slug:slug>/discussions/create/', DiscussionCreateView.as_view(), name='discussion-create'),
    path('discussions/<uuid:pk>/', DiscussionDetailView.as_view(), name='discussion-detail'),
    path('discussions/<uuid:pk>/close/', DiscussionCloseView.as_view(), name='discussion-close'),
    path('discussions/<uuid:pk>/messages/', DiscussionMessageListView.as_view(), name='discussion-messages'),
    path('discussions/<uuid:pk>/messages/create/', DiscussionMessageCreateView.as_view(), name='discussion-message-create'),
]