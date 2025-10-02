/**
 * Branch create/edit form component
 */
import { useState, useEffect } from 'react';
import { Branch } from '@/types';
import { CreateBranchInput, UpdateBranchInput, useBranch } from '@/contexts/BranchContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ImageUpload } from '@/components/shared/ImageUpload';

interface BranchFormProps {
  branch?: Branch;
  franchiseId: string;
  onSubmit: (data: CreateBranchInput | UpdateBranchInput) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

export function BranchForm({ branch, franchiseId, onSubmit, onCancel, isLoading }: BranchFormProps) {
  const { uploadPhoto } = useBranch();
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<CreateBranchInput>({
    franchiseId,
    name: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'Spain',
    phone: '',
    email: '',
    photo: undefined,
    schedule: {
      monday: { isOpen: true, open: '09:00', close: '20:00' },
      tuesday: { isOpen: true, open: '09:00', close: '20:00' },
      wednesday: { isOpen: true, open: '09:00', close: '20:00' },
      thursday: { isOpen: true, open: '09:00', close: '20:00' },
      friday: { isOpen: true, open: '09:00', close: '20:00' },
      saturday: { isOpen: true, open: '10:00', close: '18:00' },
      sunday: { isOpen: false, open: '', close: '' },
    },
    isActive: true,
  });

  useEffect(() => {
    if (branch) {
      setFormData({
        franchiseId: branch.franchiseId,
        name: branch.name,
        address: branch.address,
        city: branch.city,
        province: branch.province,
        postalCode: branch.postalCode,
        country: branch.country,
        phone: branch.phone,
        email: branch.email || '',
        photo: branch.photo,
        schedule: branch.schedule,
        isActive: branch.isActive,
      });
    }
  }, [branch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handlePhotoUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadPhoto(branch?.branchId || 'temp', file);
      setFormData(prev => ({ ...prev, photo: url }));
    } catch (error) {
      console.error('Error uploading photo:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleScheduleChange = (day: typeof DAYS[number], field: 'isOpen' | 'open' | 'close', value: boolean | string) => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: {
          ...prev.schedule[day],
          [field]: value,
        },
      },
    }));
  };

  return (
    <Card className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">
        {branch ? 'Edit Branch' : 'Create New Branch'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Photo</label>
          <ImageUpload
            currentImage={formData.photo}
            onUpload={handlePhotoUpload}
            uploading={uploading}
          />
        </div>

        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Branch Name *
          </label>
          <input
            id="name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Downtown Branch"
          />
        </div>

        {/* Address */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              Address *
            </label>
            <input
              id="address"
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="123 Main St"
            />
          </div>

          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
              City *
            </label>
            <input
              id="city"
              type="text"
              required
              value={formData.city}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Madrid"
            />
          </div>

          <div>
            <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-2">
              Province *
            </label>
            <input
              id="province"
              type="text"
              required
              value={formData.province}
              onChange={(e) => setFormData(prev => ({ ...prev, province: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Madrid"
            />
          </div>

          <div>
            <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
              Postal Code *
            </label>
            <input
              id="postalCode"
              type="text"
              required
              value={formData.postalCode}
              onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="28001"
            />
          </div>

          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
              Country *
            </label>
            <input
              id="country"
              type="text"
              required
              value={formData.country}
              onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Spain"
            />
          </div>
        </div>

        {/* Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone *
            </label>
            <input
              id="phone"
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+34 123 456 789"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="branch@example.com"
            />
          </div>
        </div>

        {/* Schedule */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">Schedule</label>
          <div className="space-y-3">
            {DAYS.map((day) => (
              <div key={day} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-24">
                  <input
                    type="checkbox"
                    id={`${day}-open`}
                    checked={formData.schedule[day].isOpen}
                    onChange={(e) => handleScheduleChange(day, 'isOpen', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2"
                  />
                  <label htmlFor={`${day}-open`} className="text-sm font-medium capitalize">
                    {day}
                  </label>
                </div>

                {formData.schedule[day].isOpen && (
                  <>
                    <div>
                      <label htmlFor={`${day}-open-time`} className="text-xs text-gray-600">Open</label>
                      <input
                        id={`${day}-open-time`}
                        type="time"
                        value={formData.schedule[day].open}
                        onChange={(e) => handleScheduleChange(day, 'open', e.target.value)}
                        className="block px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor={`${day}-close-time`} className="text-xs text-gray-600">Close</label>
                      <input
                        id={`${day}-close-time`}
                        type="time"
                        value={formData.schedule[day].close}
                        onChange={(e) => handleScheduleChange(day, 'close', e.target.value)}
                        className="block px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </div>
                  </>
                )}
              </div>
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
            Active
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <Button type="submit" isLoading={isLoading} className="flex-1">
            {branch ? 'Update Branch' : 'Create Branch'}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading} className="flex-1">
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
