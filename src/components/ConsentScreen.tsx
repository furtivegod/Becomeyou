"use client"

import { useState } from "react"

interface ConsentScreenProps {
  onConsent: () => void
}

export default function ConsentScreen({ onConsent }: ConsentScreenProps) {
  const [agreed, setAgreed] = useState(false)

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Welcome to BECOME YOU
        </h1>
        
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              About Your Assessment
            </h2>
            <p className="text-gray-600 leading-relaxed">
              This assessment is designed to help you discover your path to personal transformation. 
              Through a series of thoughtful questions, we&apos;ll create a personalized 30-day protocol
              tailored specifically to your goals and challenges.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              What to Expect
            </h2>
            <ul className="text-gray-600 space-y-2">
              <li>• A conversational assessment that takes 10-15 minutes</li>
              <li>• Questions about your current state, goals, and challenges</li>
              <li>• A personalized 30-day protocol delivered via email</li>
              <li>• Your responses are kept private and secure</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Privacy & Consent
            </h2>
            <p className="text-gray-600 leading-relaxed">
              By proceeding, you consent to the collection and processing of your responses 
              for the purpose of generating your personalized protocol. Your data is encrypted 
              and stored securely, and will not be shared with third parties.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="consent"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="consent" className="text-gray-700">
              I understand and agree to proceed with the assessment
            </label>
          </div>

          <div className="text-center">
            <button
              onClick={onConsent}
              disabled={!agreed}
              className="bg-blue-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Begin Assessment
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}