"""
URL map for the posts app.

Each entry connects a URL pattern to a View class. The
`app_name` namespace lets reverse lookups happen in templates
and tests (`reverse('posts:feed')`).
"""
from django.urls import path

from .views import (
    CommentCreateView,
    CommentListView,
    CommentRepliesView,
    FeedListView,
    LetterInboxView,
    LetterMarkReadView,
    LetterSendView,
    MyPostsView,
    PostCreateView,
    PostDetailView,
    ReactionToggleView,
)

app_name = 'posts'

urlpatterns = [
    # Feed
    path('', FeedListView.as_view(), name='feed'),
    path('mine/', MyPostsView.as_view(), name='my-posts'),

    # Post CRUD
    path('create/', PostCreateView.as_view(), name='post-create'),
    path('<uuid:pk>/', PostDetailView.as_view(), name='post-detail'),

    # Comments
    path('<uuid:post_id>/comments/', CommentListView.as_view(), name='comments'),
    path('<uuid:post_id>/comments/create/', CommentCreateView.as_view(), name='comment-create'),
    path('comments/<uuid:comment_id>/replies/', CommentRepliesView.as_view(), name='comment-replies'),

    # Reactions
    path('<uuid:post_id>/react/', ReactionToggleView.as_view(), name='reaction-toggle'),

    # Letters
    path('<uuid:post_id>/letters/', LetterSendView.as_view(), name='letter-send'),
    path('letters/inbox/', LetterInboxView.as_view(), name='letter-inbox'),
    path('letters/<uuid:letter_id>/read/', LetterMarkReadView.as_view(), name='letter-read'),
]