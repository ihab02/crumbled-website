"use client"

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 w-full max-w-xl">
        <h1 className="text-3xl font-bold mb-4 text-center">Admin Dashboard</h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 text-center mb-6">
          Welcome, Admin! Use the side menu to manage your site.
        </p>
      </div>
    </div>
  );
} 