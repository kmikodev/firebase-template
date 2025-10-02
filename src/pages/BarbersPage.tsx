/**
 * Barbers list page
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBarber } from '@/contexts/BarberContext';
import { BarberCard } from '@/components/barbers/BarberCard';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { SearchBar } from '@/components/shared/SearchBar';
import { Button } from '@/components/ui/Button';

export default function BarbersPage() {
  const navigate = useNavigate();
  const { barbers, loading, deleteBarber, updateBarber, listBarbers } = useBarber();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    listBarbers();
  }, []);

  const filteredBarbers = barbers?.filter(b =>
    b.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteBarber(deleteId);
    setDeleteId(null);
  };

  const handleToggleAvailability = async (barberId: string, isAvailable: boolean) => {
    await updateBarber(barberId, { isAvailable });
  };

  if (loading) {
    return <LoadingState message="Loading barbers..." variant="skeleton" />;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Barbers</h1>
        <Button onClick={() => navigate('/barbers/new?franchiseId=TEMP&branchId=TEMP')}>
          + New Barber
        </Button>
      </div>

      <div className="mb-6">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search barbers..."
        />
      </div>

      {!filteredBarbers || filteredBarbers.length === 0 ? (
        <EmptyState
          icon="💈"
          title="No barbers found"
          message={searchQuery ? "No barbers match your search." : "Get started by creating your first barber."}
          actionLabel="Create Barber"
          onAction={() => navigate('/barbers/new?franchiseId=TEMP&branchId=TEMP')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBarbers.map((barber) => (
            <BarberCard
              key={barber.barberId}
              barber={barber}
              onEdit={(id) => navigate(`/barbers/${id}/edit`)}
              onDelete={setDeleteId}
              onToggleAvailability={handleToggleAvailability}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Barber"
        message="Are you sure you want to delete this barber? This action cannot be undone."
        variant="danger"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
