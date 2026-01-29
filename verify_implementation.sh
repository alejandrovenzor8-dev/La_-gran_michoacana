#!/bin/bash
# Script de verificación - Pantalla Dual POS
# Ejecuta esto para verificar que todo está correctamente implementado

echo "🔍 Verificando implementación de Pantalla Dual..."
echo ""

# Contador de archivos encontrados
FOUND=0
TOTAL=0

# Función para verificar archivo
check_file() {
    TOTAL=$((TOTAL + 1))
    if [ -f "$1" ]; then
        echo "✅ $2"
        FOUND=$((FOUND + 1))
    else
        echo "❌ $2"
        echo "   FALTA: $1"
    fi
}

# Función para verificar que un archivo contiene un texto
check_content() {
    TOTAL=$((TOTAL + 1))
    if grep -q "$2" "$1" 2>/dev/null; then
        echo "✅ $3"
        FOUND=$((FOUND + 1))
    else
        echo "❌ $3"
        echo "   FALTA en: $1"
    fi
}

echo "📁 Verificando Archivos Creados:"
echo "================================"
check_file "apps/frontend/src/pages/CustomerDisplayPage.tsx" "Página Cliente"
check_file "apps/frontend/src/lib/customerDisplay.ts" "Utilidades de Ventana"
check_file "apps/frontend/src/lib/useLocalStorage.ts" "Hook LocalStorage"
check_file "apps/frontend/src/config/customerDisplay.config.ts" "Configuración"
check_file "CUSTOMER_DISPLAY_GUIDE.md" "Guía de Usuario"
check_file "IMPLEMENTATION.md" "Documentación Técnica"
check_file "QUICK_START.md" "Guía Rápida"

echo ""
echo "🔄 Verificando Modificaciones:"
echo "=============================="
check_content "apps/frontend/src/App.tsx" "/customer-display" "Ruta agregada a App.tsx"
check_content "apps/frontend/src/App.tsx" "CustomerDisplayPage" "Importación de CustomerDisplayPage"
check_content "apps/frontend/src/store/cartStore.ts" "persist" "Persistencia en cartStore"
check_content "apps/frontend/src/pages/POSPage.tsx" "openCustomerDisplayHandler" "Funciones de manejo de ventana"
check_content "apps/frontend/src/pages/POSPage.tsx" "Monitor" "Ícono de monitor en POSPage"

echo ""
echo "📊 Resultado:"
echo "============="
echo "Verificaciones pasadas: $FOUND/$TOTAL"

if [ "$FOUND" -eq "$TOTAL" ]; then
    echo "✨ ¡PERFECTO! Toda la implementación está completa."
else
    echo "⚠️  Faltan algunas verificaciones. Revisa los archivos faltantes."
fi

echo ""
echo "🚀 Próximos pasos:"
echo "=================="
echo "1. Ejecuta: pnpm dev"
echo "2. Ve a: http://localhost:5173/pos"
echo "3. Haz clic en: 'Abrir Pantalla Cliente'"
echo "4. Agrega productos al carrito"
echo "5. ¡Verás la sincronización en tiempo real!"
echo ""
echo "📚 Para más info, lee:"
echo "  - QUICK_START.md (inicio rápido)"
echo "  - CUSTOMER_DISPLAY_GUIDE.md (guía completa)"
echo "  - IMPLEMENTATION.md (detalles técnicos)"
