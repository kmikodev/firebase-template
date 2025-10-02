/**
 * Franchises list page
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFranchise } from '@/contexts/FranchiseContext';
import { FranchiseCard } from '@/components/franchises/FranchiseCard';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { SearchBar } from '@/components/shared/SearchBar';
import { Button } from '@/components/ui/Button';

export default function FranchisesPage() {
  const navigate = useNavigate();
  const { franchises, loading, deleteFranchise, refreshFranchises } = useFranchise();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    refreshFranchises();
  }, []);

  const filteredFranchises = franchises?.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteFranchise(deleteId);
    setDeleteId(null);
  };

  if (loading) {
    return <LoadingState message="Loading franchises..." variant="skeleton" />;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Franchises</h1>
        <Button onClick={() => navigate('/franchises/new')}>
          + New Franchise
        </Button>
      </div>

      <div className="mb-6">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search franchises..."
        />
      </div>

      {!filteredFranchises || filteredFranchises.length === 0 ? (
        <EmptyState
          icon="🏢"
          title="No franchises found"
          message={searchQuery ? "No franchises match your search." : "Get started by creating your first franchise."}
          actionLabel="Create Franchise"
          onAction={() => navigate('/franchises/new')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFranchises.map((franchise) => (
            <FranchiseCard
              key={franchise.franchiseId}
              franchise={franchise}
              onEdit={(id) => navigate(`/franchises/${id}/edit`)}
              onDelete={setDeleteId}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Franchise"
        message="Are you sure you want to delete this franchise? This action cannot be undone and will also delete all associated branches, barbers, and services."
        variant="danger"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
