import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import LoginModal from '../components/LoginModal';
import LandingNavbar from '../components/LandingNavbar';
import { useAuth } from '../context/useAuth';

const featureCards = [
  {
    icon: 'RS',
    title: 'Automated Dues Tracking',
    text: 'Continuously monitor outstanding balances, follow-up windows, and escalation priorities.',
  },
  {
    icon: 'RB',
    title: 'Role-Based Access System',
    text: 'Give each team member the exact permissions they need with secure, role-driven controls.',
  },
  {
    icon: 'LN',
    title: 'Legal Notice Automation',
    text: 'Generate legal notices quickly with standardized workflows and downloadable documents.',
  },
  {
    icon: 'TC',
    title: 'Telecaller Workflow',
    text: 'Track call outcomes, callback plans, and member communications in one streamlined system.',
  },
  {
    icon: 'RT',
    title: 'Real-Time Dashboard',
    text: 'See collection progress, pending cases, and recovery performance with live visual summaries.',
  },
  {
    icon: 'AI',
    title: 'AI-Based Insights',
    text: 'Prioritize cases with intelligent signals to improve recovery speed and operational efficiency.',
  },
];

const steps = [
  'Admin adds defaulters and assigns recovery teams',
  'Telecaller contacts members and records outcomes',
  'Agent follows up and collects payments',
  'Legal team sends notices for escalated cases',
  'Accounts verifies and reconciles payment records',
];

const testimonials = [
  {
    name: 'Rohit Khanna, Society Manager',
    review: 'FinioRevive gave us complete visibility and helped our team recover dues faster with less confusion.',
  },
  {
    name: 'Ananya Shah, BDM Lead',
    review: 'The workflow clarity across telecalling, field follow-up, and legal action is exactly what we needed.',
  },
  {
    name: 'Vikas Mehta, Accounts Head',
    review: 'Reconciliation and audit trails are now structured, reliable, and easy to track in real time.',
  },
];

const counterTargets = {
  recoveries: 12450000,
  users: 1240,
  societies: 186,
  successRate: 94,
};

function useAnimatedCounters(start) {
  const [counts, setCounts] = useState({ recoveries: 0, users: 0, societies: 0, successRate: 0 });

  useEffect(() => {
    if (!start) return undefined;

    const duration = 1300;
    const startAt = performance.now();

    const tick = (now) => {
      const progress = Math.min(1, (now - startAt) / duration);
      setCounts({
        recoveries: Math.floor(counterTargets.recoveries * progress),
        users: Math.floor(counterTargets.users * progress),
        societies: Math.floor(counterTargets.societies * progress),
        successRate: Math.floor(counterTargets.successRate * progress),
      });
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
    return undefined;
  }, [start]);

  return counts;
}

export default function HomePage() {
  const { isAuthenticated, loading, login } = useAuth();
  const navigate = useNavigate();
  const [openLogin, setOpenLogin] = useState(false);
  const [startCounters, setStartCounters] = useState(false);
  const counts = useAnimatedCounters(startCounters);

  useEffect(() => {
    const timer = setTimeout(() => setStartCounters(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  const stats = useMemo(() => [
    { label: 'Total Recoveries', value: `Rs ${counts.recoveries.toLocaleString()}` },
    { label: 'Active Users', value: counts.users.toLocaleString() },
    { label: 'Societies Managed', value: counts.societies.toLocaleString() },
    { label: 'Success Rate', value: `${counts.successRate}%` },
  ], [counts]);

  const handleLogin = async (email, password) => {
    try {
      await login(email, password);
      toast.success('Login successful');
      setOpenLogin(false);
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <LandingNavbar onLoginClick={() => setOpenLogin(true)} />

      <section id="home" className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-800">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-blue-300/20 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-24 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-28">
          <div>
            <p className="inline-block rounded-full border border-cyan-300/40 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-cyan-100">
              FinioRevive Platform
            </p>
            <h1 className="mt-5 text-4xl font-black leading-tight text-white sm:text-5xl">
              Reviving Finances with Intelligence
            </h1>
            <p className="mt-4 max-w-xl text-base text-cyan-50/90 sm:text-lg">
              Smart financial recovery system with AI-powered insights and automation.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setOpenLogin(true)}
                className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-cyan-100"
              >
                Login
              </button>
              <a
                href="#about"
                className="rounded-xl border border-white/40 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20"
              >
                Learn More
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm">
            <svg viewBox="0 0 520 330" className="h-auto w-full" role="img" aria-label="Analytics illustration">
              <rect x="20" y="20" width="480" height="290" rx="20" fill="rgba(255,255,255,0.12)" />
              <rect x="56" y="60" width="170" height="90" rx="14" fill="rgba(255,255,255,0.18)" />
              <rect x="246" y="60" width="220" height="90" rx="14" fill="rgba(255,255,255,0.18)" />
              <rect x="56" y="170" width="410" height="100" rx="14" fill="rgba(255,255,255,0.16)" />
              <path d="M86 238 L150 210 L210 225 L280 186 L350 198 L420 160" stroke="#7dd3fc" strokeWidth="6" fill="none" strokeLinecap="round" />
              <circle cx="150" cy="210" r="6" fill="#7dd3fc" />
              <circle cx="280" cy="186" r="6" fill="#7dd3fc" />
              <circle cx="420" cy="160" r="6" fill="#7dd3fc" />
            </svg>
          </div>
        </div>
      </section>

      <section id="about" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-black tracking-tight text-slate-900">About FinioRevive</h2>
        <p className="mt-4 max-w-4xl text-slate-600">
          FinioRevive is a professional financial recovery platform built for structured operations across societies and teams.
          It tracks dues, payments, defaulters, and activity history while enabling faster decisions through intelligent,
          workflow-driven automation.
        </p>
      </section>

      <section id="features" className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Core Features</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featureCards.map((card) => (
              <article key={card.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-xs font-extrabold text-white">{card.icon}</span>
                <h3 className="mt-4 text-lg font-extrabold text-slate-900">{card.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{card.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-black tracking-tight text-slate-900">How It Works</h2>
        <ol className="mt-7 grid gap-4 lg:grid-cols-5">
          {steps.map((step, idx) => (
            <li key={step} className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-cyan-700">Step {idx + 1}</p>
              <p className="mt-2 text-sm font-medium text-slate-700">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-slate-200 bg-slate-100">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Why Teams Choose FinioRevive</h2>
          <ul className="mt-6 grid gap-3 text-sm font-semibold text-slate-700 sm:grid-cols-2 lg:grid-cols-3">
            <li className="rounded-xl border border-slate-200 bg-white p-4">Saves time and effort with streamlined recovery workflows</li>
            <li className="rounded-xl border border-slate-200 bg-white p-4">Reduces manual errors through standardized role-based operations</li>
            <li className="rounded-xl border border-slate-200 bg-white p-4">Improves recovery rate with prioritized actionable insights</li>
            <li className="rounded-xl border border-slate-200 bg-white p-4">Enables real-time monitoring for every team function</li>
            <li className="rounded-xl border border-slate-200 bg-white p-4">Secure and scalable architecture ready for growth</li>
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-black tracking-tight text-slate-900">Stats and Achievements</h2>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <article key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.15em] text-slate-500">{stat.label}</p>
              <p className="mt-3 text-3xl font-black text-slate-900">{stat.value}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black tracking-tight text-slate-900">Trusted by Recovery Teams</h2>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {testimonials.map((item) => (
              <article key={item.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-amber-600">★★★★★</p>
                <p className="mt-3 text-sm text-slate-700">{item.review}</p>
                <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{item.name}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-slate-900 to-cyan-800">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-white">Start managing your finances smarter today</h2>
          <button
            type="button"
            onClick={() => setOpenLogin(true)}
            className="mt-6 rounded-xl bg-white px-6 py-3 text-sm font-bold text-slate-900 transition hover:bg-cyan-100"
          >
            Login Now
          </button>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-950 text-slate-200">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-5 px-4 py-8 text-sm sm:px-6 lg:flex-row lg:items-center lg:px-8">
          <div>
            <p className="text-lg font-extrabold">FinioRevive</p>
            <p className="text-slate-400">Reviving Finances with Intelligence</p>
          </div>
          <div className="flex gap-5 text-slate-300">
            <a href="#home" className="hover:text-white">Home</a>
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#about" className="hover:text-white">Contact</a>
          </div>
          <div className="text-slate-400">
            <p>Email: support@finiorevive.com</p>
            <p>Phone: +91 98765 43210</p>
          </div>
        </div>
        <p className="border-t border-slate-800 py-3 text-center text-xs text-slate-500">© {new Date().getFullYear()} FinioRevive. All rights reserved.</p>
      </footer>

      <LoginModal open={openLogin} onClose={() => setOpenLogin(false)} onSubmit={handleLogin} loading={loading} />
    </div>
  );
}
