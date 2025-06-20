interface PageHeaderProps {
  title: string
  description?: string
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="bg-gradient-to-br from-pastel-pink-100 via-pastel-rose-100 to-pastel-pink-200 py-16">
      <div className="container text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pastel-pink-600 to-pastel-rose-600 mb-4">
          {title}
        </h1>
        {description && <p className="text-xl text-pastel-pink-700 max-w-2xl mx-auto">{description}</p>}
      </div>
    </div>
  )
}
