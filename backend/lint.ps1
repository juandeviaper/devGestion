# DevGestión Backend Linting Script
# Run this to check for style and logic issues

Write-Host "--- Ejecutando Ruff Check ---" -ForegroundColor Cyan
& .\venv\Scripts\ruff.exe check .

Write-Host "`n--- Ejecutando Pyright Type Check ---" -ForegroundColor Cyan
& npx pyright
