from django.core.management.base import BaseCommand
from content.drive_service import sync_file_to_db

class Command(BaseCommand):
    help = 'Sincroniza las secciones desde Google Drive.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Iniciando sincronización con Google Drive...'))
        
        DRIVE_FILES = {
            'INICIO': '11A3lbnu6BhU8-fnrEnkm9Btq2gKk6F6q',
            'MARCA': '1jwz_-W-AyWyR-pP8AW4UMOyoZaITxUVo',
            'SERVICIOS': '1U4u-Me81gPgMAuLfIS30RdJE6IrYgLtN',
        }

        for section_key, file_id in DRIVE_FILES.items():
            if 'ID_DE_' in file_id:
                continue

            try:
                sync_file_to_db(file_id, section_key)
                self.stdout.write(self.style.SUCCESS(f'✅ Sección "{section_key}" sincronizada.'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'❌ Error al sincronizar "{section_key}": {str(e)}'))

        self.stdout.write(self.style.SUCCESS('Sincronización finalizada.'))