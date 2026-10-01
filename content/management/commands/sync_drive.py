import os
import io
from django.core.management.base import BaseCommand
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from content.models import ManagedContent, ContentStatus, ContentCategory

class Command(BaseCommand):
    help = 'Sincroniza archivos y contenido real desde Google Drive hacia ManagedContent'

    def handle(self, *args, **kwargs):
        self.stdout.write("Iniciando sincronización con Google Drive...")

        creds_path = os.path.join(os.path.dirname(__file__), '../../../credentials.json')
        if not os.path.exists(creds_path):
            self.stderr.write("Error: No se encontró el archivo credentials.json")
            return

        scopes = ['https://www.googleapis.com/auth/drive.readonly']
        creds = Credentials.from_service_account_file(creds_path, scopes=scopes)
        service = build('drive', 'v3', credentials=creds)

        results = service.files().list(
            pageSize=20, 
            fields="nextPageToken, files(id, name, mimeType)"
        ).execute()
        items = results.get('files', [])

        if not items:
            self.stdout.write("No se encontraron archivos en Google Drive.")
            return

        for item in items:
            # Omite carpetas de Drive
            if item.get('mimeType') == 'application/vnd.google-apps.folder':
                continue

            file_id = item['id']
            file_name = item['name']

            # Descargar el contenido real del archivo desde Drive
            body_content = ""
            try:
                request = service.files().get_media(fileId=file_id)
                fh = io.BytesIO()
                downloader = MediaIoBaseDownload(fh, request)
                done = False
                while not done:
                    status, done = downloader.next_chunk()
                body_content = fh.getvalue().decode('utf-8')
            except Exception as e:
                body_content = f"Error al leer contenido: {str(e)}"

            content, created = ManagedContent.objects.get_or_create(
                drive_file_id=file_id,
                defaults={
                    'title': file_name,
                    'slug': file_name.lower().replace(' ', '-').replace('.', '-'),
                    'category': ContentCategory.BLOG,
                    'status': ContentStatus.PENDING,
                    'body_text': body_content
                }
            )

            if not created:
                # Si el archivo ya existía, actualizamos el contenido interno sin tocar el estado de aprobación
                content.body_text = body_content
                content.save()
                self.stdout.write(f" [ACTUALIZADO] Contenido refrescado para: {file_name}")
            else:
                self.stdout.write(self.style.SUCCESS(f" [NUEVO] Guardado como pendiente: {file_name}"))