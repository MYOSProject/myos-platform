from django.db import models
from django.contrib.auth.models import User

class ContentStatus(models.TextChoices):
    DRAFT = 'DRAFT', 'Borrador IA'
    PENDING = 'PENDING', 'Pendiente de Aprobación'
    APPROVED = 'APPROVED', 'Aprobado'
    PUBLISHED = 'PUBLISHED', 'Publicado'

class ContentCategory(models.TextChoices):
    PAGINA = 'PAGINA', 'Página Web (Sección)'
    BLOG = 'BLOG', 'Entrada de Blog'
    REDES = 'REDES', 'Redes Sociales'

class ManagedContent(models.Model):
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    category = models.CharField(max_length=20, choices=ContentCategory.choices, default=ContentCategory.BLOG)
    
    # Contenido traído de Google Drive
    body_text = models.TextField(blank=True, null=True)
    media_url = models.URLField(blank=True, null=True)
    drive_file_id = models.CharField(max_length=255, unique=True, help_text="ID original del archivo en Google Drive")
    
    # Flujo de aprobación obligatorio (Regla No Negociable)
    status = models.CharField(
        max_length=20, 
        choices=ContentStatus.choices, 
        default=ContentStatus.PENDING
    )
    
    # Registro de auditoría humana
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_contents')
    approved_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} [{self.get_status_display()}]"