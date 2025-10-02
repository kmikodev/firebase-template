export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="card max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6">Sign In</h2>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              className="input"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="btn btn-primary w-full">
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}
