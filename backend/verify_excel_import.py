import os
import django
import sys
from io import BytesIO
import openpyxl

# Configurar el entorno de Django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.services.excel_import_service import ExcelImportService
from api.models import Proyecto, HistoriaUsuario
from django.contrib.auth.models import User

def create_test_excel(headers, data):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append(headers)
    for row in data:
        ws.append(row)
    
    file_stream = BytesIO()
    wb.save(file_stream)
    file_stream.seek(0)
    return file_stream

def test_import():
    user, _ = User.objects.get_or_create(username='admin_test')
    proyecto, _ = Proyecto.objects.get_or_create(
        nombre='Test Project', 
        creador=user,
        defaults={'descripcion': 'Testing excel import'}
    )
    
    # Caso 1: Encabezados en inglés y sin acentos
    headers1 = ['Title', 'Requirement', 'Description', 'Acceptance Criteria', 'Priority', 'Owner']
    data1 = [
        ['Story English', 'Requirement 1', 'Detail 1', 'Criteria A\nCriteria B', 'High', 'admin_test'],
        ['Story Simplified', None, 'Only detail here', 'Check 1', '2', None]
    ]
    
    # Caso 2: Encabezados en español "mal escritos" o alternativos
    headers2 = ['HU', 'Resumen', 'Urgencia', 'checklist']
    data2 = [
        ['Historia Loca', 'Esto es un resumen', 'Baja', 'Punto 1\n* Punto 2\n- Punto 3']
    ]

    print("--- Test 1: English & No Accents ---")
    file1 = create_test_excel(headers1, data1)
    res1 = ExcelImportService.import_user_stories(proyecto.id, file1)
    print(f"Success: {res1['success']}")
    if res1['success']:
        print(f"Created: {res1['data']['created_count']}, Errors: {res1['data']['errors_count']}")
    else:
        print(f"Error: {res1['error']}")

    print("\n--- Test 2: Alternative Headers ---")
    file2 = create_test_excel(headers2, data2)
    res2 = ExcelImportService.import_user_stories(proyecto.id, file2)
    print(f"Success: {res2['success']}")
    if res2['success']:
        print(f"Created: {res2['data']['created_count']}, Errors: {res2['data']['errors_count']}")
    else:
        print(f"Error: {res2['error']}")

if __name__ == "__main__":
    test_import()
