from datetime import date, timedelta
from billing.models import Deposit, Invoice
from billing.services import generate_invoices
from tenants.models import LeaseAgreement, Tenant
from tenants.services import move_in
from properties.models import Unit
from mpesa.services import MpesaSettlementEngine

today = date.today()
tom = Tenant.objects.get(user__username='tenant')
start = today.replace(day=1) - timedelta(days=62)
tom.entry_date = start; tom.save()
LeaseAgreement.objects.get_or_create(tenant=tom, unit=tom.unit, defaults=dict(
    start_date=start, rent_amount=tom.unit.rent_amount, deposit_amount=tom.unit.deposit, is_active=True))
Deposit.objects.get_or_create(deposit_code=f'DEP-{tom.tenant_id}', defaults=dict(
    tenant=tom, unit=tom.unit, amount=tom.unit.deposit, status='held'))
for back in (2, 1, 0):
    m = today.replace(day=1)
    for _ in range(back):
        m = (m - timedelta(days=1)).replace(day=1)
    generate_invoices(m, today=today, tenant=tom)

# A second tenant in A2, with no portal login.
a2 = Unit.objects.get(unit_no='A2')
if not Tenant.objects.filter(unit=a2).exists():
    move_in(unit=a2, name='Wanjiru Kamau', phone_number='0722123456', email='wanjiru@example.com',
            start_date=today.replace(day=1), end_date=None, due_date=5)

stamp = today.strftime('%Y%m%d') + '101500'
MpesaSettlementEngine.process_payment(dict(TransID='QGH1A2B3C4', TransAmount='15000', TransTime=stamp,
    BusinessShortCode='522522', BillRefNumber='A1', MSISDN='254711000002', FirstName='Tom', LastName='Tenant'))
MpesaSettlementEngine.process_payment(dict(TransID='QGH9Z8Y7X6', TransAmount='4500', TransTime=stamp,
    BusinessShortCode='522522', BillRefNumber='NOSUCH', MSISDN='254799000111', FirstName='Unknown', LastName='Payer'))
print(Invoice.objects.count(), 'invoices')
