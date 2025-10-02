import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary-600 mb-4">
          My Firebase App
        </h1>
        <p className="text-gray-600 mb-8">
          Serverless Firebase + Capacitor + React + Tailwind
        </p>
        <div className="space-x-4">
          <Link to="/login" className="btn btn-primary">
            Get Started
          </Link>
          <a
            href="https://firebase.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
          >
            Learn More
          </a>
        </div>
      </div>
    </div>
  )
}
