"use client"

import { X, ShoppingBag, Trash2, GiftIcon, SparklesIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image: string
  isBundle?: boolean
  bundleSize?: number
  bundleDiscount?: number
}

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
  cart: CartItem[]
  removeItem: (id: string) => void
  totalPrice: number
}

export function CartDrawer({ isOpen, onClose, cart, removeItem, totalPrice }: CartDrawerProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm">
      <div
        className="absolute right-0 top-0 h-full w-full max-w-md bg-gradient-to-br from-white to-pastel-pink-50 shadow-2xl animate-slide-in-right border-l-4 border-pastel-pink-300"
        style={{ animationDuration: "300ms" }}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b-2 border-pastel-pink-200 bg-gradient-to-r from-pastel-pink-100 to-pastel-rose-100 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingBag className="h-6 w-6 text-pastel-pink-600" />
                <SparklesIcon className="h-3 w-3 text-pastel-pink-500 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <h2 className="text-xl font-bold text-pastel-pink-800">Your Cookie Bag</h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-pastel-pink-600 hover:bg-pastel-pink-200 transition-all hover:scale-110"
            >
              <X className="h-6 w-6" />
              <span className="sr-only">Close</span>
            </button>
          </div>

          {cart.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
              <div className="rounded-full bg-gradient-to-br from-pastel-pink-200 to-pastel-rose-200 p-8 shadow-lg">
                <ShoppingBag className="h-12 w-12 text-pastel-pink-600" />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-pastel-pink-800 mb-2">Your bag is empty</h3>
                <p className="text-lg text-pastel-pink-600">Add some delicious cookies to get started!</p>
              </div>
              <Button
                onClick={onClose}
                className="mt-6 bg-gradient-to-r from-pastel-pink-500 to-pastel-rose-500 hover:from-pastel-pink-600 hover:to-pastel-rose-600 rounded-full px-8 py-3 text-lg font-semibold shadow-lg transform hover:scale-105 transition-all"
              >
                🍪 Continue Shopping
              </Button>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-4 rounded-2xl border-2 p-4 shadow-md transition-all hover:shadow-lg ${
                        item.isBundle
                          ? "border-pastel-pink-400 bg-gradient-to-r from-pastel-pink-100 to-pastel-rose-100"
                          : "border-pastel-pink-200 bg-white"
                      }`}
                    >
                      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl shadow-md">
                        <img
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-pastel-pink-800 flex items-center gap-2 text-lg">
                              {item.isBundle && <GiftIcon className="h-4 w-4 text-pastel-pink-600" />}
                              {item.name}
                            </h4>
                            <div className="mt-2 flex items-center gap-3">
                              <span className="text-lg font-bold text-pastel-pink-700">${item.price.toFixed(2)}</span>
                              {item.isBundle && (
                                <span className="text-xs bg-gradient-to-r from-pastel-pink-500 to-pastel-rose-500 text-white px-3 py-1 rounded-full font-bold">
                                  Bundle
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="rounded-full p-2 text-pastel-pink-500 hover:bg-pastel-pink-200 hover:text-pastel-pink-700 transition-all hover:scale-110"
                          >
                            <Trash2 className="h-5 w-5" />
                            <span className="sr-only">Remove</span>
                          </button>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-sm font-medium text-pastel-pink-600">
                            {item.isBundle ? `Bundle of ${item.bundleSize}` : `Qty: ${item.quantity}`}
                          </span>
                          <span className="text-lg font-bold text-pastel-pink-800">
                            ${(item.price * (item.isBundle ? 1 : item.quantity)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="border-t-2 border-pastel-pink-200 bg-gradient-to-r from-pastel-pink-50 to-pastel-rose-50 p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-lg">
                    <span className="text-pastel-pink-700 font-medium">Subtotal</span>
                    <span className="font-bold text-pastel-pink-800">${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-lg">
                    <span className="text-pastel-pink-700 font-medium">Shipping</span>
                    <span className="font-bold text-pastel-pink-800">$4.99</span>
                  </div>
                  <div className="flex items-center justify-between border-t-2 border-pastel-pink-300 pt-4 text-xl">
                    <span className="font-bold text-pastel-pink-800">Total</span>
                    <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pastel-pink-600 to-pastel-rose-600">
                      ${(totalPrice + 4.99).toFixed(2)}
                    </span>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-pastel-pink-500 to-pastel-rose-500 hover:from-pastel-pink-600 hover:to-pastel-rose-600 rounded-full py-6 text-lg font-bold shadow-xl transform hover:scale-105 transition-all">
                    🛒 Proceed to Checkout
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
