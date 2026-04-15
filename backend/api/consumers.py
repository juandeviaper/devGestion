import json
from channels.generic.websocket import AsyncWebsocketConsumer

class WorkItemConsumer(AsyncWebsocketConsumer):
    """
    Consumer para manejar actualizaciones en tiempo real de Historias, Tareas y Bugs.
    """
    async def connect(self):
        self.project_id = self.scope['url_route']['kwargs']['project_id']
        self.room_group_name = f'project_{self.project_id}'

        # Unirse al grupo del proyecto
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Salir del grupo
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Recibir mensaje de WebSocket
    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data['message']
        type = data.get('type', 'update')

        # Enviar mensaje al grupo
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'work_item_message',
                'message': message,
                'sender': self.scope['user'].username if self.scope['user'].is_authenticated else 'Anónimo'
            }
        )

    # Recibir mensaje del grupo
    async def work_item_message(self, event):
        message = event['message']
        sender = event.get('sender', 'Sistema')

        # Enviar mensaje al WebSocket
        await self.send(text_data=json.dumps({
            'message': message,
            'sender': sender
        }))
