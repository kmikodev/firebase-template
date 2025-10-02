export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold mb-2">Welcome</h3>
            <p className="text-gray-600">
              Your Firebase app is ready to go!
            </p>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-2">Next Steps</h3>
            <ul className="text-gray-600 space-y-1">
              <li>• Set up authentication</li>
              <li>• Configure Firestore</li>
              <li>• Add payment integration</li>
            </ul>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold mb-2">Resources</h3>
            <p className="text-gray-600">
              Check CLAUDE.md for guidance
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
