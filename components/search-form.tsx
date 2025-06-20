"use client"

import { useState } from "react"
import { SearchIcon } from "lucide-react"
import { Input } from "@/components/ui/input"

export function SearchForm() {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="relative">
      <div
        className={`flex items-center rounded-md border border-pink-200 bg-pink-50 ${
          isExpanded ? "w-64" : "w-10"
        } transition-all duration-300 ease-in-out`}
      >
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center text-pink-500"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <SearchIcon className="h-4 w-4" />
          <span className="sr-only">Search</span>
        </button>
        <Input
          type="search"
          placeholder="Search products..."
          className={`h-10 border-0 bg-transparent focus-visible:ring-0 ${
            isExpanded ? "w-full opacity-100" : "w-0 opacity-0"
          } transition-all duration-300 ease-in-out`}
        />
      </div>
    </div>
  )
}
