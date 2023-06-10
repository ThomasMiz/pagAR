from django import forms


class CreateTransactionForm(forms.Form):
    destination = forms.DecimalField(min_value=0, max_digits=22, decimal_places=0)
    amount = forms.DecimalField(min_value=0, max_digits=22, decimal_places=0)
