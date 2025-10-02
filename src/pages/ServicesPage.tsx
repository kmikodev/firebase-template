/**
 * Services list page
 */
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useService } from '@/contexts/ServiceContext';
import { ServiceCard } from '@/components/services/ServiceCard';
import { ServiceListView } from '@/components/services/ServiceListView';
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

export default function ServicesPage() {
  const navigate = useNavigate();
  const { services, loading, deleteService, listServices } = useService();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  useEffect(() => {
    listServices();
  }, []);

  const filterConfigs: FilterConfig[] = [
    {
      key: 'category',
      label: 'Category',
      options: [
        { value: 'haircut', label: 'Haircut' },
        { value: 'beard', label: 'Beard' },
        { value: 'shave', label: 'Shave' },
        { value: 'styling', label: 'Styling' },
        { value: 'coloring', label: 'Coloring' },
        { value: 'treatment', label: 'Treatment' },
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
    { value: 'name', label: 'Name' },
    { value: 'category', label: 'Category' },
    { value: 'price', label: 'Price' },
    { value: 'duration', label: 'Duration' },
    { value: 'createdAt', label: 'Date Created' },
  ];

  const filteredServices = useMemo(() => {
    let result = services || [];

    // Search filter
    if (searchQuery) {
      result = result.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Active filters
    if (activeFilters.category) {
      result = result.filter(s => s.category === activeFilters.category);
    }
    if (activeFilters.isActive) {
      result = result.filter(s => s.isActive === (activeFilters.isActive === 'true'));
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
  }, [services, searchQuery, activeFilters, sortBy, sortDirection]);

  // Pagination
  const totalPages = Math.ceil((filteredServices?.length || 0) / ITEMS_PER_PAGE);
  const paginatedServices = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredServices?.slice(start, end);
  }, [filteredServices, currentPage]);

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteService(deleteId);
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
    return <LoadingState message="Loading services..." variant="skeleton" />;
  }

  return (
    <div className="container mx-auto p-6">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Services' }]} />

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Services</h1>
          <p className="text-gray-600 mt-1">
            {filteredServices?.length || 0} total {filteredServices?.length === 1 ? 'service' : 'services'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton data={filteredServices || []} filename="services" />
          <ViewToggle view={viewMode} onChange={setViewMode} />
          <Button onClick={() => navigate('/services/new?franchiseId=TEMP')}>
            + New Service
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search services by name, category, or description..."
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
      {!paginatedServices || paginatedServices.length === 0 ? (
        <EmptyState
          icon="✂️"
          title="No services found"
          message={searchQuery || Object.keys(activeFilters).length > 0
            ? "No services match your search or filters. Try adjusting your criteria."
            : "Get started by creating your first service."}
          actionLabel="Create Service"
          onAction={() => navigate('/services/new?franchiseId=TEMP')}
        />
      ) : (
        <>
          {/* Grid or List View */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {paginatedServices.map((service) => (
                <ServiceCard
                  key={service.serviceId}
                  service={service}
                  onEdit={(id) => navigate(`/services/${id}/edit`)}
                  onDelete={setDeleteId}
                />
              ))}
            </div>
          ) : (
            <div className="mb-6">
              <ServiceListView
                services={paginatedServices}
                onEdit={(id) => navigate(`/services/${id}/edit`)}
                onDelete={setDeleteId}
              />
            </div>
          )}

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredServices?.length || 0}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Service"
        message="Are you sure you want to delete this service? This action cannot be undone."
        variant="danger"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
}
