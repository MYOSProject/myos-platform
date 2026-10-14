# MYOS / Merkatics — arquitectura inicial del MVP

## Decisión de alcance

El MVP se construye para un solo sitio piloto. Se conserva temporalmente React + Vite + Express + Gemini para avanzar sobre el repositorio existente, pero se mantiene una frontera clara para poder migrar la API a Django si Carlos o el mentor confirma que es obligatorio. Esta decisión provisional no sustituye esa confirmación.

## Componentes

- **Frontend:** React, interfaz clara, panel de propuestas, revisión y aprobación.
- **API actual (provisional):** Express en `server.ts`; lógica de contenido y endpoints. La persistencia actual en memoria es solo de prototipo y se pierde al reiniciar.
- **IA:** Gemini genera propuestas; todo resultado nuevo empieza como `PENDING`.
- **CMS objetivo:** Google Drive, con carpetas `/Marca`, `/Sitio_Web/Paginas`, `/Sitio_Web/Blog`, `/Redes_Sociales/Para_Publicar`, `/Redes_Sociales/Publicado` y `/Calendario`. La exploración actual de Drive es una maqueta, no una integración real.
- **Sitio piloto:** publicar/desplegar solo contenido aprobado. La estrategia SSR/SSG y el alojamiento del backend quedan por confirmar antes de cerrar el diseño de despliegue.
- **Redes:** Make/Zapier → Meta se integra al final y solo recibe solicitudes después de una aprobación comprobada.

## Regla de aprobación no negociable

Estados previstos: `DRAFT → PENDING → APPROVED → PUBLISHED`. Una propuesta también puede rechazarse y volver a borrador mediante una acción explícita. Nunca se salta directamente de borrador/pendiente a publicado.

Toda aprobación debe tener:
- identidad del aprobador autenticado (nombre y correo),
- fecha/hora de aprobación,
- contenido/version aprobada,
- evento de auditoría.

No se permite aprobar sin identidad, ni volver a aprobar un registro que no esté pendiente. La interfaz no debe simular una aprobación si la API falla. En el prototipo actual, el endpoint todavía no verifica una credencial de identidad en servidor; por tanto, la identidad enviada desde el navegador no es una garantía de seguridad de producción. Antes de un piloto real se requiere verificación de token/sesión en el backend y persistencia durable (base de datos).

## Orden de trabajo

1. Establecer estados y reglas de aprobación/auditoría.
2. Conectar el flujo de revisión de la interfaz a la API y eliminar identidades por defecto.
3. Definir el esquema persistente y autenticación del aprobador.
4. Conectar Google Drive real para un sitio piloto.
5. Generar contenido con IA y mantenerlo pendiente.
6. Desplegar sitio aprobado; después integrar Make/Zapier y Meta con pruebas controladas.

## Integraciones aún no configuradas

No hay credenciales ni configuración confirmada para Google Drive, Meta Graph API, Make/Zapier o un backend Django. No se deben incluir secretos en el repositorio.
