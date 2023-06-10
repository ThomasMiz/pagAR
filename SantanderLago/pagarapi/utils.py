from .constants import CBU_ENTITY_NUMBER


def calc_cbu_checksum1(entity_number: (int | str), branch_number: (int | str)) -> int:
    entity_number = str(entity_number).zfill(3)
    branch_number = str(branch_number).zfill(4)
    sum1 = int(entity_number[0]) * 7 + int(entity_number[1]) + int(entity_number[2]) * 3
    sum1 += int(branch_number[0]) * 9 + int(branch_number[1]) * 7 + int(branch_number[2]) * 1 + int(branch_number[3]) * 3
    return (10 - (sum1 % 10)) % 10


def calc_cbu_checksum2(account_number: (int | str)):
    account_number = str(account_number).zfill(13)
    sum1 = int(account_number[0]) * 3 + int(account_number[1]) * 9 + int(account_number[2]) * 7
    sum1 += int(account_number[3]) * 1 + int(account_number[4]) * 3 + int(account_number[5]) * 9
    sum1 += int(account_number[6]) * 7 + int(account_number[7]) * 1 + int(account_number[8]) * 3
    sum1 += int(account_number[9]) * 9 + int(account_number[10]) * 7 + int(account_number[11]) * 1
    sum1 += int(account_number[12]) * 3
    return (10 - (sum1 % 10)) % 10


def cbu_from_raw(branch_number: (int | str), account_number: (int | str)) -> str:
    """Constructs a CBU by putting together the entity number, branch number, and account number"""
    return CBU_ENTITY_NUMBER + str(branch_number).zfill(4) + str(calc_cbu_checksum1(CBU_ENTITY_NUMBER, branch_number)) + str(account_number).zfill(13) + str(calc_cbu_checksum2(account_number))


def decompose_cbu(cbu: (str | int)) -> tuple[int, int, int, bool]:
    """Decomposes a CBU and returns its entity number, branch number, and account number (in that order)"""
    cbu = cbu.zfill(22)
    entity_number = int(cbu[0, 3])
    branch_number = int(cbu[3, 7])
    account_number = int(cbu[8, 21])
    is_ok = int(cbu[7]) == calc_cbu_checksum1(entity_number, branch_number) and int(cbu[21]) == calc_cbu_checksum2(account_number)
    return entity_number, branch_number, account_number, is_ok
