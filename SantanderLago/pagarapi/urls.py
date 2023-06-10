from django.urls import path
from . import views

urlpatterns = [
    path('accounts', views.accounts, name='accounts'),
    path('accounts/<cbu>', views.account_by_cbu, name="account_by_cbu"),
    path('transactions', views.transactions, name="transactions")
]