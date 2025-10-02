/**
 * ClientQueue - Client queue management page
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useQueue } from '../hooks/useQueue';
import { branchService } from '../services/branchService';
import { NotificationHistory } from '../components/notifications/NotificationHistory';
import type { Branch } from '../types';

export default function ClientQueue() {
  const navigate = useNavigate();
  const { user, firebaseUser } = useAuth();
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);

  const {
    myTicket,
    myTicketLoading,
    queueTickets,
    timeRemaining,
    timeRemainingFormatted,
    takeTicket,
    markArrival,
    cancelTicket,
    taking,
    marking,
    cancelling,
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

  // TODO: Add service and barber selection UI
  // const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  // const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);

  const handleTakeTicket = async () => {
    if (!selectedBranchId) return;

    try {
      await takeTicket({
        branchId: selectedBranchId,
        // serviceId: selectedServiceId || undefined,
        // barberId: selectedBarberId || undefined,
      });
    } catch (err) {
      console.error('Failed to take ticket:', err);
    }
  };

  const handleMarkArrival = async () => {
    if (!myTicket) return;

    try {
      await markArrival({ queueId: myTicket.queueId });
    } catch (err) {
      console.error('Failed to mark arrival:', err);
    }
  };

  const handleCancelTicket = async () => {
    if (!myTicket) return;

    if (!window.confirm('¿Estás seguro de que quieres cancelar tu turno?')) {
      return;
    }

    try {
      await cancelTicket({ queueId: myTicket.queueId });
    } catch (err) {
      console.error('Failed to cancel ticket:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      waiting: 'bg-yellow-100 text-yellow-800',
      notified: 'bg-green-100 text-green-800',
      arrived: 'bg-blue-100 text-blue-800',
      in_service: 'bg-purple-100 text-purple-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      waiting: 'Esperando',
      notified: '¡Tu turno!',
      arrived: 'En sucursal',
      in_service: 'En servicio',
    };
    return texts[status] || status;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Inicia sesión</h2>
          <p className="text-gray-600 mb-4">Debes iniciar sesión para sacar turno</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Ir a Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Cola Virtual</h1>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Branch selection */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seleccionar Sucursal
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

        {/* My ticket */}
        {myTicket ? (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-l-4 border-blue-500">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Tu Turno: {myTicket.ticketNumber}
                </h2>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadge(myTicket.status)}`}>
                  {getStatusText(myTicket.status)}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Posición</p>
                <p className="text-4xl font-bold text-blue-600">{myTicket.position}</p>
              </div>
            </div>

            {/* Timer */}
            {myTicket.timerExpiry && timeRemaining > 0 && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-800 mb-1">
                  {myTicket.status === 'waiting' ? 'Tiempo para llegar' : 'Tiempo para presentarte'}
                </p>
                <p className="text-3xl font-bold text-yellow-900">{timeRemainingFormatted}</p>
              </div>
            )}

            {/* Estimated wait time */}
            {myTicket.status === 'waiting' && myTicket.position > 1 && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-800">Tiempo estimado de espera</p>
                <p className="text-2xl font-bold text-blue-900">{myTicket.estimatedWaitTime} minutos</p>
                <p className="text-xs text-blue-600 mt-1">Aproximadamente {myTicket.position - 1} personas adelante</p>
              </div>
            )}

            {/* Actions */}
            {myTicket.status === 'waiting' && (
              <div className="space-y-3">
                <button
                  onClick={handleMarkArrival}
                  disabled={marking}
                  className="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition"
                >
                  {marking ? 'Marcando...' : '✓ Marcar Llegada a Sucursal'}
                </button>
                <button
                  onClick={handleCancelTicket}
                  disabled={cancelling}
                  className="w-full bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition"
                >
                  {cancelling ? 'Cancelando...' : '✕ Cancelar Turno'}
                </button>
              </div>
            )}

            {myTicket.status === 'notified' && (
              <div className="p-4 bg-green-50 border-2 border-green-500 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-800 mb-2">¡ES TU TURNO!</p>
                <p className="text-green-700">Preséntate en el mostrador ahora</p>
              </div>
            )}

            {myTicket.status === 'arrived' && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                <p className="text-lg font-semibold text-blue-800">Ya estás en la sucursal</p>
                <p className="text-sm text-blue-600">Espera a que te llamen</p>
              </div>
            )}

            {myTicket.status === 'in_service' && (
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg text-center">
                <p className="text-lg font-semibold text-purple-800">Servicio en curso</p>
                <p className="text-sm text-purple-600">Disfruta tu servicio</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Sacar Turno</h2>
            {!selectedBranchId ? (
              <p className="text-gray-600">Selecciona una sucursal para sacar turno</p>
            ) : myTicketLoading ? (
              <p className="text-gray-600">Cargando...</p>
            ) : (
              <>
                <p className="text-gray-600 mb-4">
                  No tienes ningún turno activo en esta sucursal. Saca tu turno ahora para entrar en la cola virtual.
                </p>
                <button
                  onClick={handleTakeTicket}
                  disabled={taking || !selectedBranchId}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition"
                >
                  {taking ? 'Sacando turno...' : '🎫 Sacar Turno'}
                </button>
              </>
            )}
          </div>
        )}

        {/* Notification History */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <NotificationHistory />
        </div>

        {/* Queue status */}
        {selectedBranchId && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Estado de la Cola</h2>
            {queueTickets.length === 0 ? (
              <p className="text-gray-600">No hay personas en cola</p>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-3">
                  {queueTickets.length} {queueTickets.length === 1 ? 'persona' : 'personas'} en cola
                </p>
                {queueTickets.slice(0, 5).map((ticket) => (
                  <div
                    key={ticket.queueId}
                    className={`flex justify-between items-center p-3 rounded-lg border ${
                      ticket.userId === firebaseUser?.uid ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-gray-900">
                        {ticket.ticketNumber}
                        {ticket.userId === firebaseUser?.uid && (
                          <span className="ml-2 text-blue-600 text-sm">(Tú)</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-600">
                        Posición {ticket.position} · {getStatusText(ticket.status)}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(ticket.status)}`}>
                      {ticket.status}
                    </span>
                  </div>
                ))}
                {queueTickets.length > 5 && (
                  <p className="text-sm text-gray-500 text-center mt-3">
                    ... y {queueTickets.length - 5} más
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
