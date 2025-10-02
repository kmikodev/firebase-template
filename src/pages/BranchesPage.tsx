/**
 * Branches list page
 */
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBranch } from '@/contexts/BranchContext';
import { BranchCard } from '@/components/branches/BranchCard';
import { BranchListView } from '@/components/branches/BranchListView';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { SearchBar } from '@/components/shared/SearchBar';
import { FilterBar, FilterConfig } from '@/components/shared/FilterBar';
import { Pagination } from '@/components/shared/Pagination';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { SortSelector, SortOption } from '@/components/shared/SortSelector';
import { ViewToggle, ViewMode } from '@/components/shared/ViewToggle';
import { ExportButton } from '@/components/shared/ExportButton';
import { Button } from '@/components/ui/Button';

const ITEMS_PER_PAGE = 9;

export default function BranchesPage() {
  const navigate = useNavigate();
  const { branches, loading, deleteBranch, refreshBranches } = useBranch();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  useEffect(() => {
    refreshBranches();
  }, []);

  const filterConfigs: FilterConfig[] = [
    {
      key: 'isActive',
      label: 'Status',
      options: [
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' },
      ],
    },
  ];

  const sortOptions: SortOption[] = [
    { value: 'name', label: 'Name' },
    { value: 'city', label: 'City' },
    { value: 'address', label: 'Address' },
    { value: 'createdAt', label: 'Date Created' },
  ];

  const filteredBranches = useMemo(() => {
    let result = branches || [];

    // Search filter
    if (searchQuery) {
      result = result.filter(b =>
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Active filters
    if (activeFilters.isActive) {
      result = result.filter(b => b.isActive === (activeFilters.isActive === 'true'));
    }

    // Sorting
    result.sort((a, b) => {
      let aValue: any = a[sortBy as keyof typeof a];
      let bValue: any = b[sortBy as keyof typeof b];

      // Handle Firestore Timestamps
      if (sortBy === 'createdAt' && aValue?.toDate && bValue?.toDate) {
        aValue = aValue.toDate().getTime();
        bValue = bValue.toDate().getTime();
      }

      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [branches, searchQuery, activeFilters, sortBy, sortDirection]);

  // Pagination
  const totalPages = Math.ceil((filteredBranches?.length || 0) / ITEMS_PER_PAGE);
  const paginatedBranches = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredBranches?.slice(start, end);
  }, [filteredBranches, currentPage]);

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteBranch(deleteId);
    setDeleteId(null);
  };

  const handleFilterChange = (filters: Record<string, string>) => {
    setActiveFilters(filters);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  if (loading) {
    return <LoadingState message="Loading branches..." variant="skeleton" />;
  }

  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Branches' }]} />

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Branches</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {filteredBranches?.length || 0} total {filteredBranches?.length === 1 ? 'branch' : 'branches'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton data={filteredBranches || []} filename="branches" />
          <ViewToggle view={viewMode} onChange={setViewMode} />
          <Button onClick={() => navigate('/branches/new?franchiseId=TEMP')}>
            + New Branch
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search branches by name, city, or address..."
        />
      </div>

      {/* Filter Bar and Sort */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <FilterBar
          filters={filterConfigs}
          onFilterChange={handleFilterChange}
          onReset={() => setSearchQuery('')}
        />
        <SortSelector
          options={sortOptions}
          value={sortBy}
          direction={sortDirection}
          onChange={setSortBy}
          onDirectionChange={setSortDirection}
        />
      </div>

      {/* Content */}
      {!paginatedBranches || paginatedBranches.length === 0 ? (
        <EmptyState
          icon="📍"
          title="No branches found"
          message={searchQuery || Object.keys(activeFilters).length > 0
            ? "No branches match your search or filters. Try adjusting your criteria."
            : "Get started by creating your first branch."}
          actionLabel="Create Branch"
          onAction={() => navigate('/branches/new?franchiseId=TEMP')}
        />
      ) : (
        <>
          {/* Grid or List View */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {paginatedBranches.map((branch) => (
                <BranchCard
                  key={branch.branchId}
                  branch={branch}
                  onEdit={(id) => navigate(`/branches/${id}/edit`)}
                  onDelete={setDeleteId}
                />
              ))}
            </div>
          ) : (
            <div className="mb-6">
              <BranchListView
                branches={paginatedBranches}
                onEdit={(id) => navigate(`/branches/${id}/edit`)}
                onDelete={setDeleteId}
              />
            </div>
          )}

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredBranches?.length || 0}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </>
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
