import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import type { DateRange } from '@/types/stats';

export interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (dateRange: DateRange) => void;
  className?: string;
}

type PresetRange = 'thisMonth' | 'last3Months' | 'last6Months' | 'thisYear' | 'custom';

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  value,
  onChange,
  className = ''
}) => {
  const [selectedPreset, setSelectedPreset] = useState<PresetRange>('last3Months');
  const [showCustom, setShowCustom] = useState(false);

  const getPresetRange = (preset: PresetRange): DateRange => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    switch (preset) {
      case 'thisMonth':
        return {
          from: new Date(year, month, 1).toISOString().split('T')[0],
          to: new Date(year, month + 1, 0).toISOString().split('T')[0]
        };
      
      case 'last3Months':
        return {
          from: new Date(year, month - 2, 1).toISOString().split('T')[0],
          to: now.toISOString().split('T')[0]
        };
      
      case 'last6Months':
        return {
          from: new Date(year, month - 5, 1).toISOString().split('T')[0],
          to: now.toISOString().split('T')[0]
        };
      
      case 'thisYear':
        return {
          from: new Date(year, 0, 1).toISOString().split('T')[0],
          to: now.toISOString().split('T')[0]
        };
      
      default:
        return value;
    }
  };

  const handlePresetChange = (preset: PresetRange) => {
    setSelectedPreset(preset);
    if (preset === 'custom') {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      const range = getPresetRange(preset);
      onChange(range);
    }
  };

  const handleCustomDateChange = (field: 'from' | 'to', date: string) => {
    onChange({
      ...value,
      [field]: date
    });
  };

  const presetOptions = [
    { value: 'thisMonth', label: '本月' },
    { value: 'last3Months', label: '近3個月' },
    { value: 'last6Months', label: '近6個月' },
    { value: 'thisYear', label: '今年' },
    { value: 'custom', label: '自訂日期' },
  ] as const;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Preset Options */}
      <div className="flex flex-wrap gap-2">
        {presetOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handlePresetChange(option.value)}
            className={`px-3 py-1 text-sm rounded-md border transition-colors ${
              selectedPreset === option.value
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Custom Date Range */}
      {showCustom && (
        <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">開始日期</label>
          </div>
          <input
            type="date"
            value={value.from || ''}
            onChange={(e) => handleCustomDateChange('from', e.target.value)}
            className="form-input text-sm"
          />
          
          <span className="text-gray-500">至</span>
          
          <input
            type="date"
            value={value.to || ''}
            onChange={(e) => handleCustomDateChange('to', e.target.value)}
            className="form-input text-sm"
          />
        </div>
      )}

      {/* Selected Range Display */}
      {(value.from || value.to) && (
        <div className="text-xs text-gray-500">
          選擇範圍: {value.from || '不限'} ~ {value.to || '今天'}
        </div>
      )}
    </div>
  );
};