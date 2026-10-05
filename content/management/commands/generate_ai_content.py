import os
from django.core.management.base import BaseCommand
from google import genai
from content.models import ManagedContent, ContentStatus, ContentCategory

class Command(BaseCommand):
    help = 'Genera propuestas de contenido con IA en estado PENDING para revisión humana'

    def add_arguments(self, parser):
        parser.add_argument('--tema', type=str, help='Tema central sobre el cual generar contenido', default='Soluciones de Innovación Tecnológica')

    def handle(self, *args, **options):
        tema = options['tema']
        api_key = os.getenv("GEMINI_API_KEY")

        if not api_key:
            self.stderr.write("Error: Falta la variable GEMINI_API_KEY en el entorno.")
            return

        self.stdout.write(f"Generando propuestas de contenido con IA sobre: '{tema}'...")

        client = genai.Client(api_key=api_key)

        prompt = f"""
        Actúa como el Cerebro Digital de la marca. 
        Genera una propuesta de artículo o post para redes sobre el tema: '{tema}'.
        
        Lineamientos de tono y marca:
        - Tono: Profesional, tecnológico, firme y amigable.
        - Estructura deseada: 
          1. Título atractivo.
          2. Resumen ejecutable.
          3. Copy para redes sociales con hashtags.

        Responde en formato JSON simple con las llaves: "titulo", "cuerpo".
        """

        try:
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
            )
            
            # Guardar obligatoriamente en estado PENDING o DRAFT
            nuevo_contenido = ManagedContent.objects.create(
                title=f"Propuesta IA: {tema}",
                slug=f"propuesta-ia-{tema.lower().replace(' ', '-')}",
                category=ContentCategory.BLOG,
                status=ContentStatus.PENDING,  # REGLA NO NEGOCIABLE: Pendiente de aprobación humana
                body_text=response.text
            )

            self.stdout.write(self.style.SUCCESS(f" [ÉXITO] Contenido generado y guardado como PENDING (ID: {nuevo_contenido.id})"))

        except Exception as e:
            self.stderr.write(f"Error al conectar con la IA: {str(e)}")