; Script NSIS personalizado para detectar arquitectura del sistema
; Este script se incluye automáticamente en el instalador NSIS

!macro customInit
  ; Detectar si el sistema es de 64 bits
  ${If} ${RunningX64}
    ; Sistema de 64 bits - usar la versión x64
    StrCpy $INSTDIR "$PROGRAMFILES64\${PRODUCT_NAME}"
  ${Else}
    ; Sistema de 32 bits - usar la versión ia32
    StrCpy $INSTDIR "$PROGRAMFILES\${PRODUCT_NAME}"
  ${EndIf}
!macroend

!macro preInit
  ; Verificar compatibilidad del sistema
  SetRegView 64
  ${If} ${RunningX64}
    ; En sistemas de 64 bits, puede instalar cualquier versión
    DetailPrint "Sistema de 64 bits detectado - instalando versión x64"
  ${Else}
    ; En sistemas de 32 bits, solo puede instalar la versión de 32 bits
    DetailPrint "Sistema de 32 bits detectado - instalando versión x86"
  ${EndIf}
!macroend
