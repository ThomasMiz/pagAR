from django.core.paginator import Paginator, EmptyPage
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from . import models, serializers, constants, pagination, extractor
from rest_framework.permissions import AllowAny
from django.db import transaction, IntegrityError
from datetime import datetime
from .validators import validate_cbu_get_account, validate_transaction_amount, validate_account_balance


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def accounts(request):
    if request.method == 'GET':
        return get_accounts(request)
    if request.method == 'POST':
        return create_account(request)
    return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)


def create_account(request):
    account = models.Account.objects.create()
    return Response(serializers.AccountSerializer(account, many=False).data, status=status.HTTP_201_CREATED)


def get_accounts(request):
    page, page_size, err = extractor.extract_paging_from_request(request=request)
    if err is not None:
        return err

    queryset = models.Account.objects.where_active()
    queryset = queryset.order_by('-cbu_raw')
    try:
        query_paginator = Paginator(queryset, page_size)
        query_data = query_paginator.page(page)
        serializer = serializers.AccountSerializer(query_data, many=True)
        resp = Response(serializer.data)
        resp = pagination.add_paging_to_response(request, resp, query_data, page, query_paginator.num_pages)
        return resp
    except EmptyPage:
        return Response(status=status.HTTP_404_NOT_FOUND)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([AllowAny])
def account_by_cbu(request, cbu):
    if request.method == 'GET':
        return get_account(request, cbu)
    if request.method == 'PUT':
        return update_account(request, cbu)
    if request.method == 'DELETE':
        return delete_account(request, cbu)
    return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)


def get_account(request, cbu):
    try:
        account = models.Account.objects.get_by_cbu(cbu)
        return Response(serializers.AccountSerializer(account, many=False).data, status=status.HTTP_200_OK)
    except models.Account.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)


def update_account(request, cbu):
    if "balance" not in request.data:
        return Response({"error": 'Parameter "balance" missing'}, status=status.HTTP_400_BAD_REQUEST)

    balance, balance_error = validate_account_balance(request.data["balance"])
    if balance_error is not None:
        return Response(data={"error": balance_error, "field": "balance"}, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        account, account_error = validate_cbu_get_account(cbu, must_be_local=True)
        if account_error is not None:
            return Response(data={"error": account_error, "field": "cbu"}, status=status.HTTP_400_BAD_REQUEST)

        account.balance = balance
        account.save()
    return Response(status=status.HTTP_204_NO_CONTENT)


def delete_account(request, cbu):
    with transaction.atomic():
        account, account_error = validate_cbu_get_account(cbu, must_be_local=True)
        if account_error is not None:
            return Response(data={"error": account_error, "field": "cbu"}, status=status.HTTP_400_BAD_REQUEST)

        if account.active:
            account.active = False
            account.save()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def transactions(request):
    if request.method == 'GET':
        return get_transactions(request)
    if request.method == 'POST':
        return create_transaction(request)
    return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)


def get_transactions(request):
    page, page_size, err = extractor.extract_paging_from_request(request=request)
    if err is not None:
        return err

    try:
        queryset = models.Transaction.objects

        start_str = request.GET.get('start')
        if start_str is not None:
            queryset = queryset.filter(date__gte=datetime.strptime(start_str, constants.DATE_FORMAT))
        end_str = request.GET.get('end')
        if end_str is not None:
            queryset = queryset.filter(date__lte=datetime.strptime(end_str, constants.DATE_FORMAT))

        source_str = request.GET.get('source')
        if source_str is not None:
            queryset = queryset.where_source_cbu(source_str)
        destination_str = request.GET.get('destination')
        if destination_str is not None:
            queryset = queryset.where_destination_cbu(destination_str)

        queryset = queryset.order_by('-date')
        query_paginator = Paginator(queryset, page_size)
        query_data = query_paginator.page(page)
        serializer = serializers.TransactionSerializer(query_data, many=True)
        resp = Response(serializer.data)
        resp = pagination.add_paging_to_response(request, resp, query_data, page, query_paginator.num_pages)
        return resp
    except ValueError:
        return Response(status=status.HTTP_400_BAD_REQUEST)
    except EmptyPage:
        return Response(status=status.HTTP_404_NOT_FOUND)


def create_transaction(request):
    if "source" not in request.data:
        return Response({"error": 'Parameter "source" missing'}, status=status.HTTP_400_BAD_REQUEST)
    if "destination" not in request.data:
        return Response({"error": 'Parameter "destination" missing'}, status=status.HTTP_400_BAD_REQUEST)
    if "amount" not in request.data:
        return Response({"error": 'Parameter "amount" missing'}, status=status.HTTP_400_BAD_REQUEST)

    source_cbu = request.data["source"]
    destination_cbu = request.data["destination"]
    motive = None if "motive" not in request.data else request.data["motive"]
    tag = None if "tag" not in request.data else request.data["tag"]

    amount, amount_error = validate_transaction_amount(request.data["amount"])
    if amount_error is not None:
        return Response(data={"error": amount_error, "field": "amount"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        with transaction.atomic():
            source, source_error = validate_cbu_get_account(source_cbu, must_be_local=True)
            if source_error is not None:
                return Response(data={"error": source_error, "field": "source"}, status=status.HTTP_400_BAD_REQUEST)

            destination, destination_error = validate_cbu_get_account(destination_cbu, must_be_local=True, must_be_active=True)
            if destination_error is not None:
                return Response(data={"error": destination_error, "field": "destination"}, status=status.HTTP_400_BAD_REQUEST)

            if source == destination:
                return Response({"error": "Transactions must be between different accounts"}, status=status.HTTP_400_BAD_REQUEST)

            if amount > source.balance:
                return Response({"error": "Insufficient Balance"}, status=status.HTTP_400_BAD_REQUEST)

            source.balance -= amount
            destination.balance += amount

            tx = models.Transaction(source=source, destination=destination, amount=amount, motive=motive, tag=tag)
            tx.save()
            source.save()
            destination.save()
            return Response(serializers.TransactionSerializer(tx, many=False).data, status=status.HTTP_201_CREATED)
    except IntegrityError:
        return Response({"error": "Error while transferring founds"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def transaction_by_id(request, id):
    if request.method == 'GET':
        return get_transaction(request, id)
    return Response(status=status.HTTP_405_METHOD_NOT_ALLOWED)


def get_transaction(request, id):
    try:
        tx = models.Transaction.objects.get(id=id)
        return Response(serializers.TransactionSerializer(tx, many=False).data, status=status.HTTP_200_OK)
    except models.Account.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
