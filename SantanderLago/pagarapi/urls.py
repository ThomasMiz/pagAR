from django.urls import path
from . import views

urlpatterns = [
    path('accounts', views.accounts, name='accounts'),
    path('accounts/<int:id>', views.account_by_id, name="account_by_id"),
    path('transactions', views.transactions, name="transactions")
]