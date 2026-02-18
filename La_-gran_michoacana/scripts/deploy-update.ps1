# Script de Deploy de Actualización a Railway
# La Michoacana POS - La Gran Michoacana

param(
    [Parameter(Mandatory=$true)]
    [string]$Version
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "🚀 =================================================" -ForegroundColor Cyan
Write-Host "   Deploy de Actualización v$Version" -ForegroundColor Cyan
Write-Host "   La Michoacana POS - La Gran Michoacana" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el directorio correcto
if (!(Test-Path "package.json")) {
    Write-Host "❌ Error: Ejecuta este script desde La_-gran_michoacana/" -ForegroundColor Red
    exit 1
}

# Paso 1: Actualizar version en package.json
Write-Host "📝 Paso 1/5: Actualizando versión en package.json..." -ForegroundColor Yellow
npm version $Version --no-git-tag-version
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al actualizar versión" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Versión actualizada a $Version" -ForegroundColor Green

# Paso 2: Build Electron
Write-Host ""
Write-Host "🔨 Paso 2/5: Compilando código de Electron..." -ForegroundColor Yellow
npm run build:electron
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al compilar Electron" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Código de Electron compilado" -ForegroundColor Green

# Paso 3: Build Vite
Write-Host ""
Write-Host "⚡ Paso 3/5: Compilando aplicación con Vite..." -ForegroundColor Yellow
npm run build:vite
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al compilar con Vite" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Aplicación compilada con Vite" -ForegroundColor Green

# Paso 4: Crear instalador
Write-Host ""
Write-Host "📦 Paso 4/5: Creando instalador con electron-builder..." -ForegroundColor Yellow
npx electron-builder --win --x64
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al crear instalador" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Instalador creado exitosamente" -ForegroundColor Green

# Paso 5: Mostrar archivos generados
Write-Host ""
Write-Host "📋 Paso 5/5: Archivos generados:" -ForegroundColor Yellow
Write-Host ""

Get-ChildItem "release" -Filter "*.exe" | ForEach-Object {
    $size = [math]::Round($_.Length / 1MB, 2)
    Write-Host "  📄 $($_.Name) - $size MB" -ForegroundColor Cyan
}

if (Test-Path "release/latest.yml") {
    Write-Host "  📄 latest.yml" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "✅ Build completado exitosamente!" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Instrucciones finales
Write-Host "📤 Próximos pasos para publicar:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Copiar archivos al servidor de actualizaciones:" -ForegroundColor White
Write-Host "   cd ..\packages\update-server\releases\" -ForegroundColor Gray
Write-Host "   copy ..\..\La_-gran_michoacana\release\*.exe ." -ForegroundColor Gray
Write-Host "   copy ..\..\La_-gran_michoacana\release\latest.yml ." -ForegroundColor Gray
Write-Host ""
Write-Host "2. Desplegar a Railway:" -ForegroundColor White
Write-Host "   cd ..\packages\update-server" -ForegroundColor Gray
Write-Host "   railway up" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Verificar que latest.yml sea accesible:" -ForegroundColor White
Write-Host "   https://tu-dominio.railway.app/latest.yml" -ForegroundColor Gray
Write-Host ""

# Preguntar si quiere abrir la carpeta de release
$openFolder = Read-Host "¿Abrir carpeta de release? (S/N)"
if ($openFolder -eq "S" -or $openFolder -eq "s") {
    Invoke-Item "release"
}

Write-Host ""
Write-Host "🎉 ¡Listo para publicar!" -ForegroundColor Green
Write-Host ""
