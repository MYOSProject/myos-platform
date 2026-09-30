from rest_framework import generics
from .models import ContentSection, SocialPost
from .serializers import ContentSectionSerializer, SocialPostSerializer

class ApprovedContentListView(generics.ListAPIView):
    serializer_class = ContentSectionSerializer

    def get_queryset(self):
        # Cumple la regla de seguridad: solo expone contenido en estado APROBADO o PUBLICADO
        return ContentSection.objects.filter(status__in=['APROBADO', 'PUBLICADO'])

class ApprovedSocialPostListView(generics.ListAPIView):
    serializer_class = SocialPostSerializer

    def get_queryset(self):
        return SocialPost.objects.filter(status__in=['APROBADO', 'PUBLICADO'])