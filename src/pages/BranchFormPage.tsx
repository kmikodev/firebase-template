/**
 * Branch create/edit page
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useBranch } from '@/contexts/BranchContext';
import { Branch } from '@/types';
import { BranchForm } from '@/components/branches/BranchForm';
import { LoadingState } from '@/components/shared/LoadingState';

export default function BranchFormPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const franchiseId = searchParams.get('franchiseId');
  const navigate = useNavigate();
  const { getBranch, createBranch, updateBranch } = useBranch();
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      loadBranch();
    }
  }, [id]);

  const loadBranch = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getBranch(id);
      setBranch(data);
    } catch (error) {
      console.error('Error loading branch:', error);
      navigate('/branches');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      if (id && branch) {
        await updateBranch(id, data);
      } else {
        await createBranch(data);
      }
      navigate('/branches');
    } catch (error) {
      console.error('Error saving branch:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/branches');
  };

  if (!franchiseId && !branch) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-red-600">Franchise ID is required to create a branch.</p>
          <button onClick={() => navigate('/branches')} className="mt-4 text-blue-600 hover:underline">
            Back to Branches
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingState message="Loading branch..." />;
  }

  return (
    <div className="container mx-auto p-6">
      <BranchForm
        branch={branch || undefined}
        franchiseId={franchiseId || branch?.franchiseId || ''}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={submitting}
      />
    </div>
  );
}
