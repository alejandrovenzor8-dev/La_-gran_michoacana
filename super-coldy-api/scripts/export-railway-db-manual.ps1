# Script para exportar base de datos de Railway usando URL directa
# Uso: .\scripts\export-railway-db-manual.ps1

Write-Host "🚂 Exportación Manual de Base de Datos Railway" -ForegroundColor Cyan
Write-Host "===============================================`n" -ForegroundColor Cyan

Write-Host "📋 Necesitas la URL de conexión de tu base de datos Railway" -ForegroundColor Yellow
Write-Host "La puedes encontrar en:" -ForegroundColor Gray
Write-Host "  1. Ve a railway.app" -ForegroundColor Gray
Write-Host "  2. Selecciona tu proyecto" -ForegroundColor Gray
Write-Host "  3. Click en el servicio PostgreSQL" -ForegroundColor Gray
Write-Host "  4. Ve a la pestaña 'Variables'" -ForegroundColor Gray
Write-Host "  5. Copia el valor de DATABASE_URL`n" -ForegroundColor Gray

$databaseUrl = Read-Host "Pega aquí la DATABASE_URL de Railway"

if ([string]::IsNullOrWhiteSpace($databaseUrl)) {
    Write-Host "`n❌ No se proporcionó URL de base de datos" -ForegroundColor Red
    exit 1
}

# Verificar si pg_dump está instalado
$pgDumpInstalled = Get-Command pg_dump -ErrorAction SilentlyContinue
if (-not $pgDumpInstalled) {
    Write-Host "`n❌ pg_dump no está instalado" -ForegroundColor Red
    Write-Host "💡 Instala PostgreSQL client tools desde:" -ForegroundColor Yellow
    Write-Host "   https://www.postgresql.org/download/windows/`n" -ForegroundColor Cyan
    exit 1
}

# Fecha para el nombre del archivo
$fecha = Get-Date -Format "yyyy-MM-dd_HHmmss"
$backupFile = "backup_railway_$fecha.sql"

Write-Host "`n💾 Creando backup..." -ForegroundColor Yellow
Write-Host "Archivo: $backupFile`n" -ForegroundColor Gray

# Ejecutar pg_dump
try {
    Write-Host "⚙️ Ejecutando pg_dump..." -ForegroundColor Yellow
    Write-Host "Este proceso puede tardar varios minutos dependiendo del tamaño de tu BD`n" -ForegroundColor Gray
    
    pg_dump $databaseUrl -f $backupFile 2>&1 | Out-Null
    
    if (Test-Path $backupFile) {
        $size = (Get-Item $backupFile).Length / 1MB
        Write-Host "✅ ¡Backup creado exitosamente!" -ForegroundColor Green
        Write-Host "`n📁 Archivo: $backupFile" -ForegroundColor Cyan
        Write-Host "📊 Tamaño: $([math]::Round($size, 2)) MB" -ForegroundColor Cyan
        
        Write-Host "`n💡 Para restaurar este backup:" -ForegroundColor Yellow
        Write-Host "   psql `"TU_DATABASE_URL`" < $backupFile" -ForegroundColor Gray
        
        Write-Host "`n💡 Para importar a base de datos local:" -ForegroundColor Yellow
        Write-Host "   psql -U postgres -d supercoldy_pos < $backupFile" -ForegroundColor Gray
    }
    else {
        Write-Host "❌ Error: El archivo de backup no se creó" -ForegroundColor Red
        exit 1
    }
}
catch {
    Write-Host "`n❌ Error al crear el backup: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n===============================================" -ForegroundColor Cyan
Write-Host "✅ Proceso completado" -ForegroundColor Green
