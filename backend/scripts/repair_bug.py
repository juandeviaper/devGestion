import os
import sqlite3


db_path = 'backend/db.sqlite3'
if not os.path.exists(db_path):
    print(f'Error: {db_path} no encontrado.')
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    print('--- Reparando api_bug ---')

    # 1. Crear nueva tabla temporal sin feature_id
    cursor.execute("""
        CREATE TABLE "api_bug_new" (
            "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
            "titulo" varchar(200) NOT NULL,
            "descripcion" text NOT NULL,
            "estado" varchar(15) NOT NULL,
            "fecha_creacion" datetime NOT NULL,
            "asignado_a_id" integer NULL REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED,
            "proyecto_id" bigint NOT NULL REFERENCES "api_proyecto" ("id") DEFERRABLE INITIALLY DEFERRED,
            "sprint_id" bigint NULL REFERENCES "api_sprint" ("id") DEFERRABLE INITIALLY DEFERRED,
            "historia_id" bigint NULL REFERENCES "api_historiausuario" ("id") DEFERRABLE INITIALLY DEFERRED,
            "prioridad" varchar(10) NOT NULL DEFAULT 'media'
        )
    """)

    # 2. Copiar datos (excluyendo severidad y feature_id que parecen ser de la migración dañada)
    # Nota: El usuario pidió Bug con prioridad, estado, etc.
    # En el DDL anterior vi: "severidad" varchar(10) NOT NULL, "feature_id" bigint NULL REFERENCES "api_feature"
    # Voy a omitir severidad también si no está en el modelo actual.

    # Verificamos qué columnas existen realmente
    cursor.execute('PRAGMA table_info(api_bug)')
    columns = [row[1] for row in cursor.fetchall()]
    print(f'Columnas detectadas en api_bug: {columns}')

    valid_cols = [
        'id',
        'titulo',
        'descripcion',
        'estado',
        'fecha_creacion',
        'asignado_a_id',
        'proyecto_id',
        'sprint_id',
        'historia_id',
        'prioridad',
    ]
    common_cols = [c for c in columns if c in valid_cols]

    cols_str = ', '.join(common_cols)
    cursor.execute(f'INSERT INTO api_bug_new ({cols_str}) SELECT {cols_str} FROM api_bug')

    # 3. Eliminar tabla vieja y renombrar nueva
    cursor.execute('DROP TABLE api_bug')
    cursor.execute('ALTER TABLE api_bug_new RENAME TO api_bug')

    conn.commit()
    print('Tabla api_bug reparada exitosamente.')

except Exception as e:
    conn.rollback()
    print(f'Error durante la reparación: {e}')
finally:
    conn.close()
