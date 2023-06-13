from rest_framework import serializers
from .models import Account, Transaction


class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = ('cbu', 'balance', 'active')


class TransactionSerializer(serializers.ModelSerializer):
    source = serializers.SerializerMethodField()
    destination = serializers.SerializerMethodField()

    def get_source(self, obj):
        return obj.source.cbu

    def get_destination(self, obj):
        return obj.destination.cbu

    class Meta:
        model = Transaction
        fields = ('id', 'source', 'destination', 'amount', 'date', 'motive', 'tag')
