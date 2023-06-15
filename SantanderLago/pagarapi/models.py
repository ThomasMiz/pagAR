from django.db import models
from .utils import cbu_from_raw, decompose_cbu
from .constants import CBU_ENTITY_NUMBER


class Account(models.Model):
    """Represents a banking account"""

    cbu_raw = models.BigAutoField(primary_key=True)
    """A 20-digit number that represents the CBU's branch number and account number concatenated together"""

    balance = models.DecimalField(max_digits=24, decimal_places=2, null=False, default=0.0)
    """The account's balance"""

    active = models.BooleanField(null=False, default=True)
    """Whether the account is active. If false, the account has been deleted"""

    @property
    def cbu(self):
        branch_number = self.cbu_raw // 10000000000000
        account_number = self.cbu_raw % 10000000000000
        return cbu_from_raw(branch_number, account_number)

    @property
    def is_central(self):
        return self.cbu_raw == 0

    def __str__(self):
        return self.cbu

    class QuerySet(models.QuerySet):
        def where_active(self):
            return self.filter(active=True)

        def get_by_cbu(self, cbu):
            entity_number, branch_number, account_number, is_ok = decompose_cbu(cbu)
            if entity_number != int(CBU_ENTITY_NUMBER):
                raise Account.DoesNotExist
            cbu_raw = account_number + branch_number * 10000000000000
            return self.get(cbu_raw=cbu_raw)

        def create_central(self):
            return self.create(cbu_raw=0)

        def get_central(self):
            return self.get(cbu_raw=0)

    objects = QuerySet.as_manager()


class Transaction(models.Model):
    source = models.ForeignKey(Account, on_delete=models.SET_NULL, null=True, related_name='source')
    destination = models.ForeignKey(Account, on_delete=models.SET_NULL, null=True, related_name='destination')
    amount = models.DecimalField(max_digits=24, decimal_places=2, null=False, default=0.0)
    date = models.DateTimeField(blank=False, null=False, auto_now_add=True)
    motive = models.CharField(max_length=200, null=True)
    tag = models.CharField(max_length=32, null=True)

    def __str__(self):
        return f"From {self.source.cbu} to {self.destination.cbu} {self.amount} at {self.date}"

    class QuerySet(models.QuerySet):
        def where_source_cbu(self, cbu):
            entity_number, branch_number, account_number, is_ok = decompose_cbu(cbu)
            if entity_number != int(CBU_ENTITY_NUMBER):
                raise Transaction.DoesNotExist
            cbu_raw = account_number + branch_number * 10000000000000
            return self.filter(source__cbu_raw=cbu_raw)

        def where_destination_cbu(self, cbu):
            entity_number, branch_number, account_number, is_ok = decompose_cbu(cbu)
            if entity_number != int(CBU_ENTITY_NUMBER):
                raise Transaction.DoesNotExist
            cbu_raw = account_number + branch_number * 10000000000000
            return self.filter(destination__cbu_raw=cbu_raw)

        def involving_cbu(self, cbu):
            entity_number, branch_number, account_number, is_ok = decompose_cbu(cbu)
            if entity_number != int(CBU_ENTITY_NUMBER):
                raise Transaction.DoesNotExist
            cbu_raw = account_number + branch_number * 10000000000000
            return self.filter(models.Q(destination__cbu_raw=cbu_raw) | models.Q(source__cbu_raw=cbu_raw))

    objects = QuerySet.as_manager()
