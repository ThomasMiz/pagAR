from django.core.paginator import Paginator, EmptyPage
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from . import models, serializers, constants, pagination, extractor
from rest_framework.permissions import AllowAny
from django.db import transaction, IntegrityError
from datetime import datetime
from .validators import validate_cbu_get_account, validate_transaction_amount


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def accounts(request):
    if request.method == 'GET':
        return get_accounts(request)
    return create_account(request)


def create_account(request):
    account = models.Account.objects.create()
    return Response(serializers.AccountSerializer(account, many=False).data, status=status.HTTP_201_CREATED)


def get_accounts(request):
    page, page_size, err = extractor.extract_paging_from_request(request=request)
    if err is not None:
        return err

    queryset = models.Account.objects.all()
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
    return delete_account(request, cbu)


def get_account(request, cbu):
    try:
        account = models.Account.objects.get_by_cbu(cbu)
        return Response(serializers.AccountSerializer(account, many=False).data, status=status.HTTP_200_OK)
    except models.Account.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)


def update_account(request, cbu):
    try:
        with transaction.atomic():
            # TODO: Implement
            account = models.Account.objects.get_by_cbu(cbu)
            return Response(status=status.HTTP_400_BAD_REQUEST)
            # account.balance = ...
            # account.save()
            # return Response(status=status.HTTP_204_NO_CONTENT)
    except models.Account.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    return Response(status=status.HTTP_400_BAD_REQUEST)


def delete_account(request, id):
    # TODO: Not implemented yet. Consider implementing logical deletes?
    return Response(status=status.HTTP_418_IM_A_TEAPOT)


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def transactions(request):
    if request.method == 'GET':
        return get_transactions(request)
    return create_transaction(request)


def get_transactions(request):
    page, page_size, err = extractor.extract_paging_from_request(request=request)
    if err is not None:
        return err

    try:
        filter_params = {}

        start_str = request.GET.get('start')
        if start_str is not None:
            filter_params["date__gte"] = datetime.strptime(start_str, constants.DATE_FORMAT)
        end_str = request.GET.get('end')
        if end_str is not None:
            filter_params["date__lte"] = datetime.strptime(end_str, constants.DATE_FORMAT)
        source_str = request.GET.get('source')
        if source_str is not None:
            filter_params['source'] = str(source_str)
        destination_str = request.GET.get('destination')
        if destination_str is not None:
            filter_params['destination'] = str(destination_str)

        queryset = models.Transaction.objects.filter(**filter_params).order_by('-date')
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
        return Response({"error": 'Parameter "source" missing'})
    if "destination" not in request.data:
        return Response({"error": 'Parameter "destination" missing'})
    if "amount" not in request.data:
        return Response({"error": 'Parameter "amount" missing'})

    source_cbu = request.data["source"]
    destination_cbu = request.data["destination"]

    amount, amount_error = validate_transaction_amount(request.data["amount"])
    if amount_error is not None:
        return Response(data={"error": amount_error, "field": "amount"}, status=status.HTTP_400_BAD_REQUEST)

    source, source_error = validate_cbu_get_account(source_cbu, must_be_local=True)
    if source_error is not None:
        return Response(data={"error": source_error, "field": "source"}, status=status.HTTP_400_BAD_REQUEST)

    destination, destination_error = validate_cbu_get_account(destination_cbu, must_be_local=True)
    if destination_error is not None:
        return Response(data={"error": destination_error, "field": "destination"}, status=status.HTTP_400_BAD_REQUEST)

    if destination is None and source is None:
        return Response(data={"error": "At least one of the accounts must belong to this bank"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        with transaction.atomic():
            if amount > source.balance:
                return Response({"error": "Insufficient Balance"}, status=status.HTTP_400_BAD_REQUEST)
            source.balance -= amount

            destination.balance += amount

            tx = models.Transaction(source=source, destination=destination, amount=amount)
            tx.save()
            source.save()
            destination.save()
            return Response(serializers.TransactionSerializer(tx, many=False).data, status=status.HTTP_201_CREATED)
    except IntegrityError:
        return Response({"error": "Error while transferring founds"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
