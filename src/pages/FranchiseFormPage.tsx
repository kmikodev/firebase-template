/**
 * Franchise create/edit page
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useFranchise } from '@/contexts/FranchiseContext';
import { useAuth } from '@/contexts/AuthContext';
import { Franchise } from '@/types';
import { FranchiseForm } from '@/components/franchises/FranchiseForm';
import { LoadingState } from '@/components/shared/LoadingState';

export default function FranchiseFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { getFranchise, createFranchise, updateFranchise } = useFranchise();
  const [franchise, setFranchise] = useState<Franchise | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      loadFranchise();
    }
  }, [id]);

  const loadFranchise = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getFranchise(id);
      setFranchise(data);
    } catch (error) {
      console.error('Error loading franchise:', error);
      navigate('/franchises');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      if (id && franchise) {
        await updateFranchise(id, data);
      } else {
        await createFranchise(data);
      }
      navigate('/franchises');
    } catch (error) {
      console.error('Error saving franchise:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/franchises');
  };

  if (loading) {
    return <LoadingState message={t('franchises.loading.franchise')} />;
  }

  return (
    <div className="container mx-auto p-6">
      <FranchiseForm
        franchise={franchise || undefined}
        ownerUserId={user?.id || ''}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={submitting}
      />
    </div>
  );
}
