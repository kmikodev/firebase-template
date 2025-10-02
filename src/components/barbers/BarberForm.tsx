/**
 * Barber create/edit form component
 */
import { useState, useEffect } from 'react';
import { Barber } from '@/types';
import { CreateBarberInput, UpdateBarberInput, useBarber } from '@/contexts/BarberContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ImageUpload } from '@/components/shared/ImageUpload';

interface BarberFormProps {
  barber?: Barber;
  franchiseId: string;
  branchId: string;
  userId: string;
  onSubmit: (data: CreateBarberInput | UpdateBarberInput) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

export function BarberForm({ barber, franchiseId, branchId, userId, onSubmit, onCancel, isLoading }: BarberFormProps) {
  const { uploadPhoto } = useBarber();
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<CreateBarberInput>({
    userId,
    franchiseId,
    branchId,
    displayName: '',
    photoURL: undefined,
    specialties: [],
    bio: '',
    schedule: {
      monday: { isWorking: true, workStart: '09:00', workEnd: '18:00', breakStart: '13:00', breakEnd: '14:00' },
      tuesday: { isWorking: true, workStart: '09:00', workEnd: '18:00', breakStart: '13:00', breakEnd: '14:00' },
      wednesday: { isWorking: true, workStart: '09:00', workEnd: '18:00', breakStart: '13:00', breakEnd: '14:00' },
      thursday: { isWorking: true, workStart: '09:00', workEnd: '18:00', breakStart: '13:00', breakEnd: '14:00' },
      friday: { isWorking: true, workStart: '09:00', workEnd: '18:00', breakStart: '13:00', breakEnd: '14:00' },
      saturday: { isWorking: true, workStart: '10:00', workEnd: '15:00' },
      sunday: { isWorking: false },
    },
    isActive: true,
    isAvailable: true,
  });

  const [specialtyInput, setSpecialtyInput] = useState('');

  useEffect(() => {
    if (barber) {
      setFormData({
        userId: barber.userId,
        franchiseId: barber.franchiseId,
        branchId: barber.branchId,
        displayName: barber.displayName,
        photoURL: barber.photoURL,
        specialties: barber.specialties,
        bio: barber.bio || '',
        schedule: barber.schedule,
        isActive: barber.isActive,
        isAvailable: barber.isAvailable,
      });
    }
  }, [barber]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handlePhotoUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadPhoto(barber?.barberId || 'temp', file);
      setFormData(prev => ({ ...prev, photoURL: url }));
    } catch (error) {
      console.error('Error uploading photo:', error);
    } finally {
      setUploading(false);
    }
  };

  const addSpecialty = () => {
    if (specialtyInput.trim() && !formData.specialties.includes(specialtyInput.trim())) {
      setFormData(prev => ({
        ...prev,
        specialties: [...prev.specialties, specialtyInput.trim()],
      }));
      setSpecialtyInput('');
    }
  };

  const removeSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter(s => s !== specialty),
    }));
  };

  const handleScheduleChange = (
    day: typeof DAYS[number],
    field: 'isWorking' | 'workStart' | 'workEnd' | 'breakStart' | 'breakEnd',
    value: boolean | string
  ) => {
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
        {barber ? 'Edit Barber' : 'Create New Barber'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Photo</label>
          <ImageUpload
            currentImage={formData.photoURL || undefined}
            onUpload={handlePhotoUpload}
            uploading={uploading}
          />
        </div>

        {/* Display Name */}
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
            Display Name *
          </label>
          <input
            id="displayName"
            type="text"
            required
            value={formData.displayName}
            onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="John Doe"
          />
        </div>

        {/* Bio */}
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
            Bio
          </label>
          <textarea
            id="bio"
            value={formData.bio}
            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
            rows={3}
            maxLength={500}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Brief bio about the barber"
          />
          <p className="text-xs text-gray-500 mt-1">{(formData.bio || '').length}/500 characters</p>
        </div>

        {/* Specialties */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Specialties</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={specialtyInput}
              onChange={(e) => setSpecialtyInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add specialty (e.g., Fade, Beard Trim)"
            />
            <Button type="button" onClick={addSpecialty}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.specialties.map((specialty, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2"
              >
                {specialty}
                <button
                  type="button"
                  onClick={() => removeSpecialty(specialty)}
                  className="hover:text-blue-900"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Schedule */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">Work Schedule</label>
          <div className="space-y-3">
            {DAYS.map((day) => (
              <div key={day} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-32">
                    <input
                      type="checkbox"
                      id={`${day}-working`}
                      checked={formData.schedule[day].isWorking}
                      onChange={(e) => handleScheduleChange(day, 'isWorking', e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2"
                    />
                    <label htmlFor={`${day}-working`} className="text-sm font-medium capitalize">
                      {day}
                    </label>
                  </div>

                  {formData.schedule[day].isWorking && (
                    <div className="flex gap-4 flex-wrap">
                      <div>
                        <label className="text-xs text-gray-600">Start</label>
                        <input
                          type="time"
                          value={formData.schedule[day].workStart || ''}
                          onChange={(e) => handleScheduleChange(day, 'workStart', e.target.value)}
                          className="block px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">End</label>
                        <input
                          type="time"
                          value={formData.schedule[day].workEnd || ''}
                          onChange={(e) => handleScheduleChange(day, 'workEnd', e.target.value)}
                          className="block px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Break Start</label>
                        <input
                          type="time"
                          value={formData.schedule[day].breakStart || ''}
                          onChange={(e) => handleScheduleChange(day, 'breakStart', e.target.value)}
                          className="block px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Break End</label>
                        <input
                          type="time"
                          value={formData.schedule[day].breakEnd || ''}
                          onChange={(e) => handleScheduleChange(day, 'breakEnd', e.target.value)}
                          className="block px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status Checkboxes */}
        <div className="flex gap-6">
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

          <div className="flex items-center">
            <input
              id="isAvailable"
              type="checkbox"
              checked={formData.isAvailable}
              onChange={(e) => setFormData(prev => ({ ...prev, isAvailable: e.target.checked }))}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <label htmlFor="isAvailable" className="ml-2 text-sm font-medium text-gray-700">
              Available for Bookings
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <Button type="submit" isLoading={isLoading} className="flex-1">
            {barber ? 'Update Barber' : 'Create Barber'}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading} className="flex-1">
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
