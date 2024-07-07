from django.shortcuts import render
from django.http import HttpResponse
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework.views import APIView
from ..models import *
from django.contrib.auth.hashers import check_password


class SessionView(APIView):
    def post(self, request):
        inputEmailID = request.data.get('emailID')
        inputPassword = request.data.get('password')

        try:
            userDetails = User.objects.get(emailID=inputEmailID)

            if check_password(inputPassword, userDetails.password):
                data = Session.objects.create(userID=userDetails.userID)
                responseBody = {"status":{"code":200, "message":"Logged in successfully"}, "data":{"token":data.token}}

            else:
                responseBody = {"status":{"code":400, "message":"User ID or password is incorrect"}, "data":{"token":None}}

        except User.DoesNotExist:
            responseBody = {"status":{"code":404, "message":"User Not Found"}, "data":{"token":None}}

        
        response = Response(responseBody)
        response.headers['Accept'] = "application/json"

        return response


    def get(self, request):
        sessionToken = request.headers.get('basicAuth')

        try:
            sessionDetails = Session.objects.get(token = sessionToken)

            if sessionDetails.expiresAt < datetime.datetime.now(datetime.UTC):
                Session.objects.get(token = sessionToken).delete()

                responseBody = {"status":{"code":401,"message":"Session expired"},"data":{"token":None}}

            else:
                responseBody = {"status":{"code":200,"message":"Session is active"},"data":{"token":sessionToken}}

        except:
            responseBody = {"status":{"code":404,"message":"Session token not found"},"data":{"token":None}}
        
        response = Response(responseBody)
        response.headers['Accept'] = "application/json"
        
        return response
