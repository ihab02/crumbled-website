import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { MapPin, Phone, Mail, Clock } from "lucide-react"

export default function ContactPage() {
  return (
    <div className="bg-gradient-to-br from-pastel-pink-50 via-pastel-rose-50 to-pastel-pink-100 min-h-screen">
      <PageHeader title="Contact Us" description="We'd love to hear from you" />

      <div className="container py-12">
        <div className="grid md:grid-cols-2 gap-12">
          <div className="bg-white rounded-3xl shadow-xl p-8 border-2 border-pastel-pink-200">
            <h2 className="text-2xl font-bold text-pastel-pink-800 mb-6">Send Us a Message</h2>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="first-name" className="text-pastel-pink-700">
                    First Name
                  </Label>
                  <Input
                    id="first-name"
                    placeholder="Enter your first name"
                    className="border-2 border-pastel-pink-200 rounded-xl focus:border-pastel-pink-400 focus:ring-pastel-pink-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name" className="text-pastel-pink-700">
                    Last Name
                  </Label>
                  <Input
                    id="last-name"
                    placeholder="Enter your last name"
                    className="border-2 border-pastel-pink-200 rounded-xl focus:border-pastel-pink-400 focus:ring-pastel-pink-400"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-pastel-pink-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="border-2 border-pastel-pink-200 rounded-xl focus:border-pastel-pink-400 focus:ring-pastel-pink-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject" className="text-pastel-pink-700">
                  Subject
                </Label>
                <Input
                  id="subject"
                  placeholder="Enter subject"
                  className="border-2 border-pastel-pink-200 rounded-xl focus:border-pastel-pink-400 focus:ring-pastel-pink-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message" className="text-pastel-pink-700">
                  Message
                </Label>
                <Textarea
                  id="message"
                  placeholder="Enter your message"
                  rows={5}
                  className="border-2 border-pastel-pink-200 rounded-xl focus:border-pastel-pink-400 focus:ring-pastel-pink-400"
                />
              </div>
              <Button className="w-full bg-gradient-to-r from-pastel-pink-500 to-pastel-rose-500 hover:from-pastel-pink-600 hover:to-pastel-rose-600 rounded-full py-6 text-lg font-semibold">
                Send Message
              </Button>
            </form>
          </div>

          <div className="space-y-8">
            <div className="bg-white rounded-3xl shadow-xl p-8 border-2 border-pastel-pink-200">
              <h2 className="text-2xl font-bold text-pastel-pink-800 mb-6">Contact Information</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-r from-pastel-pink-200 to-pastel-rose-200 p-3 rounded-full">
                    <MapPin className="h-6 w-6 text-pastel-pink-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-pastel-pink-800">Our Location</h3>
                    <p className="text-pastel-pink-700">123 Cookie Lane, Sweet City, SC 12345</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-r from-pastel-pink-200 to-pastel-rose-200 p-3 rounded-full">
                    <Phone className="h-6 w-6 text-pastel-pink-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-pastel-pink-800">Phone Number</h3>
                    <p className="text-pastel-pink-700">(555) 123-4567</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-r from-pastel-pink-200 to-pastel-rose-200 p-3 rounded-full">
                    <Mail className="h-6 w-6 text-pastel-pink-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-pastel-pink-800">Email Address</h3>
                    <p className="text-pastel-pink-700">hello@crumbled.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-r from-pastel-pink-200 to-pastel-rose-200 p-3 rounded-full">
                    <Clock className="h-6 w-6 text-pastel-pink-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-pastel-pink-800">Business Hours</h3>
                    <p className="text-pastel-pink-700">Monday - Friday: 9am - 6pm</p>
                    <p className="text-pastel-pink-700">Saturday: 10am - 4pm</p>
                    <p className="text-pastel-pink-700">Sunday: Closed</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-2 border-pastel-pink-200 h-80">
              {/* In a real app, you would embed a Google Map here */}
              <div className="h-full w-full bg-pastel-pink-100 flex items-center justify-center">
                <p className="text-pastel-pink-700 font-semibold">Map would be displayed here</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
