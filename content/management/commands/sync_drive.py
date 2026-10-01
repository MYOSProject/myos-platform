import os
from django.core.management.base import BaseCommand
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from content.models import ManagedContent, ContentStatus, ContentCategory

class Command(BaseCommand):
    help = 'Sincroniza archivos desde Google Drive hacia ManagedContent en estado PENDING'

    def handle(self, *args, **kwargs):
        self.stdout.write("Iniciando sincronización con Google Drive...")

        # 1. Cargar credenciales desde credentials.json
        creds_path = os.path.join(os.path.dirname(__file__), '../../../credentials.json')
        if not os.path.exists(creds_path):
            self.stderr.write("Error: No se encontró el archivo credentials.json")
            return

        scopes = ['https://www.googleapis.com/auth/drive.readonly']
        creds = Credentials.from_service_account_file(creds_path, scopes=scopes)
        service = build('drive', 'v3', credentials=creds)

        # 2. Consultar archivos en Drive
        results = service.files().list(
            pageSize=20, 
            fields="nextPageToken, files(id, name, mimeType)"
        ).execute()
        items = results.get('files', [])

        if not items:
            self.stdout.write("No se encontraron archivos en Google Drive.")
            return

        for item in items:
            # Omite carpetas estructurales de Drive
            if item.get('mimeType') == 'application/vnd.google-apps.folder':
                continue

            # Creamos o actualizamos sin sobreescribir el estado de aprobación
            content, created = ManagedContent.objects.get_or_create(
                drive_file_id=item['id'],
                defaults={
                    'title': item['name'],
                    'slug': item['name'].lower().replace(' ', '-').replace('.', '-'),
                    'category': ContentCategory.BLOG,
                    'status': ContentStatus.PENDING,  # REGLA NO NEGOCIABLE: Entra como pendiente
                    'body_text': f"Contenido importado desde Drive (ID: {item['id']})"
                }
            )

            if created:
                self.stdout.write(self.style.SUCCESS(f" [NUEVO] Guardado como pendiente: {item['name']}"))
            else:
                self.stdout.write(f" [EXISTENTE] Se omite reescritura de {item['name']}")