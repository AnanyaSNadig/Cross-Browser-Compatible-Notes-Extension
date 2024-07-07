FROM python:3

WORKDIR /usr/src/app

COPY . /usr/src/app

RUN apt-get update && apt-get install -y \
    default-libmysqlclient-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir -r requirements.txt

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]