@echo off
REM Script para instalar La Gran Michoacana POS
REM Este script detecta la arquitectura del sistema y permite al usuario elegir

setlocal enabledelayedexpansion
cd /d "%~dp0"

:menu
cls
echo.
echo ========================================
echo    La Gran Michoacana POS - Instalador
echo ========================================
echo.

REM Detectar arquitectura del sistema
if "%PROCESSOR_ARCHITECTURE%"=="AMD64" (
    set SYSTEM_ARCH=64 bits
    set ARCH_CMD=x64
) else if "%PROCESSOR_ARCHITECTURE%"=="x86" (
    set SYSTEM_ARCH=32 bits
    set ARCH_CMD=ia32
) else (
    set SYSTEM_ARCH=desconocida
    set ARCH_CMD=desconocido
)

echo Arquitectura del sistema detectada: %SYSTEM_ARCH%
echo.
echo Selecciona que version deseas instalar:
echo.
echo   1) Version de 32 bits ^(ia32^)
echo      Para sistemas de 32 bits o compatibilidad
echo.
echo   2) Version de 64 bits ^(x64^) 
if "%ARCH_CMD%"=="x64" (
    echo      Para sistemas de 64 bits ^(RECOMENDADO^)
) else (
    echo      Para sistemas de 64 bits
)
echo.
echo   3) Usar la version recomendada ^(Autodetectar^)
echo.
echo   0) Cancelar
echo.
set /p choice="Selecciona una opcion (0-3): "

if "%choice%"=="1" (
    set INSTALL_ARCH=ia32
    goto install
) else if "%choice%"=="2" (
    set INSTALL_ARCH=x64
    goto install
) else if "%choice%"=="3" (
    set INSTALL_ARCH=%ARCH_CMD%
    goto install
) else if "%choice%"=="0" (
    echo.
    echo Instalacion cancelada.
    goto end
) else (
    echo.
    echo Opcion invalida. Intenta de nuevo.
    timeout /t 2 /nobreak
    goto menu
)

:install
cls
echo.
echo Buscando instalador para arquitectura %INSTALL_ARCH%...
echo.

REM Buscar el instalador en diferentes ubicaciones
set INSTALLER_FOUND=0

REM Directorio actual
for %%f in (La-Gran-Michoacana-Setup-*-%INSTALL_ARCH%.exe) do (
    if exist "%%f" (
        set INSTALLER_PATH=%%f
        set INSTALLER_FOUND=1
        goto found_installer
    )
)

REM Subdirectorio release
for %%f in (release\La-Gran-Michoacana-Setup-*-%INSTALL_ARCH%.exe) do (
    if exist "%%f" (
        set INSTALLER_PATH=%%f
        set INSTALLER_FOUND=1
        goto found_installer
    )
)

REM Directorio padre/release
cd ..
for %%f in (release\La-Gran-Michoacana-Setup-*-%INSTALL_ARCH%.exe) do (
    if exist "%%f" (
        set INSTALLER_PATH=%%f
        set INSTALLER_FOUND=1
        goto found_installer
    )
)

:installer_not_found
echo Error: No se encontro el instalador para %INSTALL_ARCH%
echo.
echo Las siguientes ubicaciones fueron buscadas:
echo   - Directorio actual
echo   - Subdirectorio release\
echo   - Directorio padre/release\
echo.
echo Por favor, asegura que los instaladores esten en la misma carpeta.
echo.
pause
goto menu

:found_installer
echo Instalador encontrado: %INSTALLER_PATH%
echo.
echo Iniciando instalacion...
echo.

REM Ejecutar el instalador
start "" "%INSTALLER_PATH%"

REM Esperar a que se complete
timeout /t 2 /nobreak
echo.
echo Instalacion completada.
echo.
goto end

:end
pause
exit /b 0
