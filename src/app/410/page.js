export const metadata = {
  title: "Page No Longer Available",
  robots: { index: false, follow: true },
};

export default function GonePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <div className="mx-auto max-w-xl text-center">

        {/* Status Code */}
        <h1 className="text-8xl font-extrabold tracking-tight text-violet-700">
          410
        </h1>

        {/* Heading */}
        <h2 className="mt-6 text-3xl font-bold text-gray-900">
          Page No Longer Available
        </h2>

        {/* Description */}
        <p className="mt-4 text-lg leading-8 text-gray-600">
          Sorry, this page has been permanently removed or is
          no longer available. Please visit our homepage to
          explore our services.
        </p>

        {/* Back to Home Button */}
        <div className="mt-8">
          <a
            href="/"
            className="inline-flex items-center rounded-lg
              book-btn-style px-6 py-3 font-semibold text-white
              transition hover:book-btn-style"
          >
            Back to Homepage
          </a>
        </div>

        {/* Support Text */}
        <p className="mt-8 text-sm text-gray-500">
          Need help? Explore our professional home services.
        </p>

      </div>
    </main>
  );
}