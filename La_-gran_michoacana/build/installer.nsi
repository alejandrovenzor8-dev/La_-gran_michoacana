; Script generado por Electron Builder con soporte para múltiples arquitecturas
!include "MUI2.nsh"
!include "x64.nsh"
!include "FileFunc.nsh"

; Variables
Var /GLOBAL InstallArch
Var /GLOBAL ArchChoice

; Configuración básica
Name "La Gran Michoacana - Instalador Universal"
OutFile "$%TEMP%\installer-temp.exe"
InstallDir "$PROGRAMFILES\La Gran Michoacana"
ShowInstDetails show

; Estilos
!insertmacro MUI_PAGE_WELCOME
Page Custom CustomArchitecturePage ValidateArchitecturePage
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_LANGUAGE "Spanish"

; Detección automática de arquitectura
Function .onInit
  ${If} ${RunningX64}
    ; Sistema es 64 bits
    StrCpy $InstallArch "x64"
    StrCpy $INSTDIR "$PROGRAMFILES64\La Gran Michoacana"
  ${Else}
    ; Sistema es 32 bits
    StrCpy $InstallArch "ia32"
    StrCpy $INSTDIR "$PROGRAMFILES\La Gran Michoacana"
  ${EndIf}
FunctionEnd

; Página personalizada para elegir arquitectura
Function CustomArchitecturePage
  !insertmacro MUI_HEADER_TEXT "Seleccionar Arquitectura" "Elige la versión a instalar"
  
  nsDialogs::Create 1018
  Pop $0
  
  ${If} $0 == error
    Abort
  ${EndIf}
  
  ; Texto informativo
  ${NSD_CreateLabel} 0 0 100% 20u "Esta aplicación está disponible en 32 y 64 bits.$\nSelecciona la versión que deseas instalar:"
  Pop $0
  
  ; Opción 32 bits
  ${NSD_CreateRadioButton} 10u 30u 85u 10u "Versión de 32 bits (ia32)"
  Pop $0
  ${NSD_OnClick} $0 OnClick32
  
  ; Opción 64 bits
  ${NSD_CreateRadioButton} 10u 45u 85u 10u "Versión de 64 bits (x64)"
  Pop $0
  ${NSD_OnClick} $0 OnClick64
  
  ; Seleccionar la recomendada por defecto
  ${If} ${RunningX64}
    ${NSD_Check} $1
    StrCpy $ArchChoice "x64"
  ${Else}
    StrCpy $ArchChoice "ia32"
  ${EndIf}
  
  ; Texto informativo adicional
  ${NSD_CreateLabel} 0 70u 100% 30u "Nota: Se recomienda instalar la versión de 64 bits en sistemas de 64 bits para mejor rendimiento."
  Pop $0
  SetCtlColors $0 0x000000 0xFFFFFF
  
  nsDialogs::Show
FunctionEnd

; Validar selección de arquitectura
Function ValidateArchitecturePage
  ; No hay validación especial necesaria
FunctionEnd

; Manejadores de clic
Function OnClick32
  StrCpy $ArchChoice "ia32"
  StrCpy $InstallArch "ia32"
  StrCpy $INSTDIR "$PROGRAMFILES\La Gran Michoacana"
FunctionEnd

Function OnClick64
  StrCpy $ArchChoice "x64"
  StrCpy $InstallArch "x64"
  StrCpy $INSTDIR "$PROGRAMFILES64\La Gran Michoacana"
FunctionEnd

; Sección de instalación
Section "Instalar"
  SetOutPath "$INSTDIR"
  File /r "${INSTDIR}*.*"
  
  ; Crear accesos directos
  CreateDirectory "$SMPROGRAMS\La Gran Michoacana"
  CreateShortCut "$SMPROGRAMS\La Gran Michoacana\La Gran Michoacana.lnk" "$INSTDIR\La-Gran-Michoacana.exe"
  CreateShortCut "$SMPROGRAMS\La Gran Michoacana\Desinstalar.lnk" "$INSTDIR\uninstall.exe"
  CreateShortCut "$DESKTOP\La Gran Michoacana.lnk" "$INSTDIR\La-Gran-Michoacana.exe"
SectionEnd

; Sección de desinstalación
Section "Uninstall"
  RMDir /r "$INSTDIR"
  RMDir /r "$SMPROGRAMS\La Gran Michoacana"
  Delete "$DESKTOP\La Gran Michoacana.lnk"
SectionEnd
