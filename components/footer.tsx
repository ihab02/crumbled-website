import Link from "next/link"
import Image from "next/image"
import { InstagramIcon, FacebookIcon, TwitterIcon } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t-2 border-pink-200 bg-gradient-to-br from-white to-pink-50">
      <div className="container py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Image src="/logo-no-bg.png" alt="Crumbled Logo" width={100} height={50} className="h-10 w-auto" />
            </div>
            <p className="text-pink-700 text-lg leading-relaxed mb-6">
              Handcrafted cookies made with premium ingredients and lots of love.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="text-pink-500 hover:text-pink-700 transition-all hover:scale-125">
                <InstagramIcon className="h-6 w-6" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link href="#" className="text-pink-500 hover:text-pink-700 transition-all hover:scale-125">
                <FacebookIcon className="h-6 w-6" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href="#" className="text-pink-500 hover:text-pink-700 transition-all hover:scale-125">
                <TwitterIcon className="h-6 w-6" />
                <span className="sr-only">Twitter</span>
              </Link>
            </div>
          </div>
          <div>
            <h3 className="mb-6 font-bold text-xl text-pink-800">Products</h3>
            <ul className="space-y-3 text-base">
              <li>
                <Link href="/shop/best-sellers" className="text-pink-600 hover:text-pink-800 transition-colors">
                  Best Sellers
                </Link>
              </li>
              <li>
                <Link href="/shop/new-arrivals" className="text-pink-600 hover:text-pink-800 transition-colors">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link href="/shop/gift-sets" className="text-pink-600 hover:text-pink-800 transition-colors">
                  Gift Sets
                </Link>
              </li>
              <li>
                <Link href="/favorites" className="text-pink-600 hover:text-pink-800 transition-colors">
                  Favorites
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-6 font-bold text-xl text-pink-800">Company</h3>
            <ul className="space-y-3 text-base">
              <li>
                <Link href="/about" className="text-pink-600 hover:text-pink-800 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-pink-600 hover:text-pink-800 transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-6 font-bold text-xl text-pink-800">Account</h3>
            <ul className="space-y-3 text-base">
              <li>
                <Link href="/auth/login" className="text-pink-600 hover:text-pink-800 transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/auth/signup" className="text-pink-600 hover:text-pink-800 transition-colors">
                  Create Account
                </Link>
              </li>
              <li>
                        <Link href="/cart" className="text-pink-600 hover:text-pink-800 transition-colors">
          My Bag
                </Link>
              </li>
              <li>
                <Link href="/orders" className="text-pink-600 hover:text-pink-800 transition-colors">
                  Order History
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t-2 border-pink-200 pt-8 text-center text-lg text-pink-600">
          <p>© {new Date().getFullYear()} Crumbled. All rights reserved. Made with 💕</p>
        </div>
      </div>
    </footer>
  )
}
