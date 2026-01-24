import { DollarSign, ShoppingBag, TrendingUp, Users } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function DashboardPage() {
  // Mock data - Reemplazar con datos reales de la API
  const stats = [
    {
      name: 'Ventas de Hoy',
      value: formatCurrency(4250.0),
      change: '+12.5%',
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      name: 'Productos Vendidos',
      value: '142',
      change: '+8.2%',
      icon: ShoppingBag,
      color: 'bg-blue-500',
    },
    {
      name: 'Ticket Promedio',
      value: formatCurrency(29.93),
      change: '+4.1%',
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
    {
      name: 'Clientes',
      value: '87',
      change: '+15.3%',
      icon: Users,
      color: 'bg-pink-500',
    },
  ];

  const recentSales = [
    { id: 1, time: '10:45 AM', items: 3, total: 125.0, cashier: 'María', sucursal: 'Centro' },
    { id: 2, time: '10:38 AM', items: 2, total: 85.0, cashier: 'Juan', sucursal: 'Norte' },
    { id: 3, time: '10:22 AM', items: 5, total: 245.5, cashier: 'María', sucursal: 'Centro' },
    { id: 4, time: '10:15 AM', items: 1, total: 45.0, cashier: 'Carlos', sucursal: 'Sur' },
    { id: 5, time: '10:08 AM', items: 4, total: 180.0, cashier: 'Juan', sucursal: 'Oriente' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600 mt-2">Resumen de actividad de hoy</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-green-600">{stat.change}</span>
              </div>
              <h3 className="text-gray-600 text-sm font-medium">{stat.name}</h3>
              <p className="text-2xl font-bold text-gray-800 mt-2">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Sales */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Ventas Recientes</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Hora</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                  Productos
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Total</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Sucursal</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Cajero</th>
              </tr>
            </thead>
            <tbody>
              {recentSales.map((sale) => (
                <tr key={sale.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-800">{sale.time}</td>
                  <td className="py-3 px-4 text-sm text-gray-800">{sale.items} items</td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-800">
                    {formatCurrency(sale.total)}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{sale.sucursal}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{sale.cashier}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
