from django.core.paginator import Paginator, EmptyPage
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from pagarapi import forms, models, serializers, constants, pagination, extractor
from rest_framework.permissions import AllowAny
from django.db import transaction, IntegrityError
from datetime import datetime


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
def account_by_id(request, id):
    if request.method == 'GET':
        return get_account(request, id)
    if request.method == 'PUT':
        return update_account(request, id)
    return delete_account(request, id)


def get_account(request, id):
    try:
        account = models.Account.objects.get(pk=id)
        return Response(serializers.AccountSerializer(account, many=False).data, status=status.HTTP_200_OK)
    except models.Account.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)


def update_account(request, id):
    try:
        user = models.User.objects.get(pk=id)
        serializer = serializers.UserDetailsSerializer(data=request.data, context={'user': user})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user.account.balance = serializer.validated_data.get('account')['balance']
        user.account.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    except models.User.DoesNotExist:
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
        origin_str = request.GET.get('origin')
        if origin_str is not None:
            filter_params['origin'] = int(origin_str)
        destination_str = request.GET.get('destination')
        if destination_str is not None:
            filter_params['destination'] = int(destination_str)

        queryset = models.Transaction.objects.filter(**filter_params).order_by('-id')
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
    form = forms.CreateTransactionForm(request.POST)
    if not form.is_valid():
        return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)

    destination = models.User.objects.get(id=form.cleaned_data['destination'])
    amount = form.cleaned_data['amount']
    try:
        with transaction.atomic():
            if amount > request.user.account.balance:
                return Response({"error": "Insufficient Balance"}, status=status.HTTP_400_BAD_REQUEST)
            tx = models.Transaction(origin=request.user, destination=destination, amount=amount)
            request.user.account.balance -= amount
            destination.account.balance += amount
            tx.save()
            request.user.account.save()
            destination.account.save()
            return Response(serializers.TransactionSerializer(tx, many=False).data, status=status.HTTP_201_CREATED)
    except IntegrityError:
        return Response({"error": "Error while transferring founds"}, status=status.HTTP_400_BAD_REQUEST)
