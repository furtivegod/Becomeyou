"use client"

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            You Just Made the Right Decision.
          </h1>
          
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Your personalized You 3.0 assessment is ready to begin. In just minutes, you're going to uncover 
            the exact patterns that have been keeping you stuck—and get a protocol built specifically to 
            break through them.
          </p>

          {/* Email Confirmation */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              📧 Check Your Email Right Now
            </h2>
            <div className="text-left space-y-4">
              <p className="text-gray-600">
                We've sent your assessment link to <strong>[their email]</strong>
              </p>
              <div className="bg-gray-50 rounded-lg p-4 text-sm">
                <p><strong>Subject line:</strong> "Your You 3.0 Assessment Link – Start Now"</p>
                <p><strong>From:</strong> [insert become you email]</p>
              </div>
              <p className="text-sm text-gray-500">
                Can't find it? Check your spam folder or contact support
              </p>
            </div>
          </div>

          {/* What Happens Next */}
          <div className="bg-blue-50 rounded-lg p-8 mb-8">
            <h3 className="text-2xl font-semibold text-blue-800 mb-8">
              What Happens Next
            </h3>
            <div className="text-left space-y-6">
              <div className="flex items-start">
                <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-4 mt-1 flex-shrink-0">1</span>
                <div>
                  <h4 className="font-semibold text-blue-800 mb-2">Click the link in your email</h4>
                  <p className="text-blue-700">
                    Your personalized assessment is ready and waiting. Find a quiet space where you can be honest 
                    and reflective.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-4 mt-1 flex-shrink-0">2</span>
                <div>
                  <h4 className="font-semibold text-blue-800 mb-2">Complete your assessment (20-35 minutes)</h4>
                  <p className="text-blue-700">
                    The AI will ask follow-up questions based on your answers to map your specific patterns with 
                    precision. There's no time limit—take breaks if you need them.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-4 mt-1 flex-shrink-0">3</span>
                <div>
                  <h4 className="font-semibold text-blue-800 mb-2">Receive your protocol (Immediately after completion)</h4>
                  <p className="text-blue-700">
                    Your personalized 30-day transformation protocol will be delivered to your email the moment 
                    you finish. Save it. Reference it. Use it.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Support */}
          <div className="text-sm text-gray-500">
            <p>Need help? <a href="mailto:support@becomeyou.ai" className="text-blue-600 hover:underline">Contact support</a></p>
          </div>
        </div>
      </div>
    </div>
  )
}