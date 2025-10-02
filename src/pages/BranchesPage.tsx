/**
 * Branches list page
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBranch } from '@/contexts/BranchContext';
import { BranchCard } from '@/components/branches/BranchCard';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { SearchBar } from '@/components/shared/SearchBar';
import { Button } from '@/components/ui/Button';

export default function BranchesPage() {
  const navigate = useNavigate();
  const { branches, loading, deleteBranch, refreshBranches } = useBranch();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    refreshBranches();
  }, []);

  const filteredBranches = branches?.filter(b =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteBranch(deleteId);
    setDeleteId(null);
  };

  if (loading) {
    return <LoadingState message="Loading branches..." variant="skeleton" />;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Branches</h1>
        <Button onClick={() => navigate('/branches/new?franchiseId=TEMP')}>
          + New Branch
        </Button>
      </div>

      <div className="mb-6">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search branches..."
        />
      </div>

      {!filteredBranches || filteredBranches.length === 0 ? (
        <EmptyState
          icon="📍"
          title="No branches found"
          message={searchQuery ? "No branches match your search." : "Get started by creating your first branch."}
          actionLabel="Create Branch"
          onAction={() => navigate('/branches/new?franchiseId=TEMP')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBranches.map((branch) => (
            <BranchCard
              key={branch.branchId}
              branch={branch}
              onEdit={(id) => navigate(`/branches/${id}/edit`)}
              onDelete={setDeleteId}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Branch"
        message="Are you sure you want to delete this branch? This action cannot be undone and will also delete all associated barbers."
        variant="danger"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
