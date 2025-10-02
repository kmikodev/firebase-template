/**
 * BarberQueue - Barber queue management page
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useQueue } from '../hooks/useQueue';
import { branchService } from '../services/branchService';
import type { Branch } from '../types';

export default function BarberQueue() {
  const { user, firebaseUser } = useAuth();
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);

  const {
    queueTickets,
    queueLoading,
    advanceQueue,
    advancing,
    error
  } = useQueue({ branchId: selectedBranchId });

  // Load branches
  useEffect(() => {
    branchService.list()
      .then(setBranches)
      .catch(console.error)
      .finally(() => setLoadingBranches(false));
  }, []);

  // Auto-select first branch
  useEffect(() => {
    if (branches.length > 0 && !selectedBranchId) {
      setSelectedBranchId(branches[0].branchId);
    }
  }, [branches, selectedBranchId]);

  const handleCallNext = async () => {
    if (!selectedBranchId) return;

    try {
      await advanceQueue({
        branchId: selectedBranchId,
        barberId: firebaseUser?.uid
      });
    } catch (err) {
      console.error('Failed to advance queue:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      waiting: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      notified: 'bg-green-100 text-green-800 border-green-300',
      arrived: 'bg-blue-100 text-blue-800 border-blue-300',
      in_service: 'bg-purple-100 text-purple-800 border-purple-300',
    };
    return badges[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      waiting: 'Esperando',
      notified: 'Notificado',
      arrived: 'Llegó',
      in_service: 'En servicio',
    };
    return texts[status] || status;
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, string> = {
      waiting: '⏳',
      notified: '🔔',
      arrived: '✓',
      in_service: '💈',
    };
    return icons[status] || '•';
  };

  const nextTicket = queueTickets.find(t => t.status === 'arrived' || t.status === 'waiting');
  const waitingCount = queueTickets.filter(t => t.status === 'waiting').length;
  const arrivedCount = queueTickets.filter(t => t.status === 'arrived').length;
  const notifiedCount = queueTickets.filter(t => t.status === 'notified').length;
  const inServiceCount = queueTickets.filter(t => t.status === 'in_service').length;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Cola</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Peluquero:</span>
            <span className="font-semibold text-gray-900">{user?.displayName || user?.email}</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Branch selection */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sucursal
          </label>
          {loadingBranches ? (
            <p className="text-gray-500">Cargando sucursales...</p>
          ) : (
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecciona una sucursal</option>
              {branches.map((branch) => (
                <option key={branch.branchId} value={branch.branchId}>
                  {branch.name} - {branch.address}
                </option>
              ))}
            </select>
          )}
        </div>

        {selectedBranchId && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
                <p className="text-sm text-gray-600 mb-1">Esperando</p>
                <p className="text-3xl font-bold text-gray-900">{waitingCount}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
                <p className="text-sm text-gray-600 mb-1">Llegaron</p>
                <p className="text-3xl font-bold text-gray-900">{arrivedCount}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
                <p className="text-sm text-gray-600 mb-1">Notificados</p>
                <p className="text-3xl font-bold text-gray-900">{notifiedCount}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-purple-500">
                <p className="text-sm text-gray-600 mb-1">En servicio</p>
                <p className="text-3xl font-bold text-gray-900">{inServiceCount}</p>
              </div>
            </div>

            {/* Next ticket */}
            {nextTicket ? (
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 mb-6 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm opacity-90 mb-1">Siguiente Cliente</p>
                    <p className="text-4xl font-bold mb-2">{nextTicket.ticketNumber}</p>
                    <p className="text-sm opacity-90">
                      Posición {nextTicket.position} · {getStatusText(nextTicket.status)}
                    </p>
                  </div>
                  <button
                    onClick={handleCallNext}
                    disabled={advancing}
                    className="bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-blue-50 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed font-bold text-lg transition shadow-md"
                  >
                    {advancing ? 'Llamando...' : '📢 Llamar Cliente'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6 text-center">
                <p className="text-2xl text-gray-400 mb-2">🎉</p>
                <p className="text-lg font-semibold text-gray-900">No hay clientes en cola</p>
                <p className="text-sm text-gray-600">La cola está vacía</p>
              </div>
            )}

            {/* Queue list */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Cola Completa ({queueTickets.length})
              </h2>

              {queueLoading ? (
                <p className="text-gray-600">Cargando cola...</p>
              ) : queueTickets.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No hay tickets en la cola</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Posición</th>
                        <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Ticket</th>
                        <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Estado</th>
                        <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Espera Est.</th>
                        <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Creado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {queueTickets.map((ticket, index) => (
                        <tr
                          key={ticket.queueId}
                          className={`hover:bg-gray-50 transition ${
                            index === 0 ? 'bg-blue-50' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <span className={`text-lg font-bold ${
                              index === 0 ? 'text-blue-600' : 'text-gray-900'
                            }`}>
                              {ticket.position}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono font-semibold text-gray-900">
                              {ticket.ticketNumber}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(ticket.status)}`}>
                              <span>{getStatusIcon(ticket.status)}</span>
                              <span>{getStatusText(ticket.status)}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {ticket.estimatedWaitTime} min
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {ticket.createdAt?.toDate().toLocaleTimeString('es-AR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
