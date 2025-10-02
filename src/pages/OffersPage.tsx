/**
 * Offers management page
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOffer } from '@/contexts/OfferContext';
import { OfferCard } from '@/components/offers/OfferCard';
import { LoadingState } from '@/components/shared/LoadingState';
import { Button } from '@/components/ui/Button';

export default function OffersPage() {
  const navigate = useNavigate();
  const { offers, listOffers, deleteOffer } = useOffer();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    setLoading(true);
    try {
      await listOffers();
    } catch (error) {
      console.error('Error loading offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (offerId: string) => {
    if (confirm('¿Estás seguro de eliminar esta oferta?')) {
      try {
        await deleteOffer(offerId);
      } catch (error) {
        console.error('Error deleting offer:', error);
      }
    }
  };

  if (loading) {
    return <LoadingState message="Loading offers..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Offers & Promotions
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your promotional offers and discounts
            </p>
          </div>
          <Button
            onClick={() => navigate('/offers/new')}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            + New Offer
          </Button>
        </div>

        {/* Offers Grid */}
        {offers && offers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map((offer) => (
              <div key={offer.offerId} className="relative group">
                <OfferCard offer={offer} />
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/offers/${offer.offerId}/edit`)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(offer.offerId)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No offers yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create your first promotional offer to attract more customers
            </p>
            <Button
              onClick={() => navigate('/offers/new')}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Create First Offer
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
