from django.db import models
import secrets, datetime
from django.contrib.auth.hashers import make_password

class User(models.Model):
    userID = models.AutoField(primary_key=True)
    emailID = models.EmailField(max_length=255, unique=True)
    password = models.CharField(max_length=255)
    status = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        self.password = make_password(self.password)
        super().save(*args, **kwargs)

class Group(models.Model):
    groupID = models.AutoField(primary_key=True)
    groupName = models.CharField(max_length=255)

class UserGroupRelation(models.Model):
    userID = models.ForeignKey(User, on_delete=models.CASCADE)
    groupID = models.ForeignKey(Group, on_delete=models.CASCADE)

class URL(models.Model):
    urlID = models.AutoField(primary_key=True)
    url = models.URLField(max_length=400)

class Note(models.Model):
    urlID = models.ForeignKey(URL, on_delete = models.CASCADE)
    noteID = models.AutoField(primary_key=True)
    note = models.TextField()
    createdBy = models.PositiveIntegerField()
    createdAt = models.DateTimeField()

class Session(models.Model):
    userID = models.PositiveBigIntegerField()
    token = models.CharField(max_length = 255)
    expiresAt = models.DateTimeField()

    def save(self, *args, **kwargs):
        self.token = secrets.token_urlsafe()
        self.expiresAt = datetime.datetime.now() + datetime.timedelta(hours=720)
        super(Session, self).save(*args, **kwargs)

class NoteGroupRelation(models.Model):
    noteID = models.ForeignKey(Note,on_delete=models.CASCADE)
    groupID = models.ForeignKey(Group,on_delete = models.CASCADE)

class Domain(models.Model):
    domainID = models.AutoField(primary_key=True)
    domainName = models.CharField(max_length = 255)
    status = models.CharField(max_length = 20)

class DomainConfiguration(models.Model):
    configurationID = models.AutoField(primary_key=True)
    domainID = models.PositiveIntegerField()
    path = models.CharField(max_length = 255)
    keys = models.JSONField()

class Backlog(models.Model):
    userID = models.PositiveBigIntegerField()
    url = models.URLField(max_length=400)
    note = models.TextField()
    groups = models.JSONField()
