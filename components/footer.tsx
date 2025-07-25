'use client';

import Link from "next/link"
import Image from "next/image"
import { InstagramIcon, FacebookIcon, TwitterIcon, Heart } from "lucide-react"
import { useSocialSettings } from "@/hooks/use-social-settings"

export function Footer() {
  const { settings: socialSettings } = useSocialSettings();
  
  return (
    <footer className="border-t-2 border-pink-200 bg-gradient-to-br from-white to-pink-50">
      <div className="container mx-auto px-4 py-16">
        <div className="grid gap-8 md:gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Image src="/logo-no-bg.png" alt="Crumbled Logo" width={100} height={50} className="h-10 w-auto" />
            </div>
            <p className="text-pink-700 text-lg leading-relaxed mb-6">
              Handcrafted cookies made with premium ingredients and lots of love.
            </p>
            <div className="flex gap-4">
              <Link href={socialSettings.instagram_url || "https://www.instagram.com/crumbled.eg/"} target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:text-pink-700 transition-all hover:scale-125">
                <InstagramIcon className="h-6 w-6" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link href={socialSettings.facebook_url || "#"} target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:text-pink-700 transition-all hover:scale-125">
                <FacebookIcon className="h-6 w-6" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href={socialSettings.tiktok_url || "https://www.tiktok.com/@crumbled.eg"} target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:text-pink-700 transition-all hover:scale-125">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
                <span className="sr-only">TikTok</span>
              </Link>
              <Link href={`https://wa.me/${socialSettings.whatsapp_number || "201040920275"}`} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:text-green-700 transition-all hover:scale-125">
                <svg className="h-6 w-6" viewBox="0 0 32 32" fill="currentColor">
                  <path d="M16 3C9.373 3 4 8.373 4 15c0 2.65.87 5.1 2.36 7.1L4 29l7.18-2.31A12.94 12.94 0 0 0 16 27c6.627 0 12-5.373 12-12S22.627 3 16 3zm0 22c-1.98 0-3.85-.58-5.41-1.58l-.39-.25-4.28 1.38 1.4-4.17-.25-.4A9.96 9.96 0 0 1 6 15c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10zm5.13-7.47c-.28-.14-1.65-.81-1.9-.9-.25-.09-.43-.14-.61.14-.18.28-.7.9-.86 1.08-.16.18-.32.2-.6.07-.28-.14-1.18-.43-2.25-1.37-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.43.12-.57.13-.13.28-.32.42-.48.14-.16.18-.28.28-.46.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.61-.47-.16-.01-.34-.01-.52-.01-.18 0-.48.07-.73.34-.25.27-.97.95-.97 2.3 0 1.35.99 2.65 1.13 2.83.14.18 1.95 2.98 4.73 4.06.66.28 1.18.45 1.58.58.66.21 1.26.18 1.73.11.53-.08 1.65-.67 1.88-1.32.23-.65.23-1.2.16-1.32-.07-.12-.25-.18-.53-.32z"/>
                </svg>
                <span className="sr-only">WhatsApp</span>
              </Link>
            </div>
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
                <Link href="/auth/register" className="text-pink-600 hover:text-pink-800 transition-colors">
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
              <li>
                <a href="/contact" className="text-pink-600 hover:text-pink-800 font-semibold transition-colors duration-200">Contact Us</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-4 flex flex-col sm:flex-row items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm">
          <svg className="h-7 w-7 text-green-500 flex-shrink-0" viewBox="0 0 32 32" fill="currentColor">
            <path d="M16 3C9.373 3 4 8.373 4 15c0 2.65.87 5.1 2.36 7.1L4 29l7.18-2.31A12.94 12.94 0 0 0 16 27c6.627 0 12-5.373 12-12S22.627 3 16 3zm0 22c-1.98 0-3.85-.58-5.41-1.58l-.39-.25-4.28 1.38 1.4-4.17-.25-.4A9.96 9.96 0 0 1 6 15c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10zm5.13-7.47c-.28-.14-1.65-.81-1.9-.9-.25-.09-.43-.14-.61.14-.18.28-.7.9-.86 1.08-.16.18-.32.2-.6.07-.28-.14-1.18-.43-2.25-1.37-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.43.12-.57.13-.13.28-.32.42-.48.14-.16.18-.28.28-.46.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.61-.47-.16-.01-.34-.01-.52-.01-.18 0-.48.07-.73.34-.25.27-.97.95-.97 2.3 0 1.35.99 2.65 1.13 2.83.14.18 1.95 2.98 4.73 4.06.66.28 1.18.45 1.58.58.66.21 1.26.18 1.73.11.53-.08 1.65-.67 1.88-1.32.23-.65.23-1.2.16-1.32-.07-.12-.25-.18-.53-.32z"/>
          </svg>
          <span className="text-green-800 font-semibold text-base sm:text-lg text-center sm:text-left">Chat with us on WhatsApp for instant support!</span>
          <a href={`https://wa.me/${socialSettings.whatsapp_number || "201040920275"}`} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto sm:ml-auto bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow transition-all text-center">Start Chat</a>
        </div>
        <div className="mt-12 border-t-2 border-pink-200 pt-8 text-center text-lg text-pink-600">
          <p className="flex items-center justify-center gap-2">
            © {new Date().getFullYear()} Crumbled Egypt. All rights reserved. Made with 
            <Heart className="h-5 w-5 text-red-500 fill-current" />
            <Heart className="h-5 w-5 text-red-500 fill-current" />
          </p>
        </div>
      </div>
    </footer>
  )
}
