# Santander Lago: Setup

Clone or download the source code for Santander Lago and let's get started.

You will need to install PostgreSQL 15.2+ and Python 3.10 in your system. The project was run with 3.10.6, but should work with similar versions. There may be downloaded from:
* PostgreSQL: https://www.postgresql.org/download/
* Python: https://www.python.org/downloads/

Let's first set up the database. Santander Lago expects to find a postgres instance running at localhost:5432, with a database called 'santanderlago', with username and password 'postgres' 'postgres'. We will be setting it up like so, however this configuration may be changed in SantanderLago/santander/settings.py by altering the following snippet:
```py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'HOST': 'localhost',
        'PORT': '5432',
        'NAME': 'santanderlago',
        'USER': 'postgres',
        'PASSWORD': 'postgres'
    }
}
```

The postgres user may be created during the installation of PostgreSQL. To create the database, we can use the `psql` utility:

```
psql -U postgres 
postgres=# CREATE DATABASE santanderlago;
CREATE DATABASE
```

Now onto python. `cd` into your SantanderLago directory and create a python virtual environment (you may skip this step if you don't mind managing and installing your pip packages globally):
```bash
cd SantanderLago
python -m venv env

# Run the command appropiate to your operating system (NOT BOTH):
source ./env/bin/activate # For Linux/macOS
.\env\Scripts\activate # For Windows
```
You will now see "(env)" at the start of each command in your terminal, this means you're on the python virtual environment. Install the project's dependencies with pip:
```bash
pip install -r requirements.txt
```
Now perform initial one-time setup for Django:
```bash
python manage.py migrate
```

Now whenever you want to run Santander Lago, you (with your virtual environment open!) simply run:
```bash
python manage.py runserver
```

The Swagger UI is now available at http://localhost:8000/swagger/index.html.
