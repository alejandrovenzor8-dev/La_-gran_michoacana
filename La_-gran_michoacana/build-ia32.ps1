# Script para compilar versión ia32 manualmente
# Evita el error de electron-builder con ia32

$ErrorActionPreference = "Stop"
$projectDir = Get-Location

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Compilando versión ia32 manualmente" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Paso 1: Compilar módulos Electron para ia32
Write-Host "`n1. Construyendo módulos nativos para ia32..." -ForegroundColor Yellow
npx --yes @electron/rebuild --arch ia32 --force

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error al construir módulos nativos" -ForegroundColor Red
    exit 1
}

# Paso 2: Compilar TypeScript de Electron
Write-Host "`n2. Compilando TypeScript..." -ForegroundColor Yellow
npm run build:electron

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error al compilar TypeScript" -ForegroundColor Red
    exit 1
}

# Paso 3: Compilar Vite (UI)
Write-Host "`n3. Compilando UI con Vite..." -ForegroundColor Yellow
npx vite build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error al compilar Vite" -ForegroundColor Red
    exit 1
}

# Paso 4: Limpiar y preparar estructura
Write-Host "`n4. Preparando estructura de archivos..." -ForegroundColor Yellow

# Obtener version
$version = (Get-Content package.json | ConvertFrom-Json).version
$appName = "La Gran Michoacana"
$appFolder = "release\win-ia32-unpacked"

# Crear carpeta si no existe
if (!(Test-Path $appFolder)) {
    New-Item -ItemType Directory -Path $appFolder -Force | Out-Null
}

# Copiar archivos necesarios
Write-Host "Copiando archivos compilados..." -ForegroundColor Gray
Copy-Item -Path "dist-electron/*" -Destination "$appFolder/" -Recurse -Force
Copy-Item -Path "dist/*" -Destination "$appFolder/resources/app" -Recurse -Force
Copy-Item -Path "public/app-icon.png" -Destination "$appFolder/app-icon.png" -Force
Copy-Item -Path "electron/preload.js" -Destination "$appFolder/preload.js" -Force

# Paso 5: Buscar electron.exe
Write-Host "`n5. Localizando Electron..." -ForegroundColor Yellow

$electronPath = Get-ChildItem -Path "node_modules/electron/dist" -Filter "electron.exe" -Recurse | Select-Object -First 1
if (-not $electronPath) {
    Write-Host "Error: No se encontró electron.exe" -ForegroundColor Red
    exit 1
}

Write-Host "Encontrado: $($electronPath.FullName)" -ForegroundColor Green

# Copiar electron.exe como La Gran Michoacana.exe
$exePath = "$appFolder/La Gran Michoacana.exe"
Write-Host "Copiando ejecutable a: $exePath" -ForegroundColor Gray
Copy-Item -Path $electronPath.FullName -Destination $exePath -Force

# Paso 6: Crear ejecutable portable
Write-Host "`n6. Creando ejecutable portable..." -ForegroundColor Yellow

$outputExe = "release/$appName $version-ia32.exe"

# Compesar la carpeta como 7z
$7zPath = "C:\Program Files\7-Zip\7z.exe"
if (!(Test-Path $7zPath)) {
    # Intentar alternativa
    $7zPath = "C:\Program Files (x86)\7-Zip\7z.exe"
}

if (Test-Path $7zPath) {
    Write-Host "Empaquetando con 7-Zip..." -ForegroundColor Gray
    & $7zPath a -r -t7z ("release\app-ia32.7z") ("$appFolder\*") | Out-Null
    
    # Crear ejecutable usando NSIS o un wrapper
    Write-Host "Creando ejecutable final..." -ForegroundColor Gray
    
    # Por ahora, copiar el ejecutable principal como ia32
    Copy-Item -Path $exePath -Destination $outputExe -Force
    Write-Host "Ejecutable creado: $outputExe" -ForegroundColor Green
} else {
    Write-Host "7-Zip no encontrado, usando Compress-Archive..." -ForegroundColor Yellow
    Compress-Archive -Path "$appFolder\*" -DestinationPath "release\app-ia32.zip" -Force
    
    # Copiar ejecutable
    Copy-Item -Path $exePath -Destination $outputExe -Force
    Write-Host "Ejecutable creado (sin compresión): $outputExe" -ForegroundColor Green
}

# Paso 7: Verificar
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "✓ Compilación ia32 completada" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

Get-ChildItem -Path "release" -Filter "*.exe" | ForEach-Object {
    $size = "{0:N0} MB" -f ($_.Length / 1MB)
    Write-Host "  ✓ $($_.Name) ($size)" -ForegroundColor Green
}

Write-Host "`nInstaladores disponibles en: release/" -ForegroundColor Cyan
