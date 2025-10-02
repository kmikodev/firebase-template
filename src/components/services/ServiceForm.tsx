/**
 * Service create/edit form component
 */
import { useState, useEffect } from 'react';
import { Service } from '@/types';
import { CreateServiceInput, UpdateServiceInput } from '@/contexts/ServiceContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface ServiceFormProps {
  service?: Service;
  franchiseId: string;
  onSubmit: (data: CreateServiceInput | UpdateServiceInput) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const SERVICE_CATEGORIES = [
  'Haircut',
  'Beard',
  'Shave',
  'Styling',
  'Color',
  'Treatment',
  'Kids',
  'Special',
  'Package',
  'Other',
];

export function ServiceForm({ service, franchiseId, onSubmit, onCancel, isLoading }: ServiceFormProps) {
  const [formData, setFormData] = useState<CreateServiceInput>({
    franchiseId,
    name: '',
    description: '',
    duration: 30,
    price: 0,
    category: 'Haircut',
    isActive: true,
  });

  useEffect(() => {
    if (service) {
      setFormData({
        franchiseId: service.franchiseId,
        name: service.name,
        description: service.description || '',
        duration: service.duration,
        price: service.price,
        category: service.category,
        isActive: service.isActive,
      });
    }
  }, [service]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  const handlePriceChange = (value: string) => {
    const euros = parseFloat(value) || 0;
    setFormData(prev => ({ ...prev, price: Math.round(euros * 100) }));
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">
        {service ? 'Edit Service' : 'Create New Service'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Service Name *
          </label>
          <input
            id="name"
            type="text"
            required
            maxLength={100}
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Classic Haircut"
          />
          <p className="text-xs text-gray-500 mt-1">{formData.name.length}/100 characters</p>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            maxLength={500}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Brief description of the service"
          />
          <p className="text-xs text-gray-500 mt-1">{(formData.description || '').length}/500 characters</p>
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            id="category"
            required
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {SERVICE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Duration and Price */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
              Duration (minutes) *
            </label>
            <input
              id="duration"
              type="number"
              required
              min={5}
              max={480}
              step={5}
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 30 }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Duration: {formatDuration(formData.duration)}
            </p>
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
              Price (€) *
            </label>
            <input
              id="price"
              type="number"
              required
              min={0}
              step={0.01}
              value={formatPrice(formData.price)}
              onChange={(e) => handlePriceChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Price: €{formatPrice(formData.price)}
            </p>
          </div>
        </div>

        {/* Quick Duration Presets */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Quick Duration Presets</label>
          <div className="flex flex-wrap gap-2">
            {[15, 30, 45, 60, 90, 120].map((minutes) => (
              <button
                key={minutes}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, duration: minutes }))}
                className={`px-3 py-1 rounded-full text-sm ${
                  formData.duration === minutes
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {formatDuration(minutes)}
              </button>
            ))}
          </div>
        </div>

        {/* Is Active */}
        <div className="flex items-center">
          <input
            id="isActive"
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700">
            Active (visible to customers)
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <Button type="submit" isLoading={isLoading} className="flex-1">
            {service ? 'Update Service' : 'Create Service'}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading} className="flex-1">
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
