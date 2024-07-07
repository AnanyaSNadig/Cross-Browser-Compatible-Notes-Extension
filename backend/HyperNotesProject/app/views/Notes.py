from django.shortcuts import render
from django.http import HttpResponse
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from ..models import *
from ..libraries import canonicalUrl
import datetime

class NotesView(APIView):   
    def get(self, request):
        authToken = request.headers.get('basicAuth')
        
        try:
            sessionDetails = Session.objects.get(token=authToken)
            userDetails = User.objects.get(userID=sessionDetails.userID)
            
            url = request.query_params.get('url')

            status, canonicalurl = canonicalUrl.CanonicalUrl(url).get()

            if status == 200:
                try:
                    urlDetails = URL.objects.get(url=canonicalurl)
                    userGroupIDs = UserGroupRelation.objects.filter(userID=userDetails).values_list('groupID', flat=True)

                    try:
                        allNotes = Note.objects.filter(urlID=urlDetails)

                        filteredNotes = []
                        for note in allNotes:
                            noteGroupIDs = NoteGroupRelation.objects.filter(noteID=note).values_list('groupID', flat=True)
                            noteGroupNames = []

                            for i in range(len(noteGroupIDs)):
                                name = Group.objects.get(groupID=noteGroupIDs[i]).groupName
                                noteGroupNames.append(name)

                            commonGroups = userGroupIDs.intersection(noteGroupIDs)

                            if note.createdBy == userDetails.userID:
                                authored = "true"
                            else:
                                authored = "false"

                            if commonGroups:
                                noteDetails = {
                                    "noteID" : note.noteID,
                                    "noteContent" : note.note,
                                    "authored" : authored,
                                    "createdAt" : note.createdAt,
                                    "noteGroups" : noteGroupNames
                                }

                                filteredNotes.append(noteDetails)

                        sordtedNoteList = sorted(filteredNotes, key=lambda x: x['createdAt'], reverse=True)

                        responseBody = {"status": {"code":200, "message": "Retrieved the notes successfully"}, "data":{"notes": sordtedNoteList}, "event": "NOTES_SUCCESS"}
                    except:
                        responseBody = {"status": {"code":404, "message":"Notes Not Found"}, "data":{"notes": None}, "event": "NOTES_ERROR"}
                except:
                    responseBody = {"status": {"code":404, "message":"URL Not Found"}, "data":{"notes": None}, "event": "NOTES_ERROR"}
            else:
                responseBody = {"status": {"code":404, "message": "The domain is either blocked or not found"}, "data":{"notes":None}, "event": "NOTES_ERROR"}
        except:
            responseBody = {"status": {"code": 403, "message": "Unauthorized"}, "data": {"notes" : None}, "event": "NOTES_ERROR"}
        
        response = Response(responseBody)
        response.headers['Accept'] = "application/json"

        return Response(responseBody)



    def delete(self, request):
        authToken = request.headers.get('basicAuth')

        try:
            Session.objects.get(token=authToken)

            noteID = request.query_params.get('noteID')

            try:
                Note.objects.get(noteID=noteID).delete()
                responseBody = {"status":{"code":200, "message":"Deleted the note successfully"}, "data": {"noteID" : noteID}, "event": "NOTE_DELETE_SUCCESS"}

            except:
                responseBody = {"status": {"code":404, "message":"Note Not Found"}, "data": {"noteID" : None}, "event": "NOTE_DELETE_ERROR"}

        except:
            responseBody = {"status": {"code": 403, "message": "Unauthorized"}, "data": {"noteID" : None}, "event": "NOTE_DELETE_ERROR"}
        
        response = Response(responseBody)
        response.headers['Accept'] = "application/json"

        return Response(responseBody)



    def post(self, request):
        authToken = request.headers.get('basicAuth')

        try:
            sessionDetails = Session.objects.get(token=authToken)

            url = request.data.get('url')
            noteContent = request.data.get('noteContent')
            groups = request.data.get('groups')

            status, canonicalurl = canonicalUrl.CanonicalUrl(url).get()

            if status == 403:
                responseBody = {"status":{"code":403, "message":"Domain is blocked"}, "data": {"noteID": None}, "event": "NOTE_ADD_ERROR"}


            if status == 404:
                if not Backlog.objects.filter(note=noteContent).exists():
                    groupInfo = {"groups": groups}

                    Backlog.objects.create(userID = sessionDetails.userID,
                            url    = url,
                            note   = noteContent,
                            groups = groupInfo
                            )
                    
                responseBody = {"status":{"code":202, "message":"Processing the request"}, "data": {"noteID": None}, "event": "NOTE_ADD_ERROR"}

            if status == 200:
                exists = URL.objects.filter(url=canonicalurl).exists()

                if exists:
                    urlDetails = URL.objects.get(url=canonicalurl)

                else:
                    urlDetails = URL.objects.create(url=canonicalurl)

                noteDetails = Note.objects.create(urlID=urlDetails, note=noteContent, createdBy=sessionDetails.userID, createdAt=datetime.datetime.now())

                for group in groups:
                    groupDetails = Group.objects.get(groupName=group)
                    NoteGroupRelation.objects.create(noteID=noteDetails, groupID=groupDetails)

            responseBody = {"status":{"code":200, "message":"Note has been created"}, "data": {"noteID": noteDetails.noteID}, "event": "NOTE_ADD_SUCCESS"}

        except:
            responseBody = {"status": {"code": 403, "message": "Unauthorized"}, "data": {"noteID": None}, "event": "NOTE_ADD_ERROR"}


        response = Response(responseBody)
        response.headers['Content-Type'] = "application/json"
        response.headers['Accept'] = "application/json"

        return Response(responseBody)
    


    def patch(self, request):
        authToken = request.headers.get('basicAuth')
   
        try:
            Session.objects.filter(token=authToken)

            note_id = request.data.get('noteID')
            newContent = request.data.get('newContent')
            newgroupNames = request.data.get('groups')

            try:
                Note.objects.filter(noteID=note_id).update(note=newContent, createdAt=datetime.datetime.now())

                noteDetails = Note.objects.get(noteID=note_id)

                if newgroupNames:
                    NoteGroupRelation.objects.filter(noteID=note_id).delete()
                    for group in newgroupNames:
                        groupDetails = Group.objects.get(groupName=group)
                        NoteGroupRelation.objects.create(noteID=noteDetails, groupID=groupDetails)
                
                responseBody = {"status": {"code": 200, "message": "Data modified successfully"}, "data": {"noteID": note_id},"event": "NOTE_MODIFY_SUCCESS"}

            except Note.DoesNotExist:
                responseBody = {"status": {"code": 404, "message": "Note not found"}, "data": {"noteID": None}, "event": "NOTE_MODIFY_ERROR"}
        except:
            responseBody = {"status": {"code": 403, "message": "Unauthorized"}, "data": {"noteID": None}, "event": "NOTE_MODIFY_ERROR"}

        
        response = Response(responseBody)
        response.headers['Accept'] = "application/json"

        return response
    
    

class SingleNoteView(APIView):
    def get(self, request, noteID):  
        authToken = request.headers.get('basicAuth')
        
        try:
            Session.objects.get(token=authToken)
            note = Note.objects.get(noteID=noteID)
            noteGroupIDs = NoteGroupRelation.objects.filter(noteID=note).values_list('groupID', flat=True)
            noteGroupNames = []

            for i in range(len(noteGroupIDs)):
                name = Group.objects.get(groupID=noteGroupIDs[i]).groupName
                noteGroupNames.append(name)

            
            noteInfo = {
                "noteID" : note.noteID,
                "noteContent" : note.note,
                "noteGroups" : noteGroupNames
            }

            responseBody = {"status": {"code":200, "message": "Retrieved the note successfully"}, "data":{"noteData": noteInfo}, "event": "SINGLE_NOTE_SUCCESS"}

        except Note.DoesNotExist:
            responseBody = {"status": {"code": 404, "message": "Note not found"}, "data": {"noteData":None}, "event": "SINGLE_NOTE_ERROR"}        
        
        except Session.DoesNotExist:
            responseBody = {"status": {"code": 403, "message": "Unauthorized"}, "data": {"noteData" : None}, "event": "SINGLE_NOTE_ERROR"}
            
        response = Response(responseBody)
        response.headers['Accept'] = "application/json"

        return Response(responseBody)
