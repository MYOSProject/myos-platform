from django.db import models
from django.contrib.auth.models import User

class ContentSection(models.Model):
    STATUS_CHOICES = [
        ('BORRADOR_IA', 'Borrador IA'),
        ('PENDIENTE', 'Pendiente de Aprobación'),
        ('APROBADO', 'Aprobado'),
        ('PUBLICADO', 'Publicado'),
    ]

    section_key = models.CharField(max_length=100, unique=True) # ej: MARCA, INICIO, SERVICIOS, BLOG
    content_payload = models.JSONField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDIENTE')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_sections')
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.section_key} [{self.status}]"


class SocialPost(models.Model):
    STATUS_CHOICES = [
        ('BORRADOR_IA', 'Borrador IA'),
        ('PENDIENTE', 'Pendiente de Aprobación'),
        ('APROBADO', 'Aprobado para Publicar'),
        ('PUBLICADO', 'Publicado en Meta'),
    ]

    platform = models.CharField(max_length=20, choices=[('FACEBOOK', 'Facebook'), ('INSTAGRAM', 'Instagram'), ('BOTH', 'Ambas')])
    copy_text = models.TextField()
    media_url = models.URLField(blank=True, null=True)
    scheduled_for = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDIENTE')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_posts')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Post {self.platform} - {self.status}"