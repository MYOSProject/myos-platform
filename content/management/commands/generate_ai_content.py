import os
import json
from django.core.management.base import BaseCommand
from google import genai
from content.models import ManagedContent, ContentStatus, ContentCategory

class Command(BaseCommand):
    help = 'Genera sugerencias completas (copy, hashtags, imagen, web) en estado PENDING a partir de una idea o brief.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--brief', 
            type=str, 
            help='Idea, tema o brief para el contenido', 
            default='Promoción de nuestros servicios de software para PyMEs'
        )

    def handle(self, *args, **options):
        brief = options['brief']
        api_key = os.getenv("GEMINI_API_KEY")

        if not api_key:
            self.stderr.write("Error: Falta la variable GEMINI_API_KEY en el entorno.")
            return

        self.stdout.write(f"\n🧠 Cerebro Digital procesando el brief: '{brief}'...\n")

        client = genai.Client(api_key=api_key)

        prompt_sistema = f"""
        Eres el Cerebro Digital de la marca. A partir del siguiente brief:
        "{brief}"

        Genera una propuesta integral formateada estrictamente como un objeto JSON con las siguientes llaves:
        
        1. "titulo": Un título corto y atractivo para el sitio web / blog.
        2. "copy_redes": Publicación para Instagram y Facebook con gancho, desarrollo, hashtags y Call To Action (CTA).
        3. "prompt_imagen": Descripción detallada e instrucciones en inglés/español para generar la imagen/arte publicitario (para DALL-E, Midjourney o diseñador).
        4. "resumen_web": Un texto de 2 párrafos enfocado en conversión para la landing page.

        Responde ÚNICAMENTE con el objeto JSON válido.
        """

        try:
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt_sistema,
            )
            
            # Limpieza del texto por si la IA incluye markdown ```json
            cleaned_text = response.text.strip().replace('```json', '').replace('```', '')

            # Guardar el paquete completo de sugerencias en la BD bajo estado PENDING
            nuevo_contenido = ManagedContent.objects.create(
                title=f"Sugerencia IA: {brief[:40]}...",
                slug=f"sugerencia-ia-{hash(brief) % 10000}",
                category=ContentCategory.SOCIAL,
                status=ContentStatus.PENDING,  # APROBACIÓN HUMANA OBLIGATORIA
                body_text=cleaned_text
            )

            self.stdout.write(self.style.SUCCESS(f"✅ Propuesta generada con éxito."))
            self.stdout.write(f"📌 Guardada en Base de Datos como PENDING (ID: {nuevo_contenido.id})\n")
            self.stdout.write("--- CONTENIDO GENERADO (PENDIENTE DE APROBACIÓN) ---")
            self.stdout.write(cleaned_text)

        except Exception as e:
            self.stderr.write(f"❌ Error conectando con Gemini: {str(e)}")