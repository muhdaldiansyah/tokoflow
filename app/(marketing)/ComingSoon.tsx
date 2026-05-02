import { Mail, ShoppingBag } from "lucide-react";

export default function ComingSoon() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Logo + App Name */}
        <div className="flex items-center justify-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gray-900 flex items-center justify-center">
            <ShoppingBag className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-gray-900">Tokoflow</span>
        </div>

        {/* Heading */}
        <div className="space-y-4">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
            Coming Soon
          </h1>
          <p className="text-gray-500 leading-relaxed">
            Take WhatsApp orders, send digital receipts, and recap your day —
            all in one place.
          </p>
        </div>

        {/* Building message */}
        <div className="bg-gray-50 rounded-2xl p-6">
          <p className="text-sm text-gray-600 leading-relaxed">
            We're building something special for Malaysian small businesses.
            Stay tuned.
          </p>
        </div>

        {/* Contact */}
        <div className="space-y-3">
          <p className="text-xs text-gray-400">Have a question?</p>
          <a
            href="mailto:hello@tokoflow.com"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            <Mail className="h-4 w-4" />
            hello@tokoflow.com
          </a>
        </div>
      </div>
    </div>
  );
}
