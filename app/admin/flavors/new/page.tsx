"use client"

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import Link from 'next/link'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { Switch } from '@/components/ui/switch'

export default function NewFlavorPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [miniPrice, setMiniPrice] = useState('')
  const [mediumPrice, setMediumPrice] = useState('')
  const [largePrice, setLargePrice] = useState('')
  const [enabled, setEnabled] = useState(true)
  const [images, setImages] = useState<File[]>([])
  const [coverImageIndex, setCoverImageIndex] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files)
      setImages(prev => [...prev, ...newImages])
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
    if (coverImageIndex === index) {
      setCoverImageIndex(null)
    } else if (coverImageIndex !== null && coverImageIndex > index) {
      setCoverImageIndex(coverImageIndex - 1)
    }
  }

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    setImages(prev => [...prev, ...droppedFiles])
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('name', name)
      formData.append('description', description)
      formData.append('miniPrice', miniPrice)
      formData.append('mediumPrice', mediumPrice)
      formData.append('largePrice', largePrice)
      formData.append('enabled', enabled.toString())
      images.forEach((image, index) => {
        formData.append('images', image)
        if (index === coverImageIndex) {
          formData.append('coverImageIndex', index.toString())
        }
      })

      const response = await fetch('/api/flavors', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to create flavor')
      }

      toast({
        title: 'Success',
        description: 'Flavor created successfully!'
      })
      router.push('/admin/flavors')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error creating flavor',
        variant: 'destructive'
      })
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Side Menu */}
      <aside className="w-64 bg-white dark:bg-gray-800 shadow-lg flex flex-col py-8 px-4 min-h-screen">
        <nav className="flex flex-col space-y-4">
          <Link href="/admin/flavors">
            <span className="block py-2 px-4 rounded-lg text-lg font-semibold text-gray-800 dark:text-gray-100 hover:bg-pink-100 dark:hover:bg-pink-900 transition">🍪 Flavors</span>
          </Link>
          {/* Add more menu items here */}
        </nav>
      </aside>
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 w-full max-w-xl mt-16">
          <h1 className="text-3xl font-bold mb-6 text-center">Add New Flavor</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                rows={4}
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mini_price">Mini Price Addon (EGP)</Label>
                <Input
                  id="mini_price"
                  type="number"
                  step="0.01"
                  value={miniPrice}
                  onChange={(e) => setMiniPrice(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medium_price">Medium Price Addon (EGP)</Label>
                <Input
                  id="medium_price"
                  type="number"
                  step="0.01"
                  value={mediumPrice}
                  onChange={(e) => setMediumPrice(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="large_price">Large Price Addon (EGP)</Label>
                <Input
                  id="large_price"
                  type="number"
                  step="0.01"
                  value={largePrice}
                  onChange={(e) => setLargePrice(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="enabled"
                checked={enabled}
                onCheckedChange={setEnabled}
              />
              <Label htmlFor="enabled" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Enabled
              </Label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Images
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center ${
                  isDragging
                    ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
              >
                <input
                  type="file"
                  id="images"
                  onChange={handleImageChange}
                  multiple
                  accept="image/*"
                  className="hidden"
                />
                <label
                  htmlFor="images"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                >
                  <Upload className="w-8 h-8 text-gray-400" />
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-medium text-pink-500">Click to upload</span> or drag and drop
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </label>
              </div>
            </div>
            {images.length > 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {images.map((image, index) => (
                    <div
                      key={index}
                      className={`relative group rounded-lg overflow-hidden ${
                        coverImageIndex === index
                          ? 'ring-2 ring-pink-500'
                          : 'ring-1 ring-gray-200 dark:ring-gray-700'
                      }`}
                    >
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                        <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            type="button"
                            onClick={() => setCoverImageIndex(index)}
                            className={`p-2 rounded-full ${
                              coverImageIndex === index
                                ? 'bg-pink-500 text-white'
                                : 'bg-white text-gray-700 hover:bg-pink-500 hover:text-white'
                            }`}
                            title="Set as cover image"
                          >
                            <ImageIcon className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="p-2 rounded-full bg-white text-gray-700 hover:bg-red-500 hover:text-white"
                            title="Remove image"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {coverImageIndex === index && (
                        <div className="absolute top-2 left-2 bg-pink-500 text-white text-xs px-2 py-1 rounded">
                          Cover
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {images.length} image{images.length !== 1 ? 's' : ''} selected
                  {coverImageIndex !== null && ' • Cover image set'}
                </p>
              </div>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-lg py-3 font-bold text-lg shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Flavor'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
} 