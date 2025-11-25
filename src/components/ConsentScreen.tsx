"use client";

import { useState } from "react";

interface ConsentScreenProps {
  onConsent: () => void;
}

export default function ConsentScreen({ onConsent }: ConsentScreenProps) {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1
          className="text-3xl font-bold mb-6 text-center"
          style={{
            color: "#3D4D2E",
            fontFamily: "'Playfair Display', Georgia, serif",
            fontWeight: 700,
          }}
        >
          Welcome to The S.M.A.R.T. Method
        </h1>

        <div className="space-y-6">
          <div>
            <h2
              className="text-xl font-semibold mb-4"
              style={{
                color: "#3D4D2E",
                fontFamily: "'Playfair Display', Georgia, serif",
                fontWeight: 700,
              }}
            >
              About Your Assessment
            </h2>
            <p className="leading-relaxed" style={{ color: "#1A1A1A" }}>
              This assessment is designed to help you discover your path to
              personal transformation. Through a series of thoughtful questions,
              we&apos;ll create a personalized 30-day protocol tailored
              specifically to your goals and challenges.
            </p>
          </div>

          <div>
            <h2
              className="text-xl font-semibold mb-4"
              style={{
                color: "#3D4D2E",
                fontFamily: "'Playfair Display', Georgia, serif",
                fontWeight: 700,
              }}
            >
              Privacy & Consent
            </h2>
            <p className="leading-relaxed" style={{ color: "#1A1A1A" }}>
              By proceeding, you consent to the collection and processing of
              your responses for the purpose of generating your personalized
              protocol. Your data is encrypted and stored securely, and will not
              be shared with third parties.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="consent"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-4 h-4 border-gray-300 rounded focus:ring-2"
              style={{ accentColor: "#3D4D2E" }}
            />
            <label htmlFor="consent" style={{ color: "#1A1A1A" }}>
              I understand and agree to proceed with the assessment
            </label>
          </div>

          <div className="text-center">
            <button
              onClick={onConsent}
              disabled={!agreed}
              className="text-white px-8 py-3 rounded-lg text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:opacity-90"
              style={{ backgroundColor: "#7ED321", color: "#FFFFFF", fontFamily: "'Inter', sans-serif", fontWeight: 600 }}
            >
              Begin Assessment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
