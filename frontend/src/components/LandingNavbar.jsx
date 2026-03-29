export default function LandingNavbar({ onLoginClick }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <a href="#home" className="group flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 text-sm font-black text-white shadow-md shadow-cyan-500/30">
            FR
          </span>
          <div>
            <p className="text-lg font-extrabold tracking-tight text-slate-900">FinioRevive</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Financial Intelligence Platform</p>
          </div>
        </a>

        <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-700 md:flex">
          <a href="#home" className="transition hover:text-slate-900">Home</a>
          <a href="#features" className="transition hover:text-slate-900">Features</a>
          <a href="#about" className="transition hover:text-slate-900">About</a>
        </nav>

        <button
          type="button"
          onClick={onLoginClick}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          Login
        </button>
      </div>
    </header>
  );
}
