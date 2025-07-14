"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Calendar,
  Percent,
  DollarSign,
  Users,
  TrendingUp,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface PromoCode {
  id: number
  code: string
  name: string
  description: string
  discount_type: 'percentage' | 'fixed_amount'
  discount_value: number
  minimum_order_amount: number
  maximum_discount: number | null
  usage_limit: number | null
  used_count: number
  valid_from: string
  valid_until: string | null
  is_active: boolean
  created_at: string
}

export default function PromoCodesPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed_amount',
    discount_value: 0,
    minimum_order_amount: 0,
    maximum_discount: 0,
    usage_limit: 0,
    valid_until: '',
    is_active: true
  })

  useEffect(() => {
    fetchPromoCodes()
  }, [])

  const fetchPromoCodes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/promo-codes')
      
      if (!response.ok) {
        throw new Error('Failed to fetch promo codes')
      }

      const data = await response.json()
      setPromoCodes(data.promoCodes || [])
    } catch (error) {
      console.error('Error fetching promo codes:', error)
      toast.error('Failed to load promo codes')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingCode 
        ? `/api/admin/promo-codes/${editingCode.id}`
        : '/api/admin/promo-codes'
      
      const method = editingCode ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Failed to save promo code')
      }

      toast.success(editingCode ? 'Promo code updated' : 'Promo code created')
      setIsDialogOpen(false)
      resetForm()
      fetchPromoCodes()
    } catch (error) {
      console.error('Error saving promo code:', error)
      toast.error('Failed to save promo code')
    }
  }

  const handleEdit = (code: PromoCode) => {
    setEditingCode(code)
    setFormData({
      code: code.code,
      name: code.name,
      description: code.description,
      discount_type: code.discount_type,
      discount_value: code.discount_value,
      minimum_order_amount: code.minimum_order_amount,
      maximum_discount: code.maximum_discount || 0,
      usage_limit: code.usage_limit || 0,
      valid_until: code.valid_until ? code.valid_until.split('T')[0] : '',
      is_active: code.is_active
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this promo code?')) return

    try {
      const response = await fetch(`/api/admin/promo-codes/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete promo code')
      }

      toast.success('Promo code deleted')
      fetchPromoCodes()
    } catch (error) {
      console.error('Error deleting promo code:', error)
      toast.error('Failed to delete promo code')
    }
  }

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/promo-codes/${id}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !currentStatus })
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      toast.success('Status updated')
      fetchPromoCodes()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('Code copied to clipboard')
  }

  const resetForm = () => {
    setEditingCode(null)
    setFormData({
      code: '',
      name: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 0,
      minimum_order_amount: 0,
      maximum_discount: 0,
      usage_limit: 0,
      valid_until: '',
      is_active: true
    })
  }

  const getUsagePercentage = (used: number, limit: number | null) => {
    if (!limit) return 0
    return Math.round((used / limit) * 100)
  }

  const isExpired = (validUntil: string | null) => {
    if (!validUntil) return false
    return new Date(validUntil) < new Date()
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Promo Codes</h1>
          <p className="text-gray-600 mt-1">Manage discount codes and promotions</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Promo Code
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCode ? 'Edit Promo Code' : 'Create New Promo Code'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Code</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="WELCOME10"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Welcome Discount"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description of the promotion"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discount_type">Discount Type</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(value: 'percentage' | 'fixed_amount') => 
                      setFormData({ ...formData, discount_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="discount_value">
                    Discount Value {formData.discount_type === 'percentage' ? '(%)' : '(EGP)'}
                  </Label>
                  <Input
                    id="discount_value"
                    type="number"
                    step="0.01"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minimum_order_amount">Minimum Order Amount (EGP)</Label>
                  <Input
                    id="minimum_order_amount"
                    type="number"
                    step="0.01"
                    value={formData.minimum_order_amount}
                    onChange={(e) => setFormData({ ...formData, minimum_order_amount: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="maximum_discount">Maximum Discount (EGP)</Label>
                  <Input
                    id="maximum_discount"
                    type="number"
                    step="0.01"
                    value={formData.maximum_discount}
                    onChange={(e) => setFormData({ ...formData, maximum_discount: parseFloat(e.target.value) })}
                    placeholder="Leave empty for no limit"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="usage_limit">Usage Limit</Label>
                  <Input
                    id="usage_limit"
                    type="number"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: parseInt(e.target.value) })}
                    placeholder="Leave empty for unlimited"
                  />
                </div>
                <div>
                  <Label htmlFor="valid_until">Valid Until</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  id="is_active"
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCode ? 'Update' : 'Create'} Promo Code
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Promo Codes Grid */}
      <div className="grid gap-4">
        {promoCodes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No promo codes found</p>
            </CardContent>
          </Card>
        ) : (
          promoCodes.map((code) => (
            <Card key={code.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{code.name}</h3>
                      <div className="flex items-center gap-2">
                        <Badge 
                          className={code.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                        >
                          {code.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {isExpired(code.valid_until) && (
                          <Badge className="bg-red-100 text-red-800">Expired</Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 mb-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                        {code.code}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(code.code)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-3">{code.description}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(code)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleStatus(code.id, code.is_active)}
                    >
                      {code.is_active ? <XCircle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(code.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      {code.discount_type === 'percentage' ? (
                        <Percent className="h-4 w-4 text-blue-500" />
                      ) : (
                        <DollarSign className="h-4 w-4 text-green-500" />
                      )}
                      <span className="text-sm font-medium text-gray-600">Discount</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {code.discount_value}
                      {code.discount_type === 'percentage' ? '%' : ' EGP'}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium text-gray-600">Min Order</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {code.minimum_order_amount} EGP
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium text-gray-600">Usage</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {code.used_count}
                      {code.usage_limit ? ` / ${code.usage_limit}` : ''}
                    </p>
                    {code.usage_limit && (
                      <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                        <div 
                          className="bg-blue-500 h-1 rounded-full" 
                          style={{ width: `${getUsagePercentage(code.used_count, code.usage_limit)}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium text-gray-600">Valid Until</span>
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      {code.valid_until ? new Date(code.valid_until).toLocaleDateString() : 'No Expiry'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
} 