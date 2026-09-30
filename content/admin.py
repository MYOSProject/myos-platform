from django.contrib import admin
from .models import ContentSection, SocialPost

@admin.register(ContentSection)
class ContentSectionAdmin(admin.ModelAdmin):
    list_display = ('section_key', 'status', 'approved_by', 'updated_at')
    list_editable = ('status',)
    search_fields = ('section_key',)

    def save_model(self, request, obj, form, change):
        if obj.status in ['APROBADO', 'PUBLICADO'] and not obj.approved_by:
            obj.approved_by = request.user
        super().save_model(request, obj, form, change)

@admin.register(SocialPost)
class SocialPostAdmin(admin.ModelAdmin):
    list_display = ('platform', 'status', 'scheduled_for', 'approved_by', 'created_at')
    list_editable = ('status',)

    def save_model(self, request, obj, form, change):
        if obj.status in ['APROBADO', 'PUBLICADO'] and not obj.approved_by:
            obj.approved_by = request.user
        super().save_model(request, obj, form, change)