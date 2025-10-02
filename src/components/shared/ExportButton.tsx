/**
 * Export button component (CSV/JSON)
 */
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export type ExportFormat = 'csv' | 'json';

interface ExportButtonProps {
  data: any[];
  filename: string;
  disabled?: boolean;
}

export function ExportButton({ data, filename, disabled }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const convertToCSV = (items: any[]): string => {
    if (!items || items.length === 0) return '';

    // Get all unique keys from all objects
    const allKeys = new Set<string>();
    items.forEach(item => {
      Object.keys(item).forEach(key => {
        // Skip complex objects like Timestamps
        if (typeof item[key] !== 'object' || item[key] === null) {
          allKeys.add(key);
        } else if (item[key]?.toDate) {
          // Include Firestore Timestamps as dates
          allKeys.add(key);
        }
      });
    });

    const headers = Array.from(allKeys);
    const csvRows = [headers.join(',')];

    items.forEach(item => {
      const values = headers.map(header => {
        let value = item[header];

        // Handle Firestore Timestamps
        if (value?.toDate) {
          value = value.toDate().toISOString();
        }

        // Handle null/undefined
        if (value === null || value === undefined) {
          return '';
        }

        // Handle strings with commas or quotes
        if (typeof value === 'string') {
          value = value.replace(/"/g, '""');
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value}"`;
          }
        }

        return value;
      });
      csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
  };

  const convertToJSON = (items: any[]): string => {
    // Convert Firestore Timestamps to ISO strings
    const cleanedData = items.map(item => {
      const cleaned: any = {};
      Object.keys(item).forEach(key => {
        if (item[key]?.toDate) {
          cleaned[key] = item[key].toDate().toISOString();
        } else if (typeof item[key] !== 'function') {
          cleaned[key] = item[key];
        }
      });
      return cleaned;
    });

    return JSON.stringify(cleanedData, null, 2);
  };

  const downloadFile = (content: string, format: ExportFormat) => {
    const blob = new Blob([content], {
      type: format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json',
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.${format}`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    setShowMenu(false);

    try {
      const content = format === 'csv' ? convertToCSV(data) : convertToJSON(data);
      downloadFile(content, format);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setShowMenu(!showMenu)}
        disabled={disabled || isExporting || !data || data.length === 0}
        className="flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
        {isExporting ? 'Exporting...' : 'Export'}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <button
              onClick={() => handleExport('csv')}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export as CSV
            </button>
            <button
              onClick={() => handleExport('json')}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
              Export as JSON
            </button>
          </div>
        </>
      )}
    </div>
  );
}
