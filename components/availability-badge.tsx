'use client'

import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Package, ShoppingCart, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

export interface AvailabilityInfo {
  isAvailable: boolean
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'preorder_available'
  message: string
  stockQuantity?: number
  allowsOutOfStock: boolean
}

interface AvailabilityBadgeProps {
  availability: AvailabilityInfo
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const statusConfig = {
  in_stock: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: <CheckCircle className="h-3 w-3" />,
    tooltip: 'In stock and available for immediate order'
  },
  low_stock: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: <AlertTriangle className="h-3 w-3" />,
    tooltip: 'Low stock - order soon to avoid disappointment'
  },
  out_of_stock: {
    color: (allowsOutOfStock: boolean) => 
      allowsOutOfStock 
        ? 'bg-orange-100 text-orange-800 border-orange-200'
        : 'bg-red-100 text-red-800 border-red-200',
    icon: (allowsOutOfStock: boolean) => 
      allowsOutOfStock 
        ? <ShoppingCart className="h-3 w-3" />
        : <AlertTriangle className="h-3 w-3" />,
    tooltip: (allowsOutOfStock: boolean) => 
      allowsOutOfStock 
        ? 'Out of stock but available for order'
        : 'Out of stock - not available for order'
  },
  preorder_available: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: <Clock className="h-3 w-3" />,
    tooltip: 'Available for preorder'
  }
}

const sizeConfig = {
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-3 py-1.5',
  lg: 'text-base px-4 py-2'
}

export function AvailabilityBadge({ 
  availability, 
  showIcon = true, 
  size = 'md',
  className = ''
}: AvailabilityBadgeProps) {
  const config = statusConfig[availability.status]
  const color = typeof config.color === 'function' 
    ? config.color(availability.allowsOutOfStock)
    : config.color
  const icon = typeof config.icon === 'function'
    ? config.icon(availability.allowsOutOfStock)
    : config.icon
  const tooltip = typeof config.tooltip === 'function'
    ? config.tooltip(availability.allowsOutOfStock)
    : config.tooltip

  const badge = (
    <Badge 
      variant="outline" 
      className={`${color} ${sizeConfig[size]} ${className}`}
    >
      {showIcon && icon}
      <span className={showIcon ? 'ml-1' : ''}>
        {availability.message}
      </span>
    </Badge>
  )

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
          {availability.stockQuantity !== undefined && (
            <p className="text-xs mt-1">
              Stock: {availability.stockQuantity}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Simplified badge for basic status display
export function SimpleAvailabilityBadge({ 
  status, 
  allowsOutOfStock = false,
  size = 'sm' 
}: {
  status: AvailabilityInfo['status']
  allowsOutOfStock?: boolean
  size?: 'sm' | 'md' | 'lg'
}) {
  const config = statusConfig[status]
  const color = typeof config.color === 'function' 
    ? config.color(allowsOutOfStock)
    : config.color
  const icon = typeof config.icon === 'function'
    ? config.icon(allowsOutOfStock)
    : config.icon

  return (
    <Badge 
      variant="outline" 
      className={`${color} ${sizeConfig[size]}`}
    >
      {icon}
      <span className="ml-1">
        {status === 'in_stock' && 'In Stock'}
        {status === 'low_stock' && 'Low Stock'}
        {status === 'out_of_stock' && (allowsOutOfStock ? 'Available' : 'Out of Stock')}
        {status === 'preorder_available' && 'Preorder'}
      </span>
    </Badge>
  )
} 