from django.urls import path
from .views import ApprovedContentListView, ApprovedSocialPostListView

urlpatterns = [
    path('content/', ApprovedContentListView.as_view(), name='approved-content'),
    path('social-posts/', ApprovedSocialPostListView.as_view(), name='approved-social-posts'),
]