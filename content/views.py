from rest_framework import generics
from .models import ManagedContent, ContentStatus
from .serializers import ManagedContentSerializer

class PublicContentViewSet(generics.ListAPIView):
    serializer_class = ManagedContentSerializer

    def get_queryset(self):
        return ManagedContent.objects.filter(
            status__in=[ContentStatus.APPROVED, ContentStatus.PUBLISHED]
        ).order_by('-created_at')