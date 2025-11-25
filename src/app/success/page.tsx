"use client";

import { useEffect, useState } from "react";

export default function SuccessPage() {
  const [userEmail, setUserEmail] = useState("your email.");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLatestSession();
  }, []);

  const fetchLatestSession = async (retryCount = 0) => {
    try {
      const response = await fetch("/api/latest-session");
      if (response.ok) {
        const data = await response.json();
        setUserEmail(data.email);
        setIsLoading(false);
      } else {
        // If no session found and we haven't retried too many times, wait and retry
        if (retryCount < 3) {
          console.log(
            `No session found, retrying in 5 seconds... (attempt ${retryCount + 1})`
          );
          setTimeout(() => fetchLatestSession(retryCount + 1), 5000);
        } else {
          // Fallback if no session found after retries
          setUserEmail("the email you used for purchase");
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error("Error fetching latest session:", error);
      if (retryCount < 3) {
        setTimeout(() => fetchLatestSession(retryCount + 1), 5000);
      } else {
        setUserEmail("the email you used for purchase");
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F5F3ED" }}>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          {/* Main Headline */}
          <h1
            className="text-4xl md:text-5xl font-bold mb-6"
            style={{
              color: "#3D4D2E",
              fontFamily: "'Playfair Display', Georgia, serif",
              fontWeight: 700,
            }}
          >
            You Just Made the Right Decision.
          </h1>

          <p
            className="text-xl mb-12 max-w-2xl mx-auto"
            style={{ color: "#1A1A1A", fontFamily: "'Inter', sans-serif", fontWeight: 400 }}
          >
            Your personalized S.M.A.R.T. Assessment is ready to begin. In just
            minutes, you're going to uncover the exact patterns that have been
            keeping you stuck—and get a protocol built specifically to break
            through them.
          </p>

          {/* Email Confirmation */}
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8 mb-8 sm:mb-12">
            <h2
              className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6"
              style={{
                color: "#3D4D2E",
                fontFamily: "'Playfair Display', Georgia, serif",
                fontWeight: 700,
              }}
            >
              📧 Check Your Email Right Now
            </h2>
            <div className="text-left space-y-3 sm:space-y-4">
              <p className="text-sm sm:text-base" style={{ color: "#1A1A1A" }}>
                We've sent your assessment link to{" "}
                <strong>
                  {isLoading ? (
                    <span className="inline-flex items-center">
                      <span className="animate-pulse">
                        loading your email...
                      </span>
                    </span>
                  ) : (
                    userEmail
                  )}
                </strong>
              </p>
              <div
                className="rounded-lg p-3 sm:p-4 text-xs sm:text-sm"
                style={{ backgroundColor: "#FFF3CD" }}
              >
                <p style={{ color: "#1A1A1A" }}>
                  <strong>Subject line:</strong> "Your S.M.A.R.T. Assessment Link –
                  Ready to Begin"
                </p>
                <p style={{ color: "#1A1A1A" }}>
                  <strong>From:</strong> thesmartmethod.co
                </p>
              </div>
              <p className="text-xs sm:text-sm" style={{ color: "#666" }}>
                Can't find it? Check your spam folder or contact support
              </p>
            </div>
          </div>

          {/* What Happens Next */}
          <div
            className="rounded-lg p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8"
            style={{ backgroundColor: "white" }}
          >
            <h3
              className="text-xl sm:text-2xl font-semibold mb-6 sm:mb-8"
              style={{
                color: "#3D4D2E",
                fontFamily: "'Playfair Display', Georgia, serif",
                fontWeight: 700,
              }}
            >
              What Happens Next
            </h3>
            <div className="text-left space-y-4 sm:space-y-6">
              <div className="flex items-start">
                <span
                  className="w-6 h-6 sm:w-8 sm:h-8 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold mr-3 sm:mr-4 mt-1 flex-shrink-0"
                    style={{ backgroundColor: "#3D4D2E" }}
                >
                  1
                </span>
                <div>
                  <h4
                    className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base"
                    style={{ color: "#3D4D2E", fontFamily: "'Inter', sans-serif", fontWeight: 500 }}
                  >
                    Click the link in your email
                  </h4>
                  <p
                    className="text-sm sm:text-base"
                    style={{ color: "#1A1A1A" }}
                  >
                    Your personalized assessment is ready and waiting. Find a
                    quiet space where you can be honest and reflective.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <span
                  className="w-6 h-6 sm:w-8 sm:h-8 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold mr-3 sm:mr-4 mt-1 flex-shrink-0"
                    style={{ backgroundColor: "#3D4D2E" }}
                >
                  2
                </span>
                <div>
                  <h4
                    className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base"
                    style={{ color: "#3D4D2E", fontFamily: "'Inter', sans-serif", fontWeight: 500 }}
                  >
                    Complete your assessment (10-15 minutes)
                  </h4>
                  <p
                    className="text-sm sm:text-base"
                    style={{ color: "#1A1A1A" }}
                  >
                    The AI will ask follow-up questions based on your answers to
                    map your specific patterns with precision. There's no time
                    limit—take breaks if you need them.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <span
                  className="w-6 h-6 sm:w-8 sm:h-8 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold mr-3 sm:mr-4 mt-1 flex-shrink-0"
                    style={{ backgroundColor: "#3D4D2E" }}
                >
                  3
                </span>
                <div>
                  <h4
                    className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base"
                    style={{ color: "#3D4D2E", fontFamily: "'Inter', sans-serif", fontWeight: 500 }}
                  >
                    Receive your protocol (Immediately after completion)
                  </h4>
                  <p
                    className="text-sm sm:text-base"
                    style={{ color: "#1A1A1A" }}
                  >
                    Your personalized 30-day transformation protocol will be
                    delivered to your email the moment you finish. Save it.
                    Reference it. Use it.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Support */}
          <div className="text-xs sm:text-sm" style={{ color: "#666" }}>
            <p>
              Need help?{" "}
              <a
                href="mailto:info@thesmartmethod.co"
                className="hover:underline"
                style={{ color: "#4A5D23" }}
              >
                Contact support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
