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
            color: "#4A5D23",
            fontFamily: "Georgia, Times New Roman, serif",
          }}
        >
          Welcome to BECOME YOU
        </h1>

        <div className="space-y-6">
          <div>
            <h2
              className="text-xl font-semibold mb-4"
              style={{
                color: "#4A5D23",
                fontFamily: "Georgia, Times New Roman, serif",
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
                color: "#4A5D23",
                fontFamily: "Georgia, Times New Roman, serif",
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
              style={{ accentColor: "#4A5D23" }}
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
              style={{ backgroundColor: "#4A5D23" }}
            >
              Begin Assessment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
