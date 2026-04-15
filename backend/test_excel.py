import sys
import os
import openpyxl

# Set up Django
sys.path.insert(0, r'c:\Users\usuario\DevGestion\backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
import django
django.setup()

from api.services.excel_import_service import ExcelImportService

# Create a dummy excel file
wb = openpyxl.Workbook()
ws = wb.active
ws.append(["Nombre de la historia", "Detalle descriptivo", "Nivel de importancia", "Responsable asignado"])
ws.append(["Test HU", "Detalle 1", "Alta", "admin"])
wb.save('dummy.xlsx')

try:
    with open('dummy.xlsx', 'rb') as f:
        res = ExcelImportService.import_user_stories(1, f)
        print("RESULT:")
        print(res)
except Exception as e:
    import traceback
    traceback.print_exc()
