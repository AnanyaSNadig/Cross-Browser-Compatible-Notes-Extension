from django.shortcuts import render
from django.http import HttpResponse
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.views import APIView
from ..models import *


class UserView(APIView):
    def get(self, request):
        authToken = request.headers.get('basicAuth')
        
        try:
            sessionDetails = Session.objects.get(token=authToken)
            userDetails = User.objects.get(userID=sessionDetails.userID)

            try:
                groups = list(UserGroupRelation.objects.filter(userID=userDetails).values_list('groupID__groupName', flat=True))

                responseBody = {"status": {"code":200, "message":"Retrieved the groups successfully"}, "data":{"groups":groups}}

            except:
                responseBody = {"status": {"code":404, "message":"Groups Not Found"}, "data":{"groups":None}}

        except:
            responseBody = {"status": {"code": 403, "message": "Unauthorized"}, "data": {"groups" : None}}
        
        response = Response(responseBody)
        response.headers['Accept'] = "application/json"

        return Response(responseBody)
