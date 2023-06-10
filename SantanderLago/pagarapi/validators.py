from decimal import Decimal, DecimalException
from .models import Account
from .utils import decompose_cbu
from .constants import CBU_ENTITY_NUMBER


def validate_cbu_get_account(cbu, must_be_local=False, must_be_active=False) -> tuple[(Account | None), (str | None)]:
    """Validates whether a CBU is valid and from a local account that exists. Returns the account or an error message"""
    entity_number, branch_number, account_number, is_ok = decompose_cbu(cbu)
    if not is_ok:
        return None, "CBU Checksum doesn't match"

    if entity_number != int(CBU_ENTITY_NUMBER):
        return None, None

    try:
        account = Account.objects.get_by_cbu(cbu)

        if must_be_active and not account.active:
            return account, "Account is not active"

        return account, None
    except Account.DoesNotExist:
        return None, f"CBU {cbu} does not exist locally" if must_be_local else None


def validate_account_balance(balance) -> tuple[(Decimal | None), (str | None)]:
    try:
        balance = Decimal(balance)
    except DecimalException:
        return None, "Not a valid amount"
    if balance < 0:
        return None, "Must be >= 0"
    if not balance == balance.quantize(Decimal('1.00')):
        return None, 'Must have at most two decimal digits'

    return balance, None


def validate_transaction_amount(amount) -> tuple[(Decimal | None), (str | None)]:
    try:
        amount = Decimal(amount)
    except DecimalException:
        return None, "Not a valid amount"
    if amount <= 0:
        return None, "Must be > 0"
    if not amount == amount.quantize(Decimal('1.00')):
        return None, 'Must have at most two decimal digits'

    return amount, None
