import Image from "next/image";
import { ClientFeatured, ClientNearYou, ClientPopular, ClientSponsored, ClientByCategories } from './client-sections';

export default function HomePage() {
  // Debug environment variable
  const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL;
  console.log('STRAPI URL:', strapiUrl);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  
  // Check if we're in production and environment variable is missing
  const isProduction = process.env.NODE_ENV === 'production';
  const hasStrapiUrl = strapiUrl && strapiUrl !== 'http://localhost:1337';
  
  // Test all environment variables
  const allEnvVars = {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_STRAPI_URL: process.env.NEXT_PUBLIC_STRAPI_URL,
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
  };
  
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-4xl font-bold text-center">Dojdu</h1>
      
      {/* Debug info - remove this later */}
      <div className="bg-yellow-100 p-4 rounded border">
        <p><strong>Debug Info:</strong></p>
        <p>STRAPI URL: {strapiUrl || 'NOT SET'}</p>
        <p>NODE_ENV: {process.env.NODE_ENV || 'NOT SET'}</p>
        <p>Is Production: {isProduction ? 'YES' : 'NO'}</p>
        <p>Has Valid Strapi URL: {hasStrapiUrl ? 'YES' : 'NO'}</p>
        <p>VERCEL: {process.env.VERCEL || 'NOT SET'}</p>
        <p>VERCEL_ENV: {process.env.VERCEL_ENV || 'NOT SET'}</p>
        <hr className="my-2" />
        <p><strong>All Environment Variables:</strong></p>
        <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
          {JSON.stringify(allEnvVars, null, 2)}
        </pre>
        {isProduction && !hasStrapiUrl && (
          <div className="bg-red-100 p-2 mt-2 rounded">
            <p className="text-red-800 font-bold">ERROR: Environment variable NEXT_PUBLIC_STRAPI_URL is not set in production!</p>
          </div>
        )}
      </div>
      
      <div className="text-center">
        <p className="text-lg">Welcome to Dojdu - Event Portal</p>
        <p className="text-gray-600">This is a simplified test version</p>
      </div>
      
      <div className="bg-blue-100 p-4 rounded border">
        <p><strong>Test Links:</strong></p>
        <a href="/test" className="text-blue-600 underline">Go to Test Page</a>
      </div>
    </div>
  );
}
