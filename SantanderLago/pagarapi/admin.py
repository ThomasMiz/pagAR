from django.contrib import admin
from pagarapi import models

admin.site.register(models.Account)
admin.site.register(models.Transaction)
