/**
 * Barber Management Page - Admin interface to create/manage barbers
 * Only accessible by super_admin
 */
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import barberService from '@/services/barberService';
import { branchService } from '@/services/branchService';
import type { Barber, Branch } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface NewBarberForm {
  email: string;
  password: string;
  displayName: string;
  branchId: string;
  specialties: string[];
  bio: string;
  photoURL: string;
}

export default function BarberManagementPage() {
  const { user } = useAuth();
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);

  const [formData, setFormData] = useState<NewBarberForm>({
    email: '',
    password: '',
    displayName: '',
    branchId: '',
    specialties: ['haircut'],
    bio: '',
    photoURL: '',
  });

  const [specialtyInput, setSpecialtyInput] = useState('');

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [barbersData, branchesData] = await Promise.all([
        barberService.listBarbers(),
        branchService.list(),
      ]);
      setBarbers(barbersData);
      setBranches(branchesData);

      // Pre-select first branch
      if (branchesData.length > 0 && !formData.branchId) {
        setFormData(prev => ({ ...prev, branchId: branchesData[0].branchId }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBarber = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password || !formData.displayName || !formData.branchId) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    if (formData.password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      setCreating(true);

      const branch = branches.find(b => b.branchId === formData.branchId);
      if (!branch) {
        alert('Sucursal no encontrada');
        return;
      }

      await barberService.createBarber({
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName,
        franchiseId: branch.franchiseId,
        branchId: formData.branchId,
        specialties: formData.specialties,
        bio: formData.bio || undefined,
        photoURL: formData.photoURL || undefined,
      });

      alert('✅ Barbero creado exitosamente');

      // Reset form
      setFormData({
        email: '',
        password: '',
        displayName: '',
        branchId: branches[0]?.branchId || '',
        specialties: ['haircut'],
        bio: '',
        photoURL: '',
      });
      setShowForm(false);

      // Reload barbers
      await loadData();
    } catch (error: any) {
      console.error('Error creating barber:', error);
      alert(`Error creando barbero: ${error.message || 'Error desconocido'}`);
    } finally {
      setCreating(false);
    }
  };

  const addSpecialty = () => {
    if (specialtyInput.trim() && !formData.specialties.includes(specialtyInput.trim())) {
      setFormData({
        ...formData,
        specialties: [...formData.specialties, specialtyInput.trim()],
      });
      setSpecialtyInput('');
    }
  };

  const removeSpecialty = (specialty: string) => {
    setFormData({
      ...formData,
      specialties: formData.specialties.filter(s => s !== specialty),
    });
  };

  const handleDeleteBarber = async (barberId: string) => {
    if (!confirm('¿Estás seguro de que quieres desactivar este barbero?')) {
      return;
    }

    try {
      await barberService.deleteBarber(barberId);
      alert('✅ Barbero desactivado');
      await loadData();
    } catch (error: any) {
      console.error('Error deleting barber:', error);
      alert(`Error: ${error.message || 'Error desconocido'}`);
    }
  };

  const handleEditBarber = (barber: Barber) => {
    setEditingBarber(barber);
    setFormData({
      email: '', // No editable
      password: '', // No editable
      displayName: barber.displayName,
      branchId: barber.branchId,
      specialties: barber.specialties,
      bio: barber.bio || '',
      photoURL: barber.photoURL || '',
    });
    setShowForm(true);
  };

  const handleUpdateBarber = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingBarber) return;

    if (!formData.displayName || !formData.branchId) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      setCreating(true);

      await barberService.updateBarber(editingBarber.barberId, {
        displayName: formData.displayName,
        branchId: formData.branchId,
        specialties: formData.specialties,
        bio: formData.bio || '',
        photoURL: formData.photoURL || '',
      });

      alert('✅ Barbero actualizado exitosamente');

      // Reset form
      setFormData({
        email: '',
        password: '',
        displayName: '',
        branchId: branches[0]?.branchId || '',
        specialties: ['haircut'],
        bio: '',
        photoURL: '',
      });
      setShowForm(false);
      setEditingBarber(null);

      // Reload barbers
      await loadData();
    } catch (error: any) {
      console.error('Error updating barber:', error);
      alert(`Error actualizando barbero: ${error.message || 'Error desconocido'}`);
    } finally {
      setCreating(false);
    }
  };

  const handleCancelEdit = () => {
    setShowForm(false);
    setEditingBarber(null);
    setFormData({
      email: '',
      password: '',
      displayName: '',
      branchId: branches[0]?.branchId || '',
      specialties: ['haircut'],
      bio: '',
      photoURL: '',
    });
  };

  // Check if user is super_admin
  if (user?.role !== 'super_admin') {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-red-800 mb-2">Acceso Denegado</h2>
          <p className="text-red-700">Solo super administradores pueden acceder a esta página.</p>
        </div>
      </div>
    );
  }

  if (loading && barbers.length === 0) {
    return <LoadingState message="Cargando barberos..." variant="skeleton" />;
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Barberos</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{barbers.length} barbero{barbers.length !== 1 && 's'}</p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            if (showForm) {
              handleCancelEdit();
            } else {
              setShowForm(true);
              setEditingBarber(null);
            }
          }}
        >
          {showForm ? 'Cancelar' : '+ Nuevo Barbero'}
        </Button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {editingBarber ? 'Editar Barbero' : 'Crear Nuevo Barbero'}
          </h2>
          <form onSubmit={editingBarber ? handleUpdateBarber : handleCreateBarber} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email (only when creating) */}
              {!editingBarber && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email <span className="text-red-500 dark:text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="barbero@ejemplo.com"
                  required
                />
                </div>
              )}

              {/* Password (only when creating) */}
              {!editingBarber && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contraseña <span className="text-red-500 dark:text-red-400">*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                    required
                  />
                </div>
              )}

              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre Completo <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Juan Pérez"
                  required
                />
              </div>

              {/* Branch */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sucursal <span className="text-red-500 dark:text-red-400">*</span>
                </label>
                <select
                  value={formData.branchId}
                  onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecciona una sucursal</option>
                  {branches.map((branch) => (
                    <option key={branch.branchId} value={branch.branchId}>
                      {branch.name} - {branch.address}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Specialties */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Especialidades
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={specialtyInput}
                  onChange={(e) => setSpecialtyInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSpecialty();
                    }
                  }}
                  className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: haircut, beard, coloring"
                />
                <Button type="button" variant="secondary" onClick={addSpecialty}>
                  Agregar
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.specialties.map((specialty) => (
                  <span
                    key={specialty}
                    className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    {specialty}
                    <button
                      type="button"
                      onClick={() => removeSpecialty(specialty)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Biografía
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Cuéntanos sobre la experiencia y estilo del barbero..."
                rows={3}
              />
            </div>

            {/* Photo URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                URL de Foto
              </label>
              <input
                type="url"
                value={formData.photoURL}
                onChange={(e) => setFormData({ ...formData, photoURL: e.target.value })}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://ejemplo.com/foto.jpg"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="secondary" onClick={handleCancelEdit} disabled={creating}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={creating}>
                {creating
                  ? (editingBarber ? 'Actualizando...' : 'Creando...')
                  : (editingBarber ? 'Actualizar Barbero' : 'Crear Barbero')
                }
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Barbers List */}
      {barbers.length === 0 ? (
        <EmptyState
          icon="✂️"
          title="No hay barberos"
          message="Crea el primer barbero usando el botón de arriba."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {barbers.map((barber) => {
            const branch = branches.find(b => b.branchId === barber.branchId);

            return (
              <div key={barber.barberId} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                {/* Photo */}
                {barber.photoURL && (
                  <div className="mb-4 text-center">
                    <img
                      src={barber.photoURL}
                      alt={barber.displayName}
                      className="w-24 h-24 rounded-full mx-auto object-cover"
                    />
                  </div>
                )}

                {/* Info */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{barber.displayName}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  <span className="font-medium">Sucursal:</span> {branch?.name || 'Desconocida'}
                </p>

                {/* Specialties */}
                <div className="mb-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Especialidades:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {barber.specialties.map(s => (
                      <span key={s} className="bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bio */}
                {barber.bio && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-3">{barber.bio}</p>
                )}

                {/* Status */}
                <div className="flex gap-2 mb-4">
                  <span className={`px-2 py-1 rounded text-xs ${barber.isActive ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'}`}>
                    {barber.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${barber.isAvailable ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300'}`}>
                    {barber.isAvailable ? 'Disponible' : 'No disponible'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEditBarber(barber)}
                    className="flex-1"
                  >
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteBarber(barber.barberId)}
                    className="flex-1"
                  >
                    Desactivar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
