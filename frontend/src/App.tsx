function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-md p-10 flex flex-col items-center gap-4">
        <h1 className="text-3xl font-semibold text-gray-800">Tailwind is working ✓</h1>
        <p className="text-gray-500 text-sm">Ready to build the Doctor Booking System</p>
        <div className="flex gap-3">
          <span className="bg-purple-100 text-purple-700 text-xs font-medium px-3 py-1 rounded-full">React 19</span>
          <span className="bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">TypeScript</span>
          <span className="bg-teal-100 text-teal-700 text-xs font-medium px-3 py-1 rounded-full">Tailwind v3</span>
        </div>
      </div>
    </div>
  )
}

export default App 