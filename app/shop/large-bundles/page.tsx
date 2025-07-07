import { products } from "@/lib/data"
import { ProductCard } from "@/components/product-card"
import { PageHeader } from "@/components/page-header"

export default function LargeBundlesPage() {
  // Filter large bundle products (only the original large bundle product)
  const largeBundleProducts = products.filter((p) => p.type === "bundle" && p.category === "Large Bundles")

  return (
    <div className="bg-gradient-to-br from-pastel-pink-50 via-pastel-rose-50 to-pastel-pink-100 min-h-screen">
      <PageHeader title="Large Cookie Bundles" description="Create your perfect mix of full-sized cookies" />

      <div className="container py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {largeBundleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {largeBundleProducts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-xl text-pink-600">No bundles available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  )
}
