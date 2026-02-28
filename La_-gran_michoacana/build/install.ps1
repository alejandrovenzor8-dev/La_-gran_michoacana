param(
    [switch]$AutoDetect = $true,
    [string]$Architecture
)

# Colores para la consola
$ErrorColor = 'Red'
$SuccessColor = 'Green'
$InfoColor = 'Cyan'
$WarningColor = 'Yellow'

function Write-ColorOutput($message, $color) {
    Write-Host $message -ForegroundColor $color
}

function Get-SystemArchitecture {
    $is64bit = [Environment]::Is64BitOperatingSystem
    return $is64bit ? 'x64' : 'ia32'
}

function Show-Menu {
    Clear-Host
    Write-ColorOutput "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" $InfoColor
    Write-ColorOutput "   La Gran Michoacana POS - Instalador" $InfoColor
    Write-ColorOutput "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" $InfoColor
    Write-Host ""
    
    $systemArch = Get-SystemArchitecture
    Write-Host "Arquitectura del sistema detectada: " -NoNewline
    Write-ColorOutput $systemArch $SuccessColor
    Write-Host ""
    Write-Host "Selecciona qué versión deseas instalar:"
    Write-Host ""
    Write-Host "  1) Versión de 32 bits (ia32)"
    Write-Host "     Para sistemas de 32 bits o compatibilidad"
    Write-Host ""
    Write-Host "  2) Versión de 64 bits (x64) $(if ($systemArch -eq 'x64') { '⭐ RECOMENDADO' } else { '' })"
    Write-Host "     Para sistemas de 64 bits (mejor rendimiento)"
    Write-Host ""
    Write-Host "  3) Usar la versión recomendada (Autodetectar)"
    Write-Host ""
    Write-Host "  0) Cancelar"
    Write-Host ""
}

function Get-InstallerPath {
    param([string]$arch)
    
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $currentDir = Get-Location
    
    # Intentar encontrar el instalador en diferentes ubicaciones
    $possiblePaths = @(
        (Join-Path $scriptDir "La-Gran-Michoacana-Setup-*-$arch.exe"),
        (Join-Path $scriptDir ".." "release" "La-Gran-Michoacana-Setup-*-$arch.exe"),
        (Join-Path $currentDir "La-Gran-Michoacana-Setup-*-$arch.exe"),
        (Join-Path $currentDir "release" "La-Gran-Michoacana-Setup-*-$arch.exe"),
        (Join-Path $currentDir "La-Gran-Michoacana-Setup-*.exe" | Where-Object { $_ -like "*$arch*" })
    )
    
    foreach ($path in $possiblePaths) {
        $resolved = Resolve-Path $path -ErrorAction SilentlyContinue
        if ($resolved) {
            return $resolved[0].Path
        }
    }
    
    return $null
}

function Start-Installation {
    param([string]$architecture)
    
    Write-Host ""
    Write-ColorOutput "Buscando instalador para arquitectura $architecture..." $InfoColor
    
    $installerPath = Get-InstallerPath -arch $architecture
    
    if (-not $installerPath -or -not (Test-Path $installerPath)) {
        Write-ColorOutput "❌ Error: No se encontró el instalador para $architecture" $ErrorColor
        Write-Host ""
        Write-Host "Ubicaciones buscadas:"
        Write-Host "  - Script directory"
        Write-Host "  - ../release/"
        Write-Host "  - Current directory"
        Write-Host "  - Current directory/release/"
        Write-Host ""
        Write-Host "Por favor, asegúrate de que los instaladores están en la misma carpeta." -ForegroundColor Yellow
        Read-Host "Presiona Enter para continuar"
        return $false
    }
    
    Write-ColorOutput "✓ Instalador encontrado: $(Split-Path -Leaf $installerPath)" $SuccessColor
    Write-Host ""
    Write-ColorOutput "Iniciando instalación..." $InfoColor
    
    try {
        & $installerPath
        Write-ColorOutput "✓ Instalación completada" $SuccessColor
        return $true
    }
    catch {
        Write-ColorOutput "❌ Error al ejecutar el instalador: $_" $ErrorColor
        return $false
    }
}

# Main logic
if ($Architecture) {
    # Modo de línea de comandos
    if ($Architecture -eq "auto") {
        $Architecture = Get-SystemArchitecture
    }
    
    if ($Architecture -notmatch '^(ia32|x64)$') {
        Write-ColorOutput "Arquitectura inválida. Use: ia32, x64 o auto" $ErrorColor
        exit 1
    }
    
    Start-Installation -architecture $Architecture
    exit 0
}

# Modo interactivo
do {
    Show-Menu
    Write-Host -NoNewline "Selecciona una opción (0-3): "
    $choice = Read-Host
    
    switch ($choice) {
        "1" {
            if (Start-Installation -architecture "ia32") {
                break
            }
        }
        "2" {
            if (Start-Installation -architecture "x64") {
                break
            }
        }
        "3" {
            $systemArch = Get-SystemArchitecture
            Write-Host ""
            Write-ColorOutput "Instalando versión recomendada: $systemArch" $InfoColor
            if (Start-Installation -architecture $systemArch) {
                break
            }
        }
        "0" {
            Write-ColorOutput "Instalación cancelada" $WarningColor
            exit 0
        }
        default {
            Write-ColorOutput "❌ Opción inválida. Intenta de nuevo." $ErrorColor
            Start-Sleep -Seconds 2
        }
    }
} while ($true)
