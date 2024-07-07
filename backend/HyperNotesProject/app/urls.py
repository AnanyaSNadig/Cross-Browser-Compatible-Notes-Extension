from django.urls import path
from .views import Session, Notes, User


urlpatterns = [
    path("session/", Session.SessionView.as_view(), name="session"),
    path("notes/", Notes.NotesView.as_view(), name="notes"),
    path("user/", User.UserView.as_view(), name="user"),
]


