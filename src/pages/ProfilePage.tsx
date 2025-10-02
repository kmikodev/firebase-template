/**
 * ProfilePage - User profile with loyalty points and queue history
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

interface LoyaltyTransaction {
  transactionId: string;
  userId: string;
  points: number;
  reason: string;
  queueId: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: Date;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, firebaseUser, signOut } = useAuth();
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseUser) return;

    // Load loyalty transactions
    const loadTransactions = async () => {
      try {
        const transactionsRef = collection(db, 'loyaltyTransactions');
        const q = query(
          transactionsRef,
          where('userId', '==', firebaseUser.uid),
          orderBy('createdAt', 'desc'),
          limit(50)
        );

        const snapshot = await getDocs(q);
        const txs = snapshot.docs.map(doc => ({
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
        })) as LoyaltyTransaction[];

        setTransactions(txs);
      } catch (error) {
        console.error('Error loading transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, [firebaseUser]);

  const getReasonText = (reason: string) => {
    const reasons: Record<string, string> = {
      completed_service: '✅ Servicio completado',
      no_show: '❌ No se presentó',
      expired: '⏰ Tiempo agotado',
      late_cancellation: '🚫 Cancelación tardía',
    };
    return reasons[reason] || reason;
  };

  const getReasonColor = (points: number) => {
    if (points > 0) return 'text-green-600';
    if (points < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Inicia sesión</h2>
          <p className="text-gray-600 mb-4">Debes iniciar sesión para ver tu perfil</p>
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
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-16 h-16 rounded-full border-2 border-gray-200"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user.displayName || 'Usuario'}</h1>
                <p className="text-sm text-gray-600">{user.email}</p>
                {user.phoneNumber && (
                  <p className="text-sm text-gray-600">{user.phoneNumber}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              Cerrar Sesión
            </button>
          </div>

          {/* Role Badge */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Rol:</span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              user.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
              user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
              user.role === 'barber' ? 'bg-green-100 text-green-800' :
              user.role === 'client' ? 'bg-gray-100 text-gray-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {user.role === 'super_admin' ? '👑 Super Admin' :
               user.role === 'admin' ? '🔧 Administrador' :
               user.role === 'barber' ? '💈 Barbero' :
               user.role === 'client' ? '👤 Cliente' :
               '👻 Invitado'}
            </span>
          </div>
        </div>

        {/* Loyalty Points */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Puntos de Lealtad</p>
              <p className="text-5xl font-bold">{user.queuePoints}</p>
              <p className="text-sm opacity-75 mt-2">
                {user.queuePoints >= 0
                  ? '✨ Buen comportamiento'
                  : '⚠️ Completa turnos para recuperar puntos'}
              </p>
            </div>
            <div className="text-6xl opacity-20">
              🏆
            </div>
          </div>
        </div>

        {/* Queue History Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
            <p className="text-sm text-gray-600 mb-1">Completados</p>
            <p className="text-3xl font-bold text-gray-900">{user.queueHistory.totalCompleted}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500">
            <p className="text-sm text-gray-600 mb-1">No Shows</p>
            <p className="text-3xl font-bold text-gray-900">{user.queueHistory.totalNoShows}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
            <p className="text-sm text-gray-600 mb-1">Expirados</p>
            <p className="text-3xl font-bold text-gray-900">{user.queueHistory.totalExpired}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-gray-500">
            <p className="text-sm text-gray-600 mb-1">Cancelados</p>
            <p className="text-3xl font-bold text-gray-900">{user.queueHistory.totalCancelled}</p>
          </div>
        </div>

        {/* Loyalty Transactions History */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Historial de Puntos</h2>

          {loading ? (
            <p className="text-gray-600">Cargando historial...</p>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No hay transacciones de puntos</p>
              <p className="text-sm text-gray-500 mt-2">
                Los puntos se actualizan cuando completas o cancelas turnos
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.transactionId}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {getReasonText(tx.reason)}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {tx.createdAt?.toLocaleString('es-AR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  <div className="text-right ml-4">
                    <p className={`text-2xl font-bold ${getReasonColor(tx.points)}`}>
                      {tx.points > 0 ? '+' : ''}{tx.points}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Balance: {tx.balanceBefore} → {tx.balanceAfter}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Sistema de Puntos</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p>• <strong>+1 punto</strong> por cada servicio completado</p>
            <p>• <strong>-3 puntos</strong> por no presentarte (no-show)</p>
            <p>• <strong>-3 puntos</strong> si tu turno expira (timer agotado)</p>
            <p>• <strong>-5 puntos</strong> por cancelación tardía</p>
            <p className="mt-3 font-medium">⚠️ No puedes sacar turnos con puntos negativos</p>
          </div>
        </div>
      </div>
    </div>
  );
}
