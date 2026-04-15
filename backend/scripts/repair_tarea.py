import os
import sqlite3


db_path = 'backend/db.sqlite3'
if not os.path.exists(db_path):
    print(f'Error: {db_path} no encontrado.')
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    print('--- Reparando api_tarea ---')

    # 1. Crear nueva tabla temporal sin completada
    cursor.execute("""
        CREATE TABLE "api_tarea_new" (
            "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT,
            "titulo" varchar(200) NOT NULL,
            "descripcion" text NOT NULL DEFAULT '',
            "prioridad" varchar(10) NOT NULL DEFAULT 'media',
            "estado" varchar(15) NOT NULL DEFAULT 'pendiente',
            "fecha_creacion" datetime NOT NULL,
            "proyecto_id" bigint NULL REFERENCES "api_proyecto" ("id") DEFERRABLE INITIALLY DEFERRED,
            "historia_id" bigint NULL REFERENCES "api_historiausuario" ("id") DEFERRABLE INITIALLY DEFERRED,
            "asignado_a_id" integer NULL REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED
        )
    """)

    # 2. Copiar datos
    cursor.execute('PRAGMA table_info(api_tarea)')
    columns = [row[1] for row in cursor.fetchall()]
    print(f'Columnas detectadas en api_tarea: {columns}')

    valid_cols = [
        'id',
        'titulo',
        'descripcion',
        'prioridad',
        'estado',
        'fecha_creacion',
        'proyecto_id',
        'historia_id',
        'asignado_a_id',
    ]
    common_cols = [c for c in columns if c in valid_cols]

    cols_str = ', '.join(common_cols)
    cursor.execute(f'INSERT INTO api_tarea_new ({cols_str}) SELECT {cols_str} FROM api_tarea')

    # 3. Eliminar tabla vieja y renombrar nueva
    cursor.execute('DROP TABLE api_tarea')
    cursor.execute('ALTER TABLE api_tarea_new RENAME TO api_tarea')

    conn.commit()
    print('Tabla api_tarea reparada exitosamente.')

except Exception as e:
    conn.rollback()
    print(f'Error durante la reparación: {e}')
finally:
    conn.close()
