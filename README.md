# Cross-Browser-Compatible-Notes-Extension

## Project Overview

This project is a cross-browser compatible extension designed to store notes assigned to specific user groups such as frontend team, backend team, product, infra, design, and business. With this extension, you can add a note to the webpage you are currently on, modify or delete the note, and view notes written by others that are assigned to the groups you belong to.



## Features

* Add, modify, and delete notes on any webpage.
  
* View notes assigned to the user groups you belong to.
  
* Notes are specific to webpages and user groups.
  
* Cross-browser compatibility.
  
* Persistent Login: Once you log in, you do not need to re-login for the next 30 days unless you use the extension in a different browser. After 30 days, the session expires, and the extension will prompt you to log in again.



## Technologies Used

### Backend

* Django
  
* MySQL Database
  
* Docker


### Frontend

* HTML
  
* CSS
  
* JavaScript




## Directory Structure

### Backend

The backend follows the standard Django directory structure and includes:

* Django Project Directory: Contains the main Django project.
  
* app/views: Contains Django views to handle API calls from the frontend and communicate with the database.
  
* app/libraries: Contains Python files to create canonical URLs for the webpages.
  
* app/management/commands: Contains a Python file to store notes for blocked or unapproved webpages.
  
* urls.py: Contains API endpoints for session, user, and notes management.
  
* settings.py: Modified to resolve CORS issues.



### Frontend

The frontend includes:

* html: Contains four HTML files for login, viewing notes, adding/modifying a note, and deleting a note.
  
* css: Contains a centralized CSS file with various class and ID-based styling properties.
  
* jsScripts: Contains three JavaScript files:

- content.js: Main script with functions for different event listener actions.

- background.js: Determines which HTML page (login page or list of notes) to render based on user login information.

- config.js: Contains the API URL used for making backend API calls.

* manifest.json: Specifies the version of the manifest and other extension details.



## Usage

### Cloning the Repository

First, clone the repository to your local machine:
```console
git clone <repository-url>
```


### Backend

#### Creating a New Docker Image for Django

1. Pull the Python base image from Docker Hub:
```console
docker pull python
```


2. Navigate to the directory containing the Dockerfile and build the Docker image:
```console
docker build .
```


3. Tag the custom Docker image to match the name in the docker-compose.yaml file:
```console
docker tag <image_id> <image_name>
```
You can find the image ID using the ```docker images``` command.


4. Pull the MySQL image:
```console
docker pull mysql
```


5. Run the docker-compose.yaml file:
```console
docker compose up
```


#### Using Django Shell and MySQL Shell

1. Start the Django and MySQL containers:
```console
docker start <django_container_name>
docker start <mysql_container_name>
```


2. Access the Django container shell:
```console
docker exec -it <django_container_name> /bin/bash
```


3. In a new terminal, access the MySQL container shell:
```console
docker exec -it <mysql_container_name> bash
```



### Frontend

#### Chrome

1. Go to chrome://extensions/.

2. Click on the "Load unpacked" button.

3. Select the frontend directory.

   
#### Firefox

1. Go to about:addons.

2. Click on the settings button next to the "Manage Your Extensions" section headline.

3. Select "Install Add-on From File".

4. Select the frontend directory.

   
The extension is now ready to use.
