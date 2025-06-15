// app/test/page.js
"use client";

export default function TestPage() {
  const testEnv = () => {
    console.log('Environment Variables Test:');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing');
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Page</h1>
      <button 
        onClick={testEnv}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Test Environment Variables
      </button>
      <div className="mt-4">
        <p>Check console for output</p>
      </div>
    </div>
  );
}