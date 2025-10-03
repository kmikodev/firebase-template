/**
 * Franchises list page
 */
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFranchise } from '@/contexts/FranchiseContext';
import { FranchiseCard } from '@/components/franchises/FranchiseCard';
import { FranchiseListView } from '@/components/franchises/FranchiseListView';
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

export default function FranchisesPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { franchises, loading, deleteFranchise, refreshFranchises } = useFranchise();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  useEffect(() => {
    refreshFranchises();
  }, []);

  const filterConfigs: FilterConfig[] = [
    {
      key: 'planTier',
      label: t('franchises.filters.planTier'),
      options: [
        { value: 'free', label: t('franchises.planTiers.free') },
        { value: 'basic', label: t('franchises.planTiers.basic') },
        { value: 'premium', label: t('franchises.planTiers.premium') },
        { value: 'enterprise', label: t('franchises.planTiers.enterprise') },
      ],
    },
    {
      key: 'isActive',
      label: t('franchises.filters.status'),
      options: [
        { value: 'true', label: t('common.active') },
        { value: 'false', label: t('common.inactive') },
      ],
    },
  ];

  const sortOptions: SortOption[] = [
    { value: 'name', label: t('franchises.sort.name') },
    { value: 'email', label: t('franchises.sort.email') },
    { value: 'planTier', label: t('franchises.sort.planTier') },
    { value: 'createdAt', label: t('franchises.sort.createdAt') },
  ];

  const filteredFranchises = useMemo(() => {
    let result = franchises || [];

    // Search filter
    if (searchQuery) {
      result = result.filter(f =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Active filters
    if (activeFilters.planTier) {
      result = result.filter(f => f.planTier === activeFilters.planTier);
    }
    if (activeFilters.isActive) {
      result = result.filter(f => f.isActive === (activeFilters.isActive === 'true'));
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
  }, [franchises, searchQuery, activeFilters, sortBy, sortDirection]);

  // Pagination
  const totalPages = Math.ceil((filteredFranchises?.length || 0) / ITEMS_PER_PAGE);
  const paginatedFranchises = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredFranchises?.slice(start, end);
  }, [filteredFranchises, currentPage]);

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteFranchise(deleteId);
    setDeleteId(null);
  };

  const handleFilterChange = (filters: Record<string, string>) => {
    setActiveFilters(filters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when search changes
  };

  if (loading) {
    return <LoadingState message={t('franchises.loading.franchises')} variant="skeleton" />;
  }

  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: t('franchises.title') }]} />

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('franchises.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('franchises.count.total', { count: filteredFranchises?.length || 0 })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton data={filteredFranchises || []} filename="franchises" />
          <ViewToggle view={viewMode} onChange={setViewMode} />
          <Button onClick={() => navigate('/franchises/new')}>
            + {t('franchises.add')}
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder={t('franchises.search.placeholder')}
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
      {!paginatedFranchises || paginatedFranchises.length === 0 ? (
        <EmptyState
          icon="🏢"
          title={t('franchises.empty.title')}
          message={searchQuery || Object.keys(activeFilters).length > 0
            ? t('franchises.empty.noResults')
            : t('franchises.empty.noFranchises')}
          actionLabel={t('franchises.empty.action')}
          onAction={() => navigate('/franchises/new')}
        />
      ) : (
        <>
          {/* Grid or List View */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {paginatedFranchises.map((franchise) => (
                <FranchiseCard
                  key={franchise.franchiseId}
                  franchise={franchise}
                  onEdit={(id) => navigate(`/franchises/${id}/edit`)}
                  onDelete={setDeleteId}
                />
              ))}
            </div>
          ) : (
            <div className="mb-6">
              <FranchiseListView
                franchises={paginatedFranchises}
                onEdit={(id) => navigate(`/franchises/${id}/edit`)}
                onDelete={setDeleteId}
              />
            </div>
          )}

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredFranchises?.length || 0}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title={t('franchises.confirmDelete.title')}
        message={t('franchises.confirmDelete.message')}
        variant="danger"
        confirmLabel={t('franchises.confirmDelete.confirm')}
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
