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

    def __str__(self):
        return self.cbu

    class QuerySet(models.QuerySet):
        def is_active(self):
            return self.filter(active=False)

        def get_by_cbu(self, cbu):
            entity_number, branch_number, account_number, is_ok = decompose_cbu(cbu)
            if entity_number != int(CBU_ENTITY_NUMBER):
                raise Account.DoesNotExist
            cbu_raw = account_number + branch_number * 10000000000000
            return self.get(cbu_raw=cbu_raw)

    objects = QuerySet.as_manager()


class Transaction(models.Model):
    source = models.ForeignKey(Account, on_delete=models.SET_NULL, null=True, related_name='source')
    destination = models.ForeignKey(Account, on_delete=models.SET_NULL, null=True, related_name='destination')
    amount = models.FloatField(blank=False, null=False, default=0.0)
    date = models.DateTimeField(blank=False, null=False, auto_now_add=True)
