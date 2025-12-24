import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-200">
            <h2 className="text-4xl font-bold mb-4">Not Found</h2>
            <p className="mb-4">Could not find requested resource</p>
            <Link href="/" className="text-indigo-400 hover:text-indigo-300 underline">
                Return Home
            </Link>
        </div>
    )
}
