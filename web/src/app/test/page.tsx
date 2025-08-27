export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Page</h1>
      <p>If you can see this, Next.js routing is working!</p>
      <p>Current time: {new Date().toISOString()}</p>
      <p>Environment: {process.env.NODE_ENV}</p>
      <p>Strapi URL: {process.env.NEXT_PUBLIC_STRAPI_URL || 'NOT SET'}</p>
    </div>
  );
}
