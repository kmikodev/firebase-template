/**
 * Barber create/edit page
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useBarber } from '@/contexts/BarberContext';
import { useAuth } from '@/contexts/AuthContext';
import { Barber } from '@/types';
import { BarberForm } from '@/components/barbers/BarberForm';
import { LoadingState } from '@/components/shared/LoadingState';

export default function BarberFormPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const franchiseId = searchParams.get('franchiseId');
  const branchId = searchParams.get('branchId');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getBarber, createBarber, updateBarber } = useBarber();
  const [barber, setBarber] = useState<Barber | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      loadBarber();
    }
  }, [id]);

  const loadBarber = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getBarber(id);
      setBarber(data);
    } catch (error) {
      console.error('Error loading barber:', error);
      navigate('/barbers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      if (id && barber) {
        await updateBarber(id, data);
      } else {
        await createBarber(data);
      }
      navigate('/barbers');
    } catch (error) {
      console.error('Error saving barber:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/barbers');
  };

  if ((!franchiseId || !branchId) && !barber) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-red-600">Franchise ID and Branch ID are required to create a barber.</p>
          <button onClick={() => navigate('/barbers')} className="mt-4 text-blue-600 hover:underline">
            Back to Barbers
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingState message="Loading barber..." />;
  }

  return (
    <div className="container mx-auto p-6">
      <BarberForm
        barber={barber || undefined}
        franchiseId={franchiseId || barber?.franchiseId || ''}
        branchId={branchId || barber?.branchId || ''}
        userId={user?.id || ''}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={submitting}
      />
    </div>
  );
}
