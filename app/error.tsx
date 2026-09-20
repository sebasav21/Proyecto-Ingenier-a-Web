"use client";

export default function Error({ error }: { error: Error }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-lg">
        <h2 className="text-red-700 font-bold text-lg mb-2">Error</h2>
        <p className="text-red-600 text-sm font-mono">{error.message}</p>
      </div>
    </div>
  );
}
