import { products } from "@/lib/data"
import { ProductCard } from "@/components/product-card"
import { PageHeader } from "@/components/page-header"

export default function BestSellersPage() {
  // Filter products with highest ratings
  const bestSellers = [...products].sort((a, b) => b.rating - a.rating).slice(0, 8)

  return (
    <div className="bg-gradient-to-br from-pastel-pink-50 via-pastel-rose-50 to-pastel-pink-100 min-h-screen">
      <PageHeader title="Best Sellers" description="Our most popular and loved cookies" />

      <div className="container py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {bestSellers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  )
}
