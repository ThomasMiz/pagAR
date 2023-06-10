from decimal import Decimal, DecimalException
from .models import Account
from .utils import decompose_cbu


def validate_cbu_get_account(cbu, must_exist=False) -> tuple[(Account | None), (str | None)]:
    """Validates whether a CBU is valid and from a local account that exists. Returns the account or an error message"""
    entity_number, branch_number, account_number, is_ok = decompose_cbu(cbu)
    if not is_ok:
        return None, "CBU Checksum doesn't match"

    try:
        return Account.objects.get_by_cbu(cbu), None
    except Account.DoesNotExist:
        return None, f"CBU {cbu} does not exist locally" if must_exist else None


def validate_transaction_amount(amount) -> tuple[(Decimal | None), (str | None)]:
    try:
        amount = Decimal(amount)
    except DecimalException:
        return None, "Not a valid amount"
    if amount <= 0:
        return None, "Must be >= 0"
    if not amount == amount.quantize(Decimal('1.00')):
        return None, 'Must have at most two decimal digits'

    return amount, None
