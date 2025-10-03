/**
 * Franchise create/edit form component
 */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Franchise } from '@/types';
import { CreateFranchiseInput, UpdateFranchiseInput, useFranchise } from '@/contexts/FranchiseContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ImageUpload } from '@/components/shared/ImageUpload';

interface FranchiseFormProps {
  franchise?: Franchise;
  ownerUserId: string;
  onSubmit: (data: CreateFranchiseInput | UpdateFranchiseInput) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

type PlanTier = 'free' | 'basic' | 'premium' | 'enterprise';

export function FranchiseForm({ franchise, ownerUserId, onSubmit, onCancel, isLoading }: FranchiseFormProps) {
  const { t } = useTranslation();
  const { uploadLogo } = useFranchise();
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<CreateFranchiseInput>({
    ownerUserId,
    name: '',
    description: '',
    email: '',
    phone: '',
    website: '',
    logo: undefined,
    planTier: 'free' as PlanTier,
    isActive: true,
  });

  useEffect(() => {
    if (franchise) {
      setFormData({
        ownerUserId: franchise.ownerUserId,
        name: franchise.name,
        description: franchise.description || '',
        email: franchise.email,
        phone: franchise.phone,
        website: franchise.website || '',
        logo: franchise.logo,
        planTier: franchise.planTier,
        isActive: franchise.isActive,
      });
    }
  }, [franchise]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleLogoUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadLogo(franchise?.franchiseId || 'temp', file);
      setFormData(prev => ({ ...prev, logo: url }));
    } catch (error) {
      console.error('Error uploading logo:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        {franchise ? t('franchises.edit') : t('franchises.add')}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('franchises.form.logo')}
          </label>
          <ImageUpload
            currentImage={formData.logo}
            onUpload={handleLogoUpload}
            uploading={uploading}
          />
        </div>

        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('franchises.form.name')} *
          </label>
          <input
            id="name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder={t('franchises.form.namePlaceholder')}
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('franchises.form.description')}
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder={t('franchises.form.descriptionPlaceholder')}
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('franchises.form.email')} *
          </label>
          <input
            id="email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder={t('franchises.form.emailPlaceholder')}
          />
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('franchises.form.phone')} *
          </label>
          <input
            id="phone"
            type="tel"
            required
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder={t('franchises.form.phonePlaceholder')}
          />
        </div>

        {/* Website */}
        <div>
          <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('franchises.form.website')}
          </label>
          <input
            id="website"
            type="url"
            value={formData.website}
            onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder={t('franchises.form.websitePlaceholder')}
          />
        </div>

        {/* Plan Tier */}
        <div>
          <label htmlFor="planTier" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('franchises.form.planTier')} *
          </label>
          <select
            id="planTier"
            required
            value={formData.planTier}
            onChange={(e) => setFormData(prev => ({ ...prev, planTier: e.target.value as PlanTier }))}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="free">{t('franchises.planTiers.free')}</option>
            <option value="basic">{t('franchises.planTiers.basic')}</option>
            <option value="premium">{t('franchises.planTiers.premium')}</option>
            <option value="enterprise">{t('franchises.planTiers.enterprise')}</option>
          </select>
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
          <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('franchises.form.isActive')}
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <Button type="submit" isLoading={isLoading} className="flex-1">
            {franchise ? t('franchises.form.updateButton') : t('franchises.form.createButton')}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading} className="flex-1">
            {t('common.cancel')}
          </Button>
        </div>
      </form>
    </Card>
  );
}
