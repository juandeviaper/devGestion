# DevGestión Backend Formatting Script
# Run this to automatically fix style issues

Write-Host "--- Ejecutando Ruff Format ---" -ForegroundColor Cyan
& .\venv\Scripts\ruff.exe format .

Write-Host "`n--- Ejecutando Ruff Check (Fixing safe issues) ---" -ForegroundColor Cyan
& .\venv\Scripts\ruff.exe check . --fix
