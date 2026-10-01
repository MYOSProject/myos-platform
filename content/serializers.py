from rest_framework import serializers
from .models import ManagedContent

class ManagedContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ManagedContent
        fields = '__all__'