from django.contrib import admin
from .models import *

admin.site.register(User)
admin.site.register(Group)
admin.site.register(UserGroupRelation)
admin.site.register(URL)
admin.site.register(Note)
admin.site.register(Session)
admin.site.register(NoteGroupRelation)
admin.site.register(Domain)
admin.site.register(DomainConfiguration)
admin.site.register(Backlog)