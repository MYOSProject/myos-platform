import os
import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from google import genai
from .models import ManagedContent, ContentStatus, ContentCategory

class GenerateAIContentView(APIView):
    """Genera una propuesta con la IA y la guarda como PENDING en la BD"""
    def post(self, request):
        brief = request.data.get('brief', '')
        if not brief:
            return Response({'error': 'El brief o instrucción es obligatorio.'}, status=status.HTTP_400_BAD_REQUEST)

        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return Response({'error': 'Falta GEMINI_API_KEY en el servidor.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            client = genai.Client(api_key=api_key)
            prompt = f"""
            Eres el Cerebro Digital de la marca. Genera una propuesta para: "{brief}"
            Responde ÚNICAMENTE con un JSON válido con estas llaves:
            - "titulo": Título sugerido
            - "resumen_web": Texto para la página web
            - "copy_redes": Copy para redes sociales con hashtags y CTA
            - "prompt_imagen": Descripción detallada para generar la imagen o arte
            """

            # Lista de modelos a probar en caso de saturación (503)
            modelos_disponibles = ['gemini-2.5-flash', 'gemini-2.5-pro']
            response = None
            ultimo_error = None

            for modelo in modelos_disponibles:
                try:
                    response = client.models.generate_content(
                        model=modelo,
                        contents=prompt
                    )
                    if response and response.text:
                        break
                except Exception as err:
                    ultimo_error = err
                    continue

            if not response:
                raise ultimo_error or Exception("No se pudo conectar con ningún modelo disponible.")

            cleaned_text = response.text.strip().replace('```json', '').replace('```', '')

            # Se crea el registro en estado PENDING (Human-in-the-loop)
            nuevo_contenido = ManagedContent.objects.create(
                title=f"Propuesta: {brief[:30]}",
                slug=f"propuesta-{ManagedContent.objects.count() + 1}",
                category=ContentCategory.SOCIAL,
                status=ContentStatus.PENDING,
                body_text=cleaned_text
            )

            return Response({
                'id': nuevo_contenido.id,
                'status': nuevo_contenido.status,
                'content': json.loads(cleaned_text)
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': f'Servidor saturado temporalmente: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ApproveContentView(APIView):
    """Cambia el estado de un contenido de PENDING a APPROVED"""
    def post(self, request, pk):
        try:
            item = ManagedContent.objects.get(pk=pk)
            item.status = ContentStatus.APPROVED
            item.save()
            return Response({'message': 'Contenido aprobado con éxito.', 'status': item.status})
        except ManagedContent.DoesNotExist:
            return Response({'error': 'Contenido no encontrado.'}, status=status.HTTP_404_NOT_FOUND)