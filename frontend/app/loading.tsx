export default function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0815]">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-purple-400">
          Tenderr
        </h2>

        <p className="text-gray-400 mt-3 animate-pulse">
          Loading, please wait...
        </p>
      </div>
    </div>
  );
}