from django.urls import path
from .views import PublicContentViewSet

urlpatterns = [
    path('content/', PublicContentViewSet.as_view(), name='public-content'),
]