from django.core.management.base import BaseCommand
from django.db import transaction
import requests, json
from ...models import Backlog, Session
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Process backlog entries and retry posting to an endpoint'

    def handle(self, *args, **options):
        try:
            all_entries = Backlog.objects.all()
            for entry in all_entries:
                user_id = entry.userID
                session = Session.objects.filter(userID=user_id).first()
                if session:
                    authToken = session.token
                    apiUrl = "http://127.0.0.1:8000/notes/"
                    headers = {'Content-type': 'application/json', 'basicAuth': authToken}
                    data = {
                        'url': entry.url,
                        'noteContent': entry.note,
                        'groups': entry.groups["groups"]
                    }
                    response = requests.post(apiUrl, json=data, headers=headers)
                   
                    if json.loads(response.content)["status"]["code"] == 200:
                        Backlog.objects.get(note=entry.note).delete()

        except Exception as e:
            logger.error(f"Error occurred while sending POST request: {e}")
