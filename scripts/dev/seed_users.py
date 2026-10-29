from django.contrib.auth import get_user_model
from django.core.management import call_command
from config_core.models import UserRole
from properties.models import Landlord, Property, Unit
from tenants.models import Tenant

call_command('seed_roles')
U = get_user_model()
PW = 'Geopima@2026'

def mk(username, first, last, role=None, superuser=False):
    u, _ = U.objects.get_or_create(username=username, defaults=dict(
        first_name=first, last_name=last, email=f'{username}@geopima.test'))
    u.set_password(PW)
    u.is_staff = u.is_superuser = superuser
    u.save()
    if role:
        u.roles.set([UserRole.objects.get(name=role)])
    return u

mk('superadmin', 'Super', 'Admin', 'Super Admin', superuser=True)
mk('admin', 'Alice', 'Admin', 'Admin')
mk('accountant', 'Ann', 'Accountant', 'Accountant')
mk('secretary', 'Sam', 'Secretary', 'Secretary')
mk('fieldagent', 'Felix', 'Agent', 'Field Agent')

lu = mk('landlord', 'Lucy', 'Landlord')
ll, _ = Landlord.objects.get_or_create(landlord_id='LL-001', defaults=dict(
    name='Lucy Landlord', phone_number='0711000001', email=lu.email))
ll.user = lu; ll.save()
prop, _ = Property.objects.get_or_create(property_id='PR-001', defaults=dict(
    name='Sunrise Apartments', landlord=ll, location='Nairobi'))
unit, _ = Unit.objects.get_or_create(unit_no='A1', property=prop, defaults=dict(
    unit_name='A1', rent_amount=15000, deposit=15000))
Unit.objects.get_or_create(unit_no='A2', property=prop, defaults=dict(
    unit_name='A2', rent_amount=18000, deposit=18000))

tu = mk('tenant', 'Tom', 'Tenant')
t, _ = Tenant.objects.get_or_create(user=tu, defaults=dict(
    name='Tom Tenant', phone_number='0711000002', email=tu.email, unit=unit))
unit.is_occupied = True; unit.status = 'Occupied'; unit.save()
print('done')
