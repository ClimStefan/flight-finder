import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Start Finding Deals
          </h1>
          <p className="text-gray-600">
            Create your free account in seconds
          </p>
        </div>
        <SignUp />
      </div>
    </div>
  );
}
