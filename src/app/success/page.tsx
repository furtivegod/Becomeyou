"use client"

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Success Message */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Purchase Successful!
          </h1>
          
          <p className="text-xl text-gray-600 mb-8">
            Thank you for your purchase! Your personalized assessment is being prepared.
          </p>

          {/* Email Confirmation */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              📧 Check Your Email
            </h2>
            <p className="text-gray-600 mb-4">
              We've sent your assessment link to your email address.
            </p>
            <p className="text-sm text-gray-500">
              Click the link in your email to start your personalized You 3.0 assessment.
            </p>
          </div>

          {/* What's Next */}
          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">
              What happens next?
            </h3>
            <div className="text-left space-y-3">
              <div className="flex items-start">
                <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</span>
                <p className="text-blue-700">Click the magic link in your email</p>
              </div>
              <div className="flex items-start">
                <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</span>
                <p className="text-blue-700">Complete your personalized assessment</p>
              </div>
              <div className="flex items-start">
                <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</span>
                <p className="text-blue-700">Receive your 30-day transformation protocol</p>
              </div>
            </div>
          </div>

          {/* Support */}
          <div className="text-sm text-gray-500">
            <p>Didn't receive the email? Check your spam folder or</p>
            <a href="mailto:support@becomeyou.ai" className="text-blue-600 hover:underline">
              contact support
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}