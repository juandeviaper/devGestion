import openpyxl
import re
import unicodedata
import difflib
from typing import Any, Dict, List, Optional
from django.contrib.auth.models import User
from ..models import Proyecto
from .workitem_service import WorkItemService

class ExcelImportService:
    """
    Servicio avanzado para procesar la importación masiva de Historias de Usuario desde Excel.
    Soporta múltiples formatos de encabezados y mapeo flexible de datos.
    """

    # Mapeo de sinónimos para detectar columnas (normalizados)
    HEADER_SYNONYMS = {
        'titulo': ['titulo', 'title', 'nombre', 'hu', 'historia', 'user story', 'resumen', 'summary'],
        'requerimiento': ['requerimiento', 'req', 'funcionalidad', 'modulo', 'feature', 'acción'],
        'descripcion': ['descripcion', 'desc', 'detalle', 'cuerpo', 'explicacion', 'detallada', 'description'],
        'criterios': ['criterios', 'criterios de aceptacion', 'pruebas', 'validacion', 'checklist', 'acceptance criteria'],
        'prioridad': ['prioridad', 'importancia', 'urgencia', 'level', 'nivel', 'priority'],
        'responsable': ['responsable', 'asignado', 'encargado', 'dueño', 'user', 'owner', 'assigned to']
    }

    # Columnas absolutamente necesarias para crear una HU básica
    MANDATORY_FIELDS = ['titulo']

    # Mapeo de prioridades para normalización
    PRIORITY_MAP = {
        'baja': 'baja', 'low': 'baja', '1': 'baja', 'verde': 'baja', 'green': 'baja',
        'media': 'media', 'medium': 'media', '2': 'media', 'amarillo': 'media', 'yellow': 'media',
        'alta': 'alta', 'high': 'alta', '3': 'alta', 'rojo': 'alta', 'red': 'alta'
    }

    @staticmethod
    def _normalize(text: Any) -> str:
        """
        Limpia y normaliza un texto para comparaciones (quita acentos, minúsculas, espacios).
        """
        if not text:
            return ""
        text = str(text).lower().strip()
        # Quitar acentos
        text = "".join(
            c for c in unicodedata.normalize('NFD', text)
            if unicodedata.category(c) != 'Mn'
        )
        # Quitar caracteres especiales y dejar solo letras y números
        text = re.sub(r'[^a-z0-9\s/]', '', text)
        return text.strip()

    @staticmethod
    def import_user_stories(proyecto_id: int, file_obj: Any) -> Dict[str, Any]:
        """
        Procesa un archivo Excel y crea las Historias de Usuario para un proyecto.
        Es tolerante a diferentes nombres de columna y formatos de datos.
        """
        try:
            wb = openpyxl.load_workbook(file_obj, data_only=True)
            sheet = wb.active
            if not sheet:
                return {'success': False, 'error': 'El archivo Excel está vacío.'}
        except Exception as e:
            return {'success': False, 'error': f'Error al leer el archivo Excel: {str(e)}'}

        rows = list(sheet.rows)
        if not rows:
            return {'success': False, 'error': 'El archivo no contiene datos.'}

        # Detectar qué columna es cada campo
        raw_headers = [cell.value for cell in rows[0]]
        field_to_col_idx = {}
        
        for idx, raw_val in enumerate(raw_headers):
            if raw_val is None: continue
            norm_val = ExcelImportService._normalize(raw_val)
            
            for field, synonyms in ExcelImportService.HEADER_SYNONYMS.items():
                normalized_syns = [ExcelImportService._normalize(syn) for syn in synonyms]
                
                # 1. Coincidencia exacta
                if norm_val in normalized_syns:
                    field_to_col_idx[field] = idx
                    break
                    
                # 2. Coincidencia parcial (subcadena)
                if any(syn in norm_val or norm_val in syn for syn in normalized_syns if len(syn) > 3):
                    field_to_col_idx[field] = idx
                    break
                    
                # 3. Coincidencia aproximada (fuzzy matching) para errores tipográficos
                fuzzy_matches = difflib.get_close_matches(norm_val, normalized_syns, n=1, cutoff=0.65)
                if fuzzy_matches:
                    field_to_col_idx[field] = idx
                    break

        # Validar campos mínimos
        missing_mandatory = [f for f in ExcelImportService.MANDATORY_FIELDS if f not in field_to_col_idx]
        if missing_mandatory:
            return {
                'success': False, 
                'error': f'No se pudo identificar la columna mínima para: {", ".join(missing_mandatory)}. '
                         f'Asegúrate de que tus encabezados sean reconocibles.'
            }

        results = {
            'created_count': 0,
            'errors_count': 0,
            'details': []
        }

        # Procesar filas
        for i, row in enumerate(rows[1:], start=2):
            row_data = [cell.value for cell in row]
            if all(val is None for val in row_data):
                continue

            try:
                # Helper para obtener datos de columna por nombre simbólico
                def get_val(field_name):
                    idx = field_to_col_idx.get(field_name)
                    if idx is not None and idx < len(row_data):
                        val = row_data[idx]
                        return str(val).strip() if val is not None else None
                    return None

                titulo = get_val('titulo')
                requerimiento = get_val('requerimiento')
                desc_detallada = get_val('descripcion')
                criterios_raw = get_val('criterios')
                prioridad_raw = ExcelImportService._normalize(get_val('prioridad'))
                responsable_raw = get_val('responsable')

                # Validaciones mínimas
                if not titulo:
                    results['errors_count'] += 1
                    results['details'].append({'fila': i, 'errores': ['Falta el título de la historia']})
                    continue

                # Lógica de fallback para descripción
                # Si falta una de las dos (req o desc), usamos la que tengamos.
                if not requerimiento and not desc_detallada:
                    full_description = "Sin descripción adicional proporcionada."
                elif not requerimiento:
                    full_description = desc_detallada
                elif not desc_detallada:
                    full_description = requerimiento
                else:
                    full_description = f"**REQUERIMIENTO:**\n{requerimiento}\n\n**DETALLE:**\n{desc_detallada}"

                # Normalizar prioridad
                prioridad = ExcelImportService.PRIORITY_MAP.get(prioridad_raw, 'media')

                # Buscar responsable por username
                asignado_a = None
                if responsable_raw:
                    try:
                        asignado_a = User.objects.get(username=responsable_raw)
                    except User.DoesNotExist:
                        pass # Silencioso, se asignará luego

                # Parsing de criterios (manejo flexible de listas)
                criteria_list = []
                if criterios_raw:
                    # Separar por saltos de línea o por puntos/comas si es una lista larga?
                    # Por ahora saltos de línea es lo estándar.
                    lines = re.split(r'\n|;|(?<=\.)\s+', criterios_raw)
                    for line in lines:
                        clean_line = line.strip().strip('-').strip('*').strip('•').strip()
                        if clean_line and len(clean_line) > 2:
                            criteria_list.append({'descripcion': clean_line, 'completado': False})

                # Crear la Historia de Usuario
                hu_data = {
                    'titulo': titulo,
                    'descripcion': full_description,
                    'prioridad': prioridad,
                    'estado': 'pendiente',
                    'proyecto_id': proyecto_id,
                    'asignado_a': asignado_a
                }

                WorkItemService.create_story(hu_data, criteria_list)
                results['created_count'] += 1

            except Exception as e:
                results['errors_count'] += 1
                results['details'].append({'fila': i, 'errores': [f'Error: {str(e)}']})

        return {'success': True, 'data': results}
