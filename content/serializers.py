from rest_framework import serializers
from .models import ContentSection, SocialPost

class ContentSectionSerializer(serializers.ModelSerializer):
    approved_by_username = serializers.ReadOnlyField(source='approved_by.username')

    class Meta:
        model = ContentSection
        fields = ['id', 'section_key', 'content_payload', 'status', 'approved_by', 'approved_by_username', 'updated_at']

class SocialPostSerializer(serializers.ModelSerializer):
    approved_by_username = serializers.ReadOnlyField(source='approved_by.username')

    class Meta:
        model = SocialPost
        fields = ['id', 'platform', 'copy_text', 'media_url', 'scheduled_for', 'status', 'approved_by', 'approved_by_username', 'created_at']