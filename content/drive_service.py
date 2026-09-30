import json
import os
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from .models import ContentSection

SCOPES = ['https://www.googleapis.com/auth/drive.readonly']
CREDENTIALS_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'credentials.json')

def get_drive_service():
    creds = Credentials.from_service_account_file(CREDENTIALS_FILE, scopes=SCOPES)
    return build('drive', 'v3', credentials=creds)

def sync_file_to_db(file_id, section_key):
    service = get_drive_service()
    request = service.files().get_media(fileId=file_id)
    file_content = request.execute().decode('utf-8')
    payload = json.loads(file_content)

    section, created = ContentSection.objects.update_or_create(
        section_key=section_key,
        defaults={
            'content_payload': payload,
            'status': 'PENDIENTE'
        }
    )
    return section