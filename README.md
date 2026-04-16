# DevGestión - Sistema de Gestión de Proyectos Ágiles

DevGestión es una plataforma integral para la gestión de proyectos de desarrollo de software, inspirada en metodologías ágiles (Scrum/Kanban). Permite a los equipos organizar su trabajo a través de proyectos, sprints e historias de usuario con un enfoque premium y moderno.

---

## 🏗️ Arquitectura General

El sistema sigue una arquitectura de **Cliente-Servidor** desacoplada:

1.  **Backend (API REST)**: Construido con **Django** y **Django REST Framework (DRF)**. Maneja la lógica de negocio, autenticación JWT, permisos jerárquicos y persistencia de datos.
2.  **Frontend (SPA)**: Una aplicación moderna en **React 18** con **TypeScript**. Utiliza **Tailwind CSS** para un diseño premium y **Axios** para la comunicación con la API.
3.  **Comunicación**: Intercambio de datos en formato JSON con interceptores de seguridad para manejo de tokens y errores globales.

---

## 🛠️ Stack Tecnológico

-   **Backend**: Python 3.x, Django 5.1+, DRF, SimpleJWT, Channels (WebSockets).
-   **Frontend**: React, TypeScript, Vite, Tailwind CSS, Lucide React (iconos), React Hot Toast.
-   **Base de Datos**: PostgreSQL (Producción) / SQLite (Desarrollo).
-   **Entorno**: Soporte para variables de entorno via `.env`.

---

## 📊 Estructura de Datos (Modelos Clave)

La base de datos está diseñada de forma relacional:

-   **Usuarios / Perfiles**: Extiende el modelo de Django con datos biográficos y fotos.
-   **Proyectos**: Entidad principal. Tiene un `Dueño` y múltiples `Miembros`.
-   **Sprints**: Iteraciones de tiempo vinculadas a un proyecto. Solo uno puede estar "Activo" a la vez.
-   **Historias de Usuario (HU)**: El corazón del trabajo. Se vinculan a proyectos y opcionalmente a sprints.
-   **Work Items (Tareas y Bugs)**: Tareas técnicas y reportes de errores anidados a las HU.
-   **Invitaciones**: Sistema de gobernanza para añadir colaboradores a proyectos.

---

## 🚀 Funcionalidades Principales

-   **Gestión de Proyectos**: Creación, edición y visibilidad pública/privada.
-   **Tablero Kanban**: Visualización dinámica del estado de las historias en el sprint activo.
-   **Backlog & Planificación**: Gestión de todas las HU y asignación a sprints.
-   **Seguridad Granular**: Los colaboradores solo pueden editar lo que les corresponde; los dueños tienen control total.
-   **Reportes PDF**: Generación de informes de estado con identidad corporativa.
-   **Notificaciones**: Alertas en tiempo real sobre cambios y asignaciones.

---

## 🔄 Flujo Básico del Sistema

1.  **Inicio**: El usuario se registra e inicia sesión.
2.  **Proyecto**: Crea un nuevo proyecto (se convierte en Dueño).
3.  **Equipo**: Invita a otros desarrolladores como "Colaboradores".
4.  **Backlog**: Define Historias de Usuario (HU) con sus puntos de historia.
5.  **Planificación**: Crea un Sprint y arrastra las HU del backlog al sprint.
6.  **Ejecución**: Inicia el Sprint y utiliza el Tablero para mover ítems hasta su finalización.
7.  **Cierre**: Finaliza el sprint y genera reportes de progreso.

---

## ⚠️ Consideraciones Importantes

-   **Permisos**: La mayoría de las acciones de edición requieren que seas miembro del proyecto. El borrado radical suele estar limitado al dueño.
-   **Validación**: Los IDs de proyecto deben enviarse siempre como números enteros en las peticiones API.
-   **Manejo de Errores**: La API devuelve errores en formato `{"error": "mensaje"}`. El frontend captura estos errores y los muestra mediante Toasts automáticos.
-   **CORS**: En desarrollo, el backend permite todas las solicitudes, pero en producción debe configurarse `CORS_ALLOWED_ORIGINS`.

---

*DevGestión - Desarrollado con ❤️ para equipos de alto rendimiento.*
