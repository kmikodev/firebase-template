/**
 * Barbers list page
 */
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBarber } from '@/contexts/BarberContext';
import { BarberCard } from '@/components/barbers/BarberCard';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { SearchBar } from '@/components/shared/SearchBar';
import { FilterBar, FilterConfig } from '@/components/shared/FilterBar';
import { Pagination } from '@/components/shared/Pagination';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { SortSelector, SortOption } from '@/components/shared/SortSelector';
import { Button } from '@/components/ui/Button';

const ITEMS_PER_PAGE = 9;

export default function BarbersPage() {
  const navigate = useNavigate();
  const { barbers, loading, deleteBarber, updateBarber, listBarbers } = useBarber();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState('displayName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    listBarbers();
  }, []);

  const filterConfigs: FilterConfig[] = [
    {
      key: 'isAvailable',
      label: 'Availability',
      options: [
        { value: 'true', label: 'Available' },
        { value: 'false', label: 'Unavailable' },
      ],
    },
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
    { value: 'displayName', label: 'Name' },
    { value: 'createdAt', label: 'Date Created' },
  ];

  const filteredBarbers = useMemo(() => {
    let result = barbers || [];

    // Search filter
    if (searchQuery) {
      result = result.filter(b =>
        b.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (b.bio && b.bio.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Active filters
    if (activeFilters.isAvailable) {
      result = result.filter(b => b.isAvailable === (activeFilters.isAvailable === 'true'));
    }
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
  }, [barbers, searchQuery, activeFilters, sortBy, sortDirection]);

  // Pagination
  const totalPages = Math.ceil((filteredBarbers?.length || 0) / ITEMS_PER_PAGE);
  const paginatedBarbers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredBarbers?.slice(start, end);
  }, [filteredBarbers, currentPage]);

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteBarber(deleteId);
    setDeleteId(null);
  };

  const handleToggleAvailability = async (barberId: string, isAvailable: boolean) => {
    await updateBarber(barberId, { isAvailable });
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
    return <LoadingState message="Loading barbers..." variant="skeleton" />;
  }

  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Barbers' }]} />

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Barbers</h1>
          <p className="text-gray-600 mt-1">
            {filteredBarbers?.length || 0} total {filteredBarbers?.length === 1 ? 'barber' : 'barbers'}
          </p>
        </div>
        <Button onClick={() => navigate('/barbers/new?franchiseId=TEMP&branchId=TEMP')}>
          + New Barber
        </Button>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search barbers by name, specialties, or bio..."
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
      {!paginatedBarbers || paginatedBarbers.length === 0 ? (
        <EmptyState
          icon="💈"
          title="No barbers found"
          message={searchQuery || Object.keys(activeFilters).length > 0
            ? "No barbers match your search or filters. Try adjusting your criteria."
            : "Get started by creating your first barber."}
          actionLabel="Create Barber"
          onAction={() => navigate('/barbers/new?franchiseId=TEMP&branchId=TEMP')}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {paginatedBarbers.map((barber) => (
              <BarberCard
                key={barber.barberId}
                barber={barber}
                onEdit={(id) => navigate(`/barbers/${id}/edit`)}
                onDelete={setDeleteId}
                onToggleAvailability={handleToggleAvailability}
              />
            ))}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredBarbers?.length || 0}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </>
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
