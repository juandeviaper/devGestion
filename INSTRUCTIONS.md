# 🚀 DevGestión - Guía de Instalación Local

Esta guía te ayudará a levantar el entorno de desarrollo de **DevGestión** (SaaS de Gestión Ágil) en tu máquina local.

## 🛠 Requisitos Previos
- **Node.js** (v18 o superior)
- **Python** (v3.10 o superior)
- **PostgreSQL** (Corriendo localmente)

---

## 🎨 1. Configuración del Frontend (React + Vite)

El frontend está construido con React, Tailwind CSS y Lucide Icons.

1. Navega a la carpeta del frontend:
   ```bash
   cd frontend
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
   *El frontend estará disponible en `http://localhost:5173`*

---

## ⚙️ 2. Configuración del Backend (Django REST Framework)

El backend maneja la lógica de negocio, autenticación JWT y la API.

1. Navega a la carpeta del backend:
   ```bash
   cd backend
   ```
2. Crea un entorno virtual:
   ```bash
   python -m venv venv
   ```
3. Activa el entorno virtual:
   - **Windows:** `venv\Scripts\activate`
   - **Mac/Linux:** `source venv/bin/activate`
4. Instala las dependencias:
   ```bash
   pip install -r requirements.txt
   ```
5. Configura la base de datos en `core/settings.py` (o usa variables de entorno).
6. Ejecuta las migraciones:
   ```bash
   python manage.py migrate
   ```
7. Inicia el servidor:
   ```bash
   python manage.py runserver
   ```
   *La API estará disponible en `http://localhost:8000`*

---

## 🚀 3. Notas de Uso
- **Credenciales**: Puedes crear un superusuario con `python manage.py createsuperuser`.
- **Nuevas Funcionalidades**: Hoy hemos integrado el sistema de **T-Shirt Sizing** y el **Sprint Planning** masivo. Todo está listo para usar en el módulo de Proyectos.

---

¡Disfruta construyendo con DevGestión! 🚀
