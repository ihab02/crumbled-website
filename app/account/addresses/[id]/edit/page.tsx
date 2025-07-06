'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { ArrowLeft, MapPin, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface City {
  id: number
  name: string
  is_active: boolean
  zones: Array<{
    id: number
    name: string
    delivery_fee: number
    is_active: boolean
  }>
}

interface Address {
  id: number
  street_address: string
  additional_info?: string
  city_id: number
  zone_id: number
  is_default: boolean
}

export default function EditAddressPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const addressId = params.id
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [cities, setCities] = useState<City[]>([])
  const [address, setAddress] = useState<Address | null>(null)
  const [selectedCity, setSelectedCity] = useState<string>('')
  const [selectedZone, setSelectedZone] = useState<string>('')
  const [deliveryFee, setDeliveryFee] = useState(0)
  const [formData, setFormData] = useState({
    street_address: '',
    additional_info: '',
    is_default: false
  })

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      router.push('/auth/login?redirect=/account/addresses/' + addressId + '/edit')
      return
    }

    if (session?.user && addressId) {
      fetchData()
    }
  }, [session, status, router, addressId])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch cities
      const citiesResponse = await fetch('/api/locations')
      if (citiesResponse.ok) {
        const citiesData = await citiesResponse.json()
        setCities(citiesData.cities || [])
      }

      // Fetch address details
      const addressResponse = await fetch(`/api/user/addresses/${addressId}`)
      if (addressResponse.ok) {
        const addressData = await addressResponse.json()
        setAddress(addressData.data)
        setFormData({
          street_address: addressData.data.street_address,
          additional_info: addressData.data.additional_info || '',
          is_default: addressData.data.is_default
        })
        setSelectedCity(addressData.data.city_id.toString())
        setSelectedZone(addressData.data.zone_id.toString())
        
        // Set delivery fee
        const city = citiesData.cities?.find((c: City) => c.id === addressData.data.city_id)
        if (city) {
          const zone = city.zones.find((z: any) => z.id === addressData.data.zone_id)
          if (zone) {
            setDeliveryFee(zone.delivery_fee)
          }
        }
      } else {
        toast.error('Address not found')
        router.push('/account?tab=addresses')
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load address data')
      router.push('/account?tab=addresses')
    } finally {
      setLoading(false)
    }
  }

  const handleCityChange = (cityId: string) => {
    setSelectedCity(cityId)
    setSelectedZone('')
    setDeliveryFee(0)
  }

  const handleZoneChange = (zoneId: string) => {
    setSelectedZone(zoneId)
    
    // Find delivery fee for selected zone
    if (selectedCity) {
      const city = cities.find(c => c.id.toString() === selectedCity)
      if (city) {
        const zone = city.zones.find(z => z.id.toString() === zoneId)
        if (zone) {
          setDeliveryFee(zone.delivery_fee)
        }
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedCity || !selectedZone || !formData.street_address.trim()) {
      toast.error('Please fill in all required fields')
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/user/addresses/${addressId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          street_address: formData.street_address,
          additional_info: formData.additional_info,
          city_id: parseInt(selectedCity),
          zone_id: parseInt(selectedZone),
          is_default: formData.is_default
        })
      })

      if (response.ok) {
        toast.success('Address updated successfully')
        router.push('/account?tab=addresses')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update address')
      }
    } catch (error) {
      console.error('Error updating address:', error)
      toast.error('Error updating address')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-pink-500 mx-auto mb-4" />
          <p className="text-pink-800">Loading address...</p>
        </div>
      </div>
    )
  }

  if (!session?.user || !address) {
    return null
  }

  const selectedCityData = cities.find(city => city.id.toString() === selectedCity)

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100">
      <div className="container mx-auto p-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/account?tab=addresses" className="inline-flex items-center text-pink-600 hover:text-pink-800 mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Account
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Address</h1>
            <p className="text-gray-600">Update your delivery address information</p>
          </div>

          <Card className="border-2 border-pink-200 rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-pink-800">
                <MapPin className="h-5 w-5" />
                Edit Delivery Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="street_address" className="text-sm font-medium text-gray-700">
                    Street Address *
                  </Label>
                  <Input
                    id="street_address"
                    type="text"
                    value={formData.street_address}
                    onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
                    placeholder="Enter your street address"
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="additional_info" className="text-sm font-medium text-gray-700">
                    Additional Information
                  </Label>
                  <Textarea
                    id="additional_info"
                    value={formData.additional_info}
                    onChange={(e) => setFormData({ ...formData, additional_info: e.target.value })}
                    placeholder="Apartment, suite, building, etc. (optional)"
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                      City *
                    </Label>
                    <Select value={selectedCity} onValueChange={handleCityChange}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select a city" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city.id} value={city.id.toString()}>
                            {city.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="zone" className="text-sm font-medium text-gray-700">
                      Zone *
                    </Label>
                    <Select value={selectedZone} onValueChange={handleZoneChange} disabled={!selectedCity}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select a zone" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedCityData?.zones.map((zone) => (
                          <SelectItem key={zone.id} value={zone.id.toString()}>
                            {zone.name} - {zone.delivery_fee.toFixed(2)} EGP
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedZone && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">Delivery Information</h4>
                    <div className="space-y-1 text-sm text-blue-800">
                      <div className="flex justify-between">
                        <span>Zone:</span>
                        <span>{selectedCityData?.zones.find(z => z.id.toString() === selectedZone)?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivery Fee:</span>
                        <span>{deliveryFee.toFixed(2)} EGP</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={formData.is_default}
                    onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                    className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                  />
                  <Label htmlFor="is_default" className="text-sm text-gray-700">
                    Set as default address
                  </Label>
                </div>

                <div className="flex gap-4 pt-4">
                  <Link href="/account?tab=addresses" className="flex-1">
                    <Button type="button" variant="outline" className="w-full">
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={saving || !selectedCity || !selectedZone || !formData.street_address.trim()}
                    className="flex-1 bg-pink-600 hover:bg-pink-700"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Update Address
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 