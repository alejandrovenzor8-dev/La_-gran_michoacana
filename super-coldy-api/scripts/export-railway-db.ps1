# Script para exportar base de datos de Railway
# Uso: .\scripts\export-railway-db.ps1

Write-Host "🚂 Exportación de Base de Datos Railway" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Verificar si Railway CLI está instalado
$railwayInstalled = Get-Command railway -ErrorAction SilentlyContinue
if (-not $railwayInstalled) {
    Write-Host "❌ Railway CLI no está instalado" -ForegroundColor Red
    Write-Host "`n📥 Instalando Railway CLI..." -ForegroundColor Yellow
    Write-Host "Ejecuta: npm install -g @railway/cli`n" -ForegroundColor Gray
    
    $install = Read-Host "¿Deseas instalarlo ahora? (s/n)"
    if ($install -eq 's') {
        npm install -g @railway/cli
    }
    else {
        Write-Host "`n❌ Instalación cancelada" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Railway CLI encontrado`n" -ForegroundColor Green

# Autenticación
Write-Host "🔐 Verificando autenticación..." -ForegroundColor Yellow
railway whoami 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ No estás autenticado en Railway" -ForegroundColor Red
    Write-Host "`n📝 Autenticándote..." -ForegroundColor Yellow
    railway login
}

Write-Host "`n✅ Autenticado correctamente`n" -ForegroundColor Green

# Listar servicios
Write-Host "📋 Servicios disponibles:" -ForegroundColor Yellow
railway service

# Fecha para el nombre del archivo
$fecha = Get-Date -Format "yyyy-MM-dd_HHmmss"
$backupFile = "backup_railway_$fecha.sql"

Write-Host "`n💾 Creando backup..." -ForegroundColor Yellow
Write-Host "Archivo: $backupFile" -ForegroundColor Gray

# Ejecutar pg_dump a través de Railway
Write-Host "`n⚙️ Ejecutando pg_dump..." -ForegroundColor Yellow
railway run pg_dump `$DATABASE_URL > $backupFile

if ($LASTEXITCODE -eq 0) {
    $size = (Get-Item $backupFile).Length / 1MB
    Write-Host "`n✅ ¡Backup creado exitosamente!" -ForegroundColor Green
    Write-Host "📁 Archivo: $backupFile" -ForegroundColor Cyan
    Write-Host "📊 Tamaño: $([math]::Round($size, 2)) MB" -ForegroundColor Cyan
    Write-Host "`n💡 Puedes restaurar este backup usando:" -ForegroundColor Yellow
    Write-Host "   psql `$DATABASE_URL < $backupFile" -ForegroundColor Gray
}
else {
    Write-Host "`n❌ Error al crear el backup" -ForegroundColor Red
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✅ Proceso completado" -ForegroundColor Green
