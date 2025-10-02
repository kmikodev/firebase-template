/**
 * Service create/edit page
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useService } from '@/contexts/ServiceContext';
import { Service } from '@/types';
import { ServiceForm } from '@/components/services/ServiceForm';
import { LoadingState } from '@/components/shared/LoadingState';

export default function ServiceFormPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const franchiseId = searchParams.get('franchiseId');
  const navigate = useNavigate();
  const { getService, createService, updateService } = useService();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      loadService();
    }
  }, [id]);

  const loadService = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getService(id);
      setService(data);
    } catch (error) {
      console.error('Error loading service:', error);
      navigate('/services');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      if (id && service) {
        await updateService(id, data);
      } else {
        await createService(data);
      }
      navigate('/services');
    } catch (error) {
      console.error('Error saving service:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/services');
  };

  if (!franchiseId && !service) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-red-600">Franchise ID is required to create a service.</p>
          <button onClick={() => navigate('/services')} className="mt-4 text-blue-600 hover:underline">
            Back to Services
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingState message="Loading service..." />;
  }

  return (
    <div className="container mx-auto p-6">
      <ServiceForm
        service={service || undefined}
        franchiseId={franchiseId || service?.franchiseId || ''}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={submitting}
      />
    </div>
  );
}
