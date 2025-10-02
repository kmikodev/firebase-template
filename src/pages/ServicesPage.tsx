/**
 * Services list page
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useService } from '@/contexts/ServiceContext';
import { ServiceCard } from '@/components/services/ServiceCard';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { SearchBar } from '@/components/shared/SearchBar';
import { Button } from '@/components/ui/Button';

export default function ServicesPage() {
  const navigate = useNavigate();
  const { services, loading, deleteService, listServices } = useService();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    listServices();
  }, []);

  const filteredServices = services?.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteService(deleteId);
    setDeleteId(null);
  };

  if (loading) {
    return <LoadingState message="Loading services..." variant="skeleton" />;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Services</h1>
        <Button onClick={() => navigate('/services/new?franchiseId=TEMP')}>
          + New Service
        </Button>
      </div>

      <div className="mb-6">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search services..."
        />
      </div>

      {!filteredServices || filteredServices.length === 0 ? (
        <EmptyState
          icon="✂️"
          title="No services found"
          message={searchQuery ? "No services match your search." : "Get started by creating your first service."}
          actionLabel="Create Service"
          onAction={() => navigate('/services/new?franchiseId=TEMP')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <ServiceCard
              key={service.serviceId}
              service={service}
              onEdit={(id) => navigate(`/services/${id}/edit`)}
              onDelete={setDeleteId}
            />
          ))}
        </div>
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
