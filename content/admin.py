from django.contrib import admin
from .models import ManagedContent

@admin.register(ManagedContent)
class ManagedContentAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'status', 'approved_by', 'created_at')
    list_filter = ('status', 'category')
    search_fields = ('title', 'body_text', 'drive_file_id')
    readonly_fields = ('created_at', 'updated_at')

    # Configuración para facilitar la aprobación humana desde el panel de Django
    actions = ['approve_selected_content']

    @admin.action(description='Aprobar contenido seleccionado')
    def approve_selected_content(self, request, queryset):
        queryset.update(status='APPROVED', approved_by=request.user)