import { Flavor } from "@/lib/data"
import { useState } from "react"
import { Card, CardHeader, CardFooter, CardContent } from "@/components/ui/card"

interface FlavorFormData {
  name: string;
  price: number;
  description: string;
  image_url: string;
  category: string;
  type: string;
  in_stock: boolean;
  stock: number;
}

interface FlavorFormProps {
  flavor: Partial<Flavor> | null
  onSubmit: (flavor: Partial<Flavor>) => Promise<void>
  onCancel: () => void
  enhancedStockEnabled?: boolean
}

export function FlavorForm({ flavor, onSubmit, onCancel, enhancedStockEnabled = false }: FlavorFormProps) {
  const [formData, setFormData] = useState<FlavorFormData>({
    name: flavor?.name || "",
    price: flavor?.price || 0,
    description: flavor?.description || "",
    image_url: flavor?.image_url || "",
    category: flavor?.category || "Classic",
    type: flavor?.type || "regular",
    in_stock: flavor?.in_stock !== undefined ? flavor.in_stock : true,
    stock: flavor?.stock || 0,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    let newValue: string | number | boolean = value
    if (type === "number") {
      newValue = parseFloat(value) || 0
    } else if (name === "in_stock") {
      const evt = e as React.ChangeEvent<HTMLInputElement>;
      newValue = evt.checked;
    }
    setFormData((prev) => ({ ...prev, [name]: newValue }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const flavorData: Flavor = {
      id: flavor?.id || crypto.randomUUID(),
      name: formData.name,
      slug: flavor?.slug || formData.name.toLowerCase().replace(/\s+/g, "-"),
      price: formData.price,
      original_price: (flavor?.original_price === null) ? undefined : (flavor?.original_price as number),
      description: formData.description,
      image_url: formData.image_url || "/placeholder.svg?height=300&width=300",
      category: formData.category,
      type: formData.type,
      in_stock: formData.in_stock,
      rating: flavor?.rating || 4.5,
      reviews: flavor?.reviews || 0,
      total_stock: formData.stock,
      created_at: flavor?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    onSubmit(flavorData)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <h2 className="text-2xl font-bold"> { flavor ? "Edit Flavor" : "Add New Flavor" } </h2>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price ($)</label>
              <input
                type="number"
                id="price"
                name="price"
                step=".01"
                min="0"
                value={formData.price}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="image_url" className="block text-sm font-medium text-gray-700">Image URL (optional)</label>
            <input
              type="url"
              id="image_url"
              name="image_url"
              value={formData.image_url}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="Classic">Classic</option>
                <option value="Premium">Premium</option>
              </select>
            </div>
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="mini">Mini</option>
                <option value="large">Large</option>
                <option value="regular">Regular</option>
              </select>
            </div>
          </div>
          {enhancedStockEnabled ? (
            <div>
              <label htmlFor="stock" className="block text-sm font-medium text-gray-700">Stock (units)</label>
              <input
                type="number"
                id="stock"
                name="stock"
                min="0"
                value={formData.stock}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500"> (Stock is in units.) </p>
            </div>
          ) : (
            <div>
              <label htmlFor="in_stock" className="inline-flex items-center">
                <input
                  type="checkbox"
                  id="in_stock"
                  name="in_stock"
                  checked={formData.in_stock}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">In Stock</span>
              </label>
            </div>
          )}
        </form>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          onClick={handleSubmit}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          { flavor ? "Update Flavor" : "Add Flavor" }
        </button>
      </CardFooter>
    </Card>
  )
} 