# Generated by Django 4.2.2 on 2023-06-10 00:45

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Account',
            fields=[
                ('cbu_raw', models.BigAutoField(primary_key=True, serialize=False)),
                ('balance', models.DecimalField(decimal_places=2, default=0.0, max_digits=24)),
                ('active', models.BooleanField(default=True)),
            ],
        ),
        migrations.CreateModel(
            name='Transaction',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('amount', models.FloatField(default=0.0)),
                ('date', models.DateTimeField(auto_now_add=True)),
                ('destination', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='destination', to='pagarapi.account')),
                ('origin', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='origin', to='pagarapi.account')),
            ],
        ),
    ]
