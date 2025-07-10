'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Trash2 } from 'lucide-react';

interface ViewToggleProps {
  checked: boolean;
  onToggle: () => void;
  viewType: 'products' | 'flavors' | 'product_types' | 'orders';
  deletedCount?: number;
  className?: string;
}

export function ViewToggle({ 
  checked, 
  onToggle, 
  viewType, 
  deletedCount = 0, 
  className = '' 
}: ViewToggleProps) {
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await onToggle();
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className="flex items-center space-x-2">
        <Switch
          checked={checked}
          onCheckedChange={handleToggle}
          disabled={isToggling}
          className="data-[state=checked]:bg-orange-500"
        />
        <Label className="text-sm font-medium">
          {checked ? (
            <span className="flex items-center space-x-1">
              <EyeOff className="h-4 w-4" />
              <span>Hide Deleted</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1">
              <Eye className="h-4 w-4" />
              <span>Show Deleted</span>
            </span>
          )}
        </Label>
      </div>
      {deletedCount > 0 && (
        <Badge variant="secondary" className="flex items-center space-x-1">
          <Trash2 className="h-3 w-3" />
          <span>{deletedCount} deleted</span>
        </Badge>
      )}
      {isToggling && (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
      )}
    </div>
  );
} 