/**
 * Configuración personalizable para la pantalla del cliente
 * Edita estos valores para personalizar la apariencia y comportamiento
 */

export const customerDisplayConfig = {
  // Colores del gradiente de fondo
  gradientFrom: 'from-blue-600',
  gradientTo: 'to-blue-900',

  // Colores de texto
  textPrimary: 'text-white',
  textSecondary: 'text-blue-100',
  textAccent: 'text-yellow-300',

  // Tamaño de fuente (responsive)
  titleSize: 'text-6xl',
  subtitleSize: 'text-2xl',
  itemNameSize: 'text-2xl',
  itemPriceSize: 'text-2xl',
  totalSize: 'text-5xl',

  // Bordes y espaciado
  containerRounding: 'rounded-3xl',
  cardPadding: 'p-8',
  itemSpacing: 'space-y-6',

  // Animaciones
  enableAnimations: true,
  animationDuration: 'duration-300',

  // Comportamiento
  updateInterval: 1000, // milisegundos
  showTimestamp: true,
  autoRefreshOnFocus: true,

  // Mensajes personalizados
  emptyStateEmoji: '🛒',
  emptyStateTitle: 'Sin Items',
  emptyStateSubtitle: 'Selecciona productos para comenzar',
  companyName: 'Super Coldy',
  orderTitle: 'Tu Orden',
};

export type CustomerDisplayConfig = typeof customerDisplayConfig;
