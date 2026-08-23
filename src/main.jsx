import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { QRCodeSVG } from 'qrcode.react';

import {
  Gift,
  LogIn,
  LogOut,
  UserPlus,
  Star,
  Ticket,
  History,
  QrCode,
  ChevronRight,
  ScanLine,
  PlusCircle,
  Eye,
  EyeOff,
  Cake,
  FileText,
  CheckCircle,
  Copy,
  X,
  ShoppingBag,
  MessageCircle,
  Settings as SettingsIcon,
  User,
  Lock,
  Shield,
  Scale,
  Info,
  Save,
  LayoutDashboard,
  UtensilsCrossed,
  Users,
  Receipt,
  Image as ImageIcon,
  Store,
  SlidersHorizontal,
  Menu as MenuIcon,
  Search,
  Edit3,
  Trash2,
  Plus,
  MoreHorizontal,
  ChevronDown,
  Upload,
  Clock,
  Phone,
  Facebook,
  Instagram,
  Award,
  Sparkles,
  CakeSlice,
  Home as HomeIcon,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw
} from 'lucide-react';

import './styles.css';
import logo from './logo.jpg';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

/* =====================================================
   SMALL HELPERS
===================================================== */

function PasswordField({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false);

  return (
    <div className="field">
      <label>Password</label>

      <div className="password-wrap">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder || 'Your password'}
          required
          minLength={8}
        />

        <button
          type="button"
          className="password-toggle"
          onClick={() => setShow(v => !v)}
        >
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </div>
  );
}

function formatDate(date) {
  if (!date) return '—';

  return new Date(date).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function formatDateTime(date) {
  if (!date) return '—';

  return new Date(date).toLocaleString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function money(value) {
  return `₱${Number(value || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

/* =====================================================
   APP
===================================================== */

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function start() {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      if (data.session) {
        setSession(data.session);
        await loadProfile(data.session.user);
      } else {
        setLoading(false);
      }
    }

    start();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      if (!mounted) return;

      setSession(currentSession);

      if (currentSession) {
        await loadProfile(currentSession.user);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function loadProfile(user) {
    if (!user?.id) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error(error);
      setProfile(null);
      setLoading(false);
      return;
    }

    if (data) {
      setProfile(data);
      setLoading(false);
      return;
    }

    const metadata = user.user_metadata || {};

    const newCustomer = {
      id: user.id,
      full_name: metadata.full_name || '',
      phone: metadata.phone || null,
      email: user.email || null,
      birthday: metadata.birthday || null,
      points: 0,
      stamps: 0
    };

    const {
      data: createdProfile,
      error: createError
    } = await supabase
      .from('customers')
      .insert(newCustomer)
      .select()
      .single();

    if (createError) {
      console.error(createError);
      setProfile(null);
      setLoading(false);
      return;
    }

    setProfile(createdProfile);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-mark">🍣</div>
        <div className="loading-brand">AT HOME SUSHI</div>
        <div className="loading-text">
          Loading your loyalty club
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <Auth
        mode={mode}
        setMode={setMode}
      />
    );
  }

  return (
    <Dashboard
      session={session}
      profile={profile}
      reloadProfile={() => loadProfile(session.user)}
    />
  );
}

/* =====================================================
   AUTH
===================================================== */

function Auth({ mode, setMode }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const [remember, setRemember] = useState(
    localStorage.getItem('rememberLogin') === 'true'
  );

  useEffect(() => {
    const saved = localStorage.getItem('savedLoginEmail');

    if (saved) {
      setEmail(saved);
    }
  }, []);

  async function submit(e) {
    e.preventDefault();

    setBusy(true);
    setMsg('');

    if (mode === 'login') {
      if (remember) {
        localStorage.setItem('rememberLogin', 'true');
        localStorage.setItem('savedLoginEmail', email);
      } else {
        localStorage.removeItem('rememberLogin');
        localStorage.removeItem('savedLoginEmail');
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        setMsg(error.message);
      }

      setBusy(false);
      return;
    }

    if (!name.trim()) {
      setMsg('Please enter your full name.');
      setBusy(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: name.trim(),
          phone: phone.trim() || null,
          birthday: birthday || null
        }
      }
    });

    if (error) {
      setMsg(error.message);
      setBusy(false);
      return;
    }

    if (data?.session && data?.user) {
      await supabase
        .from('customers')
        .insert({
          id: data.user.id,
          full_name: name.trim(),
          phone: phone.trim() || null,
          email: data.user.email || email.trim(),
          birthday: birthday || null,
          points: 0,
          stamps: 0
        });
    }

    setName('');
    setPhone('');
    setBirthday('');
    setPassword('');

    setMsg(
      'Account created successfully! Please check your email to confirm your account, then log in.'
    );

    setMode('login');
    setBusy(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-shell">

        <div className="auth-brand">
          <img src={logo} alt="At Home Sushi" />
          <h1>AT HOME SUSHI</h1>
          <span>LOYALTY CLUB</span>
        </div>

        <div className="auth-card">

          <div className="auth-tabs">
            <button
              type="button"
              className={mode === 'login' ? 'active' : ''}
              onClick={() => {
                setMode('login');
                setMsg('');
              }}
            >
              <LogIn size={16} />
              Log in
            </button>

            <button
              type="button"
              className={mode === 'signup' ? 'active' : ''}
              onClick={() => {
                setMode('signup');
                setMsg('');
              }}
            >
              <UserPlus size={16} />
              Join
            </button>
          </div>

          <div className="auth-heading">
            <h2>
              {mode === 'login'
                ? 'Welcome back'
                : 'Join the club'}
            </h2>

            <p>
              {mode === 'login'
                ? 'Your sushi rewards are waiting.'
                : 'Earn Sushi Points with every order.'}
            </p>
          </div>

          <form onSubmit={submit}>

            {mode === 'signup' && (
              <>
                <div className="field">
                  <label>Full name</label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your name"
                    required
                  />
                </div>

                <div className="field">
                  <label>Phone number</label>
                  <input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="09xxxxxxxxx"
                  />
                </div>

                <div className="field">
                  <label>Birthday</label>
                  <input
                    type="date"
                    value={birthday}
                    onChange={e => setBirthday(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="field">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@email.com"
                required
              />
            </div>

            <PasswordField
              value={password}
              onChange={e => setPassword(e.target.value)}
            />

            {mode === 'login' && (
              <label className="remember-row">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
            )}

            {msg && <div className="notice">{msg}</div>}

            <button
              className="primary-button"
              disabled={busy}
              type="submit"
            >
              {busy
                ? 'Please wait...'
                : mode === 'login'
                ? 'Log in'
                : 'Create my account'}
            </button>

          </form>

          <div className="auth-switch">
            {mode === 'login'
              ? 'New here?'
              : 'Already a member?'}

            <button
              type="button"
              onClick={() => {
                setMode(
                  mode === 'login'
                    ? 'signup'
                    : 'login'
                );
                setMsg('');
              }}
            >
              {mode === 'login'
                ? 'Join the club'
                : 'Log in'}
            </button>
          </div>

        </div>

        <div className="auth-footer">
          Quick rolls. Bold flavors. Great rewards.
        </div>

      </div>
    </div>
  );
}

/* =====================================================
   CUSTOMER DASHBOARD
===================================================== */

function Dashboard({
  session,
  profile,
  reloadProfile
}) {
  const [tab, setTab] = useState('home');
  const [rewards, setRewards] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [birthdayReward, setBirthdayReward] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, [session.user.id]);

  useEffect(() => {
    if (profile) checkBirthdayReward();
  }, [profile]);

  async function loadDashboard() {
    const { data: rewardsData } = await supabase
      .from('rewards')
      .select('*')
      .eq('active', true)
      .order('points_required');

    setRewards(rewardsData || []);

    const { data: txData } = await supabase
      .from('transactions')
      .select('*')
      .eq('customer_id', session.user.id)
      .order('created_at', {
        ascending: false
      })
      .limit(30);

    setTransactions(txData || []);
  }

  async function checkBirthdayReward() {
    if (!profile?.birthday) return;

    const today = new Date();

    const birthdayToday =
      today.getMonth() === birthday.getMonth() &&
      today.getDate() === birthday.getDate();

    if (!birthdayToday) return;

    const year = today.getFullYear();

    const { data: claimed } = await supabase
      .from('birthday_claims')
      .select('id')
      .eq('customer_id', profile.id)
      .eq('birthday_year', year)
      .maybeSingle();

    if (claimed) return;

    const { data: reward } = await supabase
      .from('birthday_rewards')
      .select('*')
      .eq('active', true)
      .order('id')
      .limit(1)
      .maybeSingle();

    if (reward) setBirthdayReward(reward);
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  if (!profile) {
    return (
      <div className="loading-screen">
        <div className="loading-mark">🍣</div>
        <div className="loading-brand">
          AT HOME SUSHI
        </div>
        <div className="loading-text">
          Preparing your loyalty card
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">

      <header className="app-header">

        <div className="header-brand">
          <img src={logo} alt="At Home Sushi" />

          <div>
            <strong>AT HOME SUSHI</strong>
            <span>LOYALTY CLUB</span>
          </div>
        </div>

        <button
          className="header-action"
          onClick={logout}
        >
          <LogOut size={18} />
        </button>

      </header>

      <main className="app-main">

        {birthdayReward && (
          <div className="birthday-card">
            <div className="birthday-icon">
              <Cake size={19} />
            </div>

            <div>
              <span>YOUR BIRTHDAY REWARD</span>
              <strong>{birthdayReward.name}</strong>
              <p>{birthdayReward.reward_text}</p>
            </div>
          </div>
        )}

        {tab === 'home' && (
          <Home
            profile={profile}
            rewards={rewards}
            onGoRewards={() => setTab('rewards')}
          />
        )}

        {tab === 'card' && (
          <DigitalCard profile={profile} />
        )}

        {tab === 'rewards' && (
          <Rewards
            profile={profile}
            rewards={rewards}
            onRefresh={reloadProfile}
          />
        )}

        {tab === 'history' && (
          <HistoryTab transactions={transactions} />
        )}

        {tab === 'settings' && (
          <Settings
            session={session}
            profile={profile}
            reloadProfile={reloadProfile}
            onLogout={logout}
          />
        )}

      </main>

      <nav className="bottom-nav">

        <button
          className={tab === 'home' ? 'selected' : ''}
          onClick={() => setTab('home')}
        >
          <Star size={20} />
          <span>Home</span>
        </button>

        <button
          className={tab === 'card' ? 'selected' : ''}
          onClick={() => setTab('card')}
        >
          <QrCode size={20} />
          <span>My Card</span>
        </button>

        <button
          className={tab === 'rewards' ? 'selected' : ''}
          onClick={() => setTab('rewards')}
        >
          <Gift size={20} />
          <span>Rewards</span>
        </button>

        <button
          className={tab === 'history' ? 'selected' : ''}
          onClick={() => setTab('history')}
        >
          <History size={20} />
          <span>History</span>
        </button>

        <button
          className={tab === 'settings' ? 'selected' : ''}
          onClick={() => setTab('settings')}
        >
          <SettingsIcon size={20} />
          <span>Settings</span>
        </button>

      </nav>

    </div>
  );
}

/* =====================================================
   CUSTOMER HOME
===================================================== */

function Home({
  profile,
  rewards,
  onGoRewards
}) {
  const points = Number(profile?.points || 0);

  const [menu, setMenu] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [orderOpen, setOrderOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);

  useEffect(() => {
    loadMenu();
  }, []);

  async function loadMenu() {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('active', true)
      .order('sort_order', {
        ascending: true
      });

    if (error) console.error(error);

    setMenu(data || []);
    setMenuLoading(false);
  }

  const categories = [
    ['all', 'All'],
    ['appetizers', 'Appetizers'],
    ['classic', 'Classic Rolls'],
    ['specialty', 'Specialty Rolls'],
    ['signature', 'Signature Rolls'],
    ['veggie', 'Veggie'],
    ['nigiri', 'Nigiri'],
    ['sashimi', 'Sashimi'],
    ['platters', 'Platters']
  ];

  const filteredMenu =
    activeCategory === 'all'
      ? menu
      : menu.filter(
          item =>
            String(item.category || '').toLowerCase() ===
            activeCategory
        );

  return (
    <div className="home-page">

      <section className="home-hero">
        <div className="hero-inner">

          <div className="hero-label">
            AT HOME SUSHI
          </div>

          <h1>
            Good sushi.
            <br />
            <span>Better rewards.</span>
          </h1>

          <p>
            Enjoy your favorites, earn Sushi Points,
            and make every order count.
          </p>

          <div className="hero-buttons">

            <button
              className="hero-button primary"
              onClick={() =>
                document
                  .getElementById('menu-section')
                  ?.scrollIntoView({
                    behavior: 'smooth'
                  })
              }
            >
              Explore sushi
              <ChevronRight size={17} />
            </button>

            <button
              className="hero-button secondary"
              onClick={() =>
                document
                  .getElementById('points-section')
                  ?.scrollIntoView({
                    behavior: 'smooth'
                  })
              }
            >
              My Sushi Points
            </button>

          </div>

        </div>
      </section>

      <section
        id="points-section"
        className="home-section points-home"
      >

        <div className="section-label">
          YOUR LOYALTY
        </div>

        <h2>Your Sushi Points</h2>

        <p className="section-description">
          Every order brings you closer to something delicious.
        </p>

        <div className="points-card">

          <div>
            <span>POINT BALANCE</span>
            <strong>{points.toFixed(0)}</strong>
            <small>SUSHI POINTS</small>
          </div>

          <button onClick={onGoRewards}>
            <ChevronRight size={20} />
          </button>

        </div>

        <div className="earn-steps">

          <div>
            <b>01</b>
            <span>
              <strong>ORDER</strong>
              Enjoy your favorite sushi.
            </span>
          </div>

          <div>
            <b>02</b>
            <span>
              <strong>EARN</strong>
              ₱100 spent = 1 Sushi Point.
            </span>
          </div>

          <div>
            <b>03</b>
            <span>
              <strong>REDEEM</strong>
              Turn points into rewards.
            </span>
          </div>

        </div>

      </section>

      <section
        id="menu-section"
        className="home-section menu-home"
      >

        <div className="section-label">
          FROM OUR KITCHEN
        </div>

        <h2>Explore Our Menu</h2>

        <p className="section-description">
          Find your favorite roll, nigiri, sashimi or platter.
        </p>

        <div className="menu-categories">
          {categories.map(([id, label]) => (
            <button
              key={id}
              className={activeCategory === id ? 'active' : ''}
              onClick={() => setActiveCategory(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {menuLoading ? (
          <div className="empty-card large">
            <div className="loading-mark">🍣</div>
            <strong>Loading our menu...</strong>
          </div>
        ) : (
          <div className="menu-grid">

            {filteredMenu.map(item => (
              <article
                className="menu-item-card"
                key={item.id}
              >

                <div className="menu-item-image">

                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                    />
                  ) : (
                    <div className="photo-fallback">
                      <span>🍣</span>
                      <small>AT HOME SUSHI</small>
                    </div>
                  )}

                </div>

                <div className="menu-item-content">

                  <h3>{item.name}</h3>

                  {item.description && (
                    <p>{item.description}</p>
                  )}

                  <button
                    className="order-button"
                    onClick={() => {
                      setSelectedMenuItem(item);
                      setOrderOpen(true);
                    }}
                  >
                    Order this
                    <ChevronRight size={17} />
                  </button>

                </div>

              </article>
            ))}

          </div>
        )}

      </section>

      <section className="home-section rewards-home">

        <div className="section-label">
          YOUR BENEFITS
        </div>

        <h2>Rewards</h2>

        <p className="section-description">
          A little something for every sushi lover.
        </p>

        <div className="home-rewards">

          {rewards.slice(0, 3).map((reward, i) => (
            <div
              className="home-reward"
              key={reward.id}
            >
              <span>0{i + 1}</span>

              <div>
                <strong>{reward.name}</strong>
                <p>
                  {reward.description ||
                    'Use your Sushi Points for this reward.'}
                </p>
              </div>

              <b>{reward.points_required}</b>
            </div>
          ))}

        </div>

        <button
          className="primary-button"
          onClick={onGoRewards}
        >
          View all rewards
          <ChevronRight size={17} />
        </button>

      </section>

      {orderOpen && selectedMenuItem && (
        <div
          className="modal-overlay"
          onClick={() => setOrderOpen(false)}
        >

          <div
            className="order-modal"
            onClick={e => e.stopPropagation()}
          >

            <button
              className="modal-close"
              onClick={() => setOrderOpen(false)}
            >
              <X size={19} />
            </button>

            <div className="section-label">
              {selectedMenuItem.name}
            </div>

            <h2>How would you like to order?</h2>

            <p>
              Choose your preferred way to order.
            </p>

            <a
              className="order-choice"
              href="https://www.ordermo.ph/restaurants/at-home-sushi/M8y6MG8S"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ShoppingBag size={19} />
              <span>
                <strong>Order Online</strong>
                <small>OrderMo</small>
              </span>
              <ChevronRight size={18} />
            </a>

            <a
              className="order-choice"
              href="https://www.facebook.com/athomesushibustos"
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle size={19} />
              <span>
                <strong>Order via Facebook</strong>
                <small>Message At Home Sushi</small>
              </span>
              <ChevronRight size={18} />
            </a>

          </div>

        </div>
      )}

    </div>
  );
}

/* =====================================================
   DIGITAL CARD
===================================================== */

function DigitalCard({ profile }) {
  return (
    <div className="page-container">

      <div className="page-heading">
        <span className="section-label">YOUR MEMBERSHIP</span>
        <h1>My Card</h1>
      </div>

      <div className="digital-card">

        <div className="digital-top">
          <div>
            <strong>AT HOME SUSHI</strong>
            <span>LOYALTY CLUB</span>
          </div>

          <QrCode size={20} />
        </div>

        <div className="qr-box">
          <QRCodeSVG
            value={profile.customer_code || ''}
            size={190}
            includeMargin
          />
        </div>

        <div className="digital-member">
          <span>MEMBER</span>
          <strong>{profile.full_name}</strong>
          <small>{profile.customer_code}</small>
        </div>

        <div className="digital-balances">

          <div>
            <span>POINTS</span>
            <strong>
              {Number(profile.points || 0).toFixed(0)}
            </strong>
          </div>

          <div>
            <span>STAMPS</span>
            <strong>{profile.stamps || 0}</strong>
          </div>

        </div>

        <p className="digital-note">
          Show this QR code to staff at checkout.
        </p>

      </div>

    </div>
  );
}

/* =====================================================
   REWARDS
===================================================== */

function Rewards({
  profile,
  rewards,
  onRefresh
}) {
  const [selected, setSelected] = useState(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const points = Number(profile?.points || 0);

  async function redeem() {
    if (!selected) return;

    const required = Number(selected.points_required);

    if (points < required) {
      setMsg('You do not have enough Sushi Points.');
      return;
    }

    setBusy(true);
    setMsg('');

    const redemptionCode =
      'AHS-' +
      Math.random()
        .toString(36)
        .substring(2, 7)
        .toUpperCase();

    const { data, error } = await supabase
      .from('point_redemptions')
      .insert({
        customer_id: profile.id,
        reward_id: selected.id,
        points_used: required,
        redemption_code: redemptionCode,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      setMsg(error.message);
      setBusy(false);
      return;
    }

    setCode(data.redemption_code);
    setBusy(false);
  }

  if (code) {
    return (
      <div className="page-container">

        <div className="success-card">

          <CheckCircle size={46} />

          <span className="section-label">
            REDEMPTION CODE
          </span>

          <h1>Show this to staff</h1>

          <p>
            Staff will confirm your redemption before
            your points are deducted.
          </p>

          <div className="redemption-code">
            {code}
          </div>

          <button
            className="primary-button"
            onClick={() =>
              navigator.clipboard.writeText(code)
            }
          >
            <Copy size={17} />
            Copy code
          </button>

          <button
            className="text-button"
            onClick={() => {
              setCode('');
              setSelected(null);
            }}
          >
            Back to rewards
          </button>

        </div>

      </div>
    );
  }

  return (
    <div className="page-container">

      <div className="page-heading">

        <span className="section-label">
          YOUR BENEFITS
        </span>

        <h1>Rewards</h1>

        <p>
          You have <strong>{points.toFixed(0)} Sushi Points</strong>.
        </p>

      </div>

      <div className="reward-list">

        {rewards.map(reward => {

          const required = Number(reward.points_required);
          const available = points >= required;

          return (
            <button
              type="button"
              key={reward.id}
              disabled={!available}
              className={`reward-card ${
                selected?.id === reward.id ? 'selected' : ''
              } ${!available ? 'locked' : ''}`}
              onClick={() => setSelected(reward)}
            >

              <span className="reward-number">
                <Gift size={18} />
              </span>

              <span className="reward-content">

                <strong>{reward.name}</strong>

                <small>
                  {reward.description ||
                    'Use your Sushi Points for this reward.'}
                </small>

                <b>{required} points</b>

              </span>

              <ChevronRight size={18} />

            </button>
          );
        })}

      </div>

      {selected && (
        <div className="redeem-box">

          <span className="section-label">
            CONFIRM REWARD
          </span>

          <h2>Redeem {selected.name}?</h2>

          <p>
            This will create a redemption code for{' '}
            <strong>{selected.points_required} points.</strong>
          </p>

          {msg && <div className="notice">{msg}</div>}

          <button
            className="primary-button"
            onClick={redeem}
            disabled={busy}
          >
            {busy
              ? 'Creating code...'
              : 'Generate redemption code'}
          </button>

        </div>
      )}

    </div>
  );
}

/* =====================================================
   HISTORY
===================================================== */

function HistoryTab({ transactions }) {
  return (
    <div className="page-container">

      <div className="page-heading">
        <span className="section-label">YOUR ACTIVITY</span>
        <h1>History</h1>
      </div>

      {transactions.length === 0 ? (
        <div className="empty-card large">
          <History size={25} />
          <strong>No transactions yet</strong>
          <p>Your activity will appear here.</p>
        </div>
      ) : (
        <div className="history-list">

          {transactions.map(tx => (
            <div
              className="history-card"
              key={tx.id}
            >

              <div>
                <strong>{tx.transaction_type}</strong>
                <small>{formatDateTime(tx.created_at)}</small>
              </div>

              <b className="history-points">
                +{Number(tx.points_earned || 0).toFixed(2)}
              </b>

            </div>
          ))}

        </div>
      )}

    </div>
  );
}

/* =====================================================
   CUSTOMER SETTINGS
===================================================== */

function Settings({
  session,
  profile,
  reloadProfile,
  onLogout
}) {
  const [name, setName] = useState(profile.full_name || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [birthday, setBirthday] = useState(profile.birthday || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  async function saveProfile(e) {
    e.preventDefault();

    if (!name.trim()) return;

    const { error } = await supabase
      .from('customers')
      .update({
        full_name: name.trim(),
        phone: phone.trim() || null,
        birthday: birthday || null
      })
      .eq('id', session.user.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    await reloadProfile();
    setMessage('Your profile has been updated.');
  }

  async function changePassword(e) {
    e.preventDefault();

    if (newPassword.length < 8) {
      setMessage('Password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setNewPassword('');
    setConfirmPassword('');
    setMessage('Your password has been changed.');
  }

  return (
    <div className="page-container settings-page">

      <div className="page-heading">
        <span className="section-label">YOUR ACCOUNT</span>
        <h1>Settings</h1>
      </div>

      <section className="settings-card">

        <div className="settings-card-heading">
          <span className="settings-icon">
            <User size={18} />
          </span>

          <div>
            <h2>Profile information</h2>
            <p>Keep your details up to date.</p>
          </div>
        </div>

        <form onSubmit={saveProfile}>

          <div className="field">
            <label>Full name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Phone number</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Birthday</label>
            <input
              type="date"
              value={birthday}
              onChange={e => setBirthday(e.target.value)}
            />
          </div>

          {message && (
            <div className="notice">
              {message}
            </div>
          )}

          <button className="primary-button">
            <Save size={16} />
            Save changes
          </button>

        </form>

      </section>

      <section className="settings-card">

        <div className="settings-card-heading">
          <span className="settings-icon">
            <Lock size={18} />
          </span>

          <div>
            <h2>Change password</h2>
            <p>Use at least 8 characters.</p>
          </div>
        </div>

        <form onSubmit={changePassword}>

          <div className="field">
            <label>New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              minLength={8}
            />
          </div>

          <div className="field">
            <label>Confirm new password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              minLength={8}
            />
          </div>

          <button className="secondary-button">
            Update password
          </button>

        </form>

      </section>

      <button
        className="logout-button"
        onClick={onLogout}
      >
        <LogOut size={17} />
        Log out
      </button>

    </div>
  );
}

/* =====================================================
   STAFF
===================================================== */

function Staff() {
  const [staffSession, setStaffSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [customerCode, setCustomerCode] = useState('');
  const [customer, setCustomer] = useState(null);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    const { data } = await supabase.auth.getSession();
    setStaffSession(data.session);
    setChecking(false);
  }

  async function login(e) {
    e.preventDefault();

    setBusy(true);
    setMsg('');

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password
      });

    if (error) {
      setMsg(error.message);
      setBusy(false);
      return;
    }

    setStaffSession(data.session);
    setBusy(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    setStaffSession(null);
  }

  async function findCustomer() {
    setBusy(true);
    setMsg('');
    setCustomer(null);

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('customer_code', customerCode.trim())
      .maybeSingle();

    if (error) {
      setMsg(error.message);
    } else if (!data) {
      setMsg('Customer not found.');
    } else {
      setCustomer(data);
      setNotes(data.notes || '');
    }

    setBusy(false);
  }

  async function addPoints() {
    if (!customer) return;

    const purchase = Number(amount);

    if (!purchase || purchase <= 0) {
      setMsg('Enter a valid purchase amount.');
      return;
    }

    const points = purchase / 100;
    const newPoints =
      Number(customer.points || 0) + points;

    setBusy(true);

    const { error } = await supabase
      .from('customers')
      .update({ points: newPoints })
      .eq('id', customer.id);

    if (error) {
      setMsg(error.message);
      setBusy(false);
      return;
    }

    await supabase
      .from('transactions')
      .insert({
        customer_id: customer.id,
        transaction_type: 'purchase',
        points_earned: points
      });

    setCustomer({
      ...customer,
      points: newPoints
    });

    setAmount('');
    setMsg(
      `Success! ${points.toFixed(2)} Sushi Points added.`
    );

    setBusy(false);
  }

  async function saveNotes() {
    if (!customer) return;

    const { error } = await supabase
      .from('customers')
      .update({ notes })
      .eq('id', customer.id);

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg('Customer notes saved.');
  }

  if (checking) {
    return (
      <div className="loading-screen">
        <div className="loading-mark">🍣</div>
        <div className="loading-brand">AT HOME SUSHI</div>
        <div className="loading-text">
          Checking staff access
        </div>
      </div>
    );
  }

  if (!staffSession) {
    return (
      <div className="auth-page">

        <div className="auth-shell">

          <div className="auth-brand">
            <img src={logo} alt="At Home Sushi" />
            <h1>AT HOME SUSHI</h1>
            <span>STAFF ACCESS</span>
          </div>

          <div className="auth-card">

            <div className="auth-heading">
              <h2>Staff Login</h2>
              <p>
                Manage customer points and rewards.
              </p>
            </div>

            <form onSubmit={login}>

              <div className="field">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <PasswordField
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Staff password"
              />

              {msg && (
                <div className="notice">
                  {msg}
                </div>
              )}

              <button
                className="primary-button"
                disabled={busy}
              >
                <LogIn size={17} />
                {busy ? 'Logging in...' : 'Log in'}
              </button>

            </form>

          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="staff-shell">

      <header className="app-header">

        <div className="header-brand">
          <img src={logo} alt="At Home Sushi" />

          <div>
            <strong>AT HOME SUSHI</strong>
            <span>STAFF PANEL</span>
          </div>
        </div>

        <button
          className="header-action"
          onClick={logout}
        >
          <LogOut size={18} />
        </button>

      </header>

      <main className="staff-main">

        <div className="staff-heading">
          <span>STAFF</span>
          <h1>Customer Points</h1>
          <p>
            Scan or enter a customer's loyalty code.
          </p>
        </div>

        <div className="staff-card">

          <div className="section-label">
            FIND CUSTOMER
          </div>

          <div className="field">
            <label>Customer QR / Code</label>
            <input
              value={customerCode}
              onChange={e => setCustomerCode(e.target.value)}
              placeholder="Enter customer code"
            />
          </div>

          <button
            className="primary-button"
            onClick={findCustomer}
            disabled={busy}
          >
            <ScanLine size={18} />
            Find Customer
          </button>

        </div>

        {customer && (
          <div className="staff-card customer-card">

            <div className="section-label">
              CUSTOMER
            </div>

            <h2>{customer.full_name}</h2>

            {customer.email && (
              <p className="staff-muted">
                {customer.email}
              </p>
            )}

            {customer.phone && (
              <p className="staff-muted">
                {customer.phone}
              </p>
            )}

            <div className="staff-balances">

              <div>
                <Star size={18} />
                <span>POINTS</span>
                <strong>
                  {Number(customer.points || 0).toFixed(2)}
                </strong>
              </div>

              <div>
                <Ticket size={18} />
                <span>STAMPS</span>
                <strong>
                  {customer.stamps || 0}
                </strong>
              </div>

            </div>

            <div className="staff-divider" />

            <div className="section-label">
              ADD POINTS
            </div>

            <div className="field">
              <label>Purchase amount</label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="₱0.00"
              />
            </div>

            {amount && Number(amount) > 0 && (
              <p className="points-preview">
                Points to add:{' '}
                <strong>
                  {(Number(amount) / 100).toFixed(2)}
                </strong>
              </p>
            )}

            <button
              className="primary-button"
              onClick={addPoints}
              disabled={busy}
            >
              <PlusCircle size={18} />
              Add Points
            </button>

            <div className="staff-divider" />

            <div className="section-label">
              CUSTOMER NOTES
            </div>

            <div className="field">
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add notes..."
              />
            </div>

            <button
              className="secondary-staff-button"
              onClick={saveNotes}
            >
              Save Notes
            </button>

          </div>
        )}

        {msg && (
          <div className="notice staff-notice">
            {msg}
          </div>
        )}

      </main>

    </div>
  );
}

/* =====================================================
   ADMIN LOGIN
===================================================== */

function Admin() {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const [email, setEmail] = useState(
    localStorage.getItem('adminEmail') || ''
  );

  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(
    localStorage.getItem('adminRemember') === 'true'
  );
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    checkAdminSession();
  }, []);

  async function checkAdminSession() {
    const { data } = await supabase.auth.getSession();

    if (!data.session) {
      setChecking(false);
      return;
    }

    const ok = await verifyAdmin(data.session.user);

    setSession(data.session);
    setAuthorized(ok);
    setChecking(false);
  }

  async function verifyAdmin(user) {
    if (!user?.id) return false;

    /*
      This uses the admin_users table we created.
      It checks the logged-in user's ID.
    */

    const { data, error } = await supabase
      .from('admin_users')
      .select('id,email')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Admin verification:', error);
      return false;
    }

    return !!data;
  }

  async function login(e) {
    e.preventDefault();

    setBusy(true);
    setMessage('');

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

    if (error) {
      setMessage(error.message);
      setBusy(false);
      return;
    }

    const ok = await verifyAdmin(data.user);

    if (!ok) {
      await supabase.auth.signOut();

      setMessage(
        'This account does not have administrator access.'
      );

      setBusy(false);
      return;
    }

    if (remember) {
      localStorage.setItem('adminRemember', 'true');
      localStorage.setItem('adminEmail', email.trim());
    } else {
      localStorage.removeItem('adminRemember');
      localStorage.removeItem('adminEmail');
    }

    setSession(data.session);
    setAuthorized(true);
    setBusy(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    setSession(null);
    setAuthorized(false);
  }

  if (checking) {
    return (
      <div className="loading-screen">
        <div className="loading-mark">🍣</div>
        <div className="loading-brand">
          AT HOME SUSHI
        </div>
        <div className="loading-text">
          Checking administrator access
        </div>
      </div>
    );
  }

  if (!session || !authorized) {
    return (
      <AdminLogin
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        remember={remember}
        setRemember={setRemember}
        message={message}
        busy={busy}
        onSubmit={login}
      />
    );
  }

  return (
    <AdminDashboard
      session={session}
      onLogout={logout}
    />
  );
}

/* =====================================================
   ADMIN LOGIN
===================================================== */

function AdminLogin({
  email,
  setEmail,
  password,
  setPassword,
  remember,
  setRemember,
  message,
  busy,
  onSubmit
}) {
  return (
    <div className="admin-login-page">

      <div className="admin-login-card">

        <div className="admin-login-logo">
          <img src={logo} alt="At Home Sushi" />
        </div>

        <div className="admin-login-eyebrow">
          AT HOME SUSHI
        </div>

        <h1>Admin Portal</h1>

        <p>
          Sign in to manage your loyalty club,
          menu and business.
        </p>

        <form onSubmit={onSubmit}>

          <div className="field">
            <label>Email address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@email.com"
              required
            />
          </div>

          <PasswordField
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Your password"
          />

          <label className="remember-row">
            <input
              type="checkbox"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
            />
            <span>Remember me</span>
          </label>

          {message && (
            <div className="notice">
              {message}
            </div>
          )}

          <button
            className="admin-login-button"
            disabled={busy}
          >
            {busy ? 'Signing in...' : 'Sign in'}
            <ChevronRight size={17} />
          </button>

        </form>

        <div className="admin-login-footer">
          <span>🍣</span>
          At Home Sushi Management
        </div>

      </div>

    </div>
  );
}

/* =====================================================
   ADMIN DASHBOARD
===================================================== */

function AdminDashboard({
  session,
  onLogout
}) {
  const [page, setPage] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigation = [
    {
      title: 'Overview',
      items: [
        ['overview', 'Dashboard', LayoutDashboard]
      ]
    },
    {
      title: 'Manage',
      items: [
        ['menu', 'Menu', UtensilsCrossed],
        ['rewards', 'Rewards', Gift],
        ['customers', 'Customers', Users],
        ['transactions', 'Transactions', Receipt],
        ['birthday', 'Birthday Rewards', CakeSlice]
      ]
    },
    {
      title: 'Customize',
      items: [
        ['loyalty', 'Loyalty', Star],
       ['homepage', 'Homepage', HomeIcon],
        ['business', 'Business Info', Store],
        ['images', 'Images', ImageIcon]
      ]
    },
    {
      title: 'System',
      items: [
        ['staff', 'Admin & Staff', Shield],
        ['settings', 'App Settings', SlidersHorizontal]
      ]
    }
  ];

  const titles = {
    overview: 'Dashboard',
    menu: 'Menu Management',
    rewards: 'Rewards',
    customers: 'Customers',
    transactions: 'Transactions',
    birthday: 'Birthday Rewards',
    loyalty: 'Loyalty Settings',
    homepage: 'Homepage',
    business: 'Business Information',
    images: 'Image Library',
    staff: 'Admin & Staff',
    settings: 'App Settings'
  };

  return (
    <div className="admin-layout">

      <aside
        className={`admin-sidebar ${
          sidebarOpen ? 'open' : 'collapsed'
        }`}
      >

        <div className="admin-sidebar-brand">

          <img src={logo} alt="At Home Sushi" />

          {sidebarOpen && (
            <div>
              <strong>AT HOME SUSHI</strong>
              <span>ADMIN</span>
            </div>
          )}

        </div>

        <nav className="admin-navigation">

          {navigation.map(section => (
            <div
              className="admin-nav-section"
              key={section.title}
            >

              {sidebarOpen && (
                <div className="admin-nav-label">
                  {section.title}
                </div>
              )}

              {section.items.map(
                ([id, label, Icon]) => (
                  <button
                    key={id}
                    className={
                      page === id
                        ? 'active'
                        : ''
                    }
                    onClick={() => setPage(id)}
                    title={label}
                  >
                    <Icon size={18} />

                    {sidebarOpen && (
                      <span>{label}</span>
                    )}

                  </button>
                )
              )}

            </div>
          ))}

        </nav>

        <div className="admin-sidebar-bottom">

         <button
  onClick={() =>
    window.open('/', '_blank')
  }
>
  <HomeIcon size={18} />
  {sidebarOpen && <span>View website</span>}
</button>

          <button onClick={onLogout}>
            <LogOut size={18} />
            {sidebarOpen && <span>Sign out</span>}
          </button>

        </div>

      </aside>

      <div className="admin-main">

        <header className="admin-topbar">

          <div className="admin-topbar-left">

            <button
              className="sidebar-toggle"
              onClick={() =>
                setSidebarOpen(v => !v)
              }
            >
              {sidebarOpen
                ? <PanelLeftClose size={20} />
                : <PanelLeftOpen size={20} />}
            </button>

            <div>
              <span>ADMINISTRATION</span>
              <h1>{titles[page]}</h1>
            </div>

          </div>

          <div className="admin-topbar-right">

            <div className="admin-user">

              <div className="admin-avatar">
                {(session.user.email || 'A')
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div>
                <strong>Administrator</strong>
                <span>{session.user.email}</span>
              </div>

            </div>

          </div>

        </header>

        <main className="admin-content">

          {page === 'overview' && <AdminOverview />}

          {page === 'menu' && <AdminMenu />}

          {page === 'rewards' && <AdminRewards />}

          {page === 'customers' && <AdminCustomers />}

          {page === 'transactions' && (
            <AdminTransactions />
          )}

          {page === 'birthday' && (
            <AdminBirthday />
          )}

          {page === 'loyalty' && (
            <AdminLoyalty />
          )}

          {page === 'homepage' && (
            <AdminHomepage />
          )}

          {page === 'business' && (
            <AdminBusiness />
          )}

          {page === 'images' && (
            <AdminImages />
          )}

          {page === 'staff' && (
            <AdminStaff />
          )}

          {page === 'settings' && (
            <AdminAppSettings />
          )}

        </main>

      </div>

    </div>
  );
}

/* =====================================================
   ADMIN OVERVIEW
===================================================== */

function AdminOverview() {
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [menu, setMenu] = useState([]);

  async function load() {
  const [
    customerResult,
    transactionResult,
    rewardResult,
    menuResult
  ] = await Promise.all([
    supabase.from('customers').select('*'),
    supabase
      .from('transactions')
      .select('*')
      .order('created_at', {
        ascending: false
      })
      .limit(100),
    supabase.from('rewards').select('*'),
    supabase.from('menu_items').select('*')
  ]);

  console.log('ADMIN CUSTOMERS:', customerResult);
  console.log('ADMIN TRANSACTIONS:', transactionResult);
  console.log('ADMIN REWARDS:', rewardResult);
  console.log('ADMIN MENU:', menuResult);

  setCustomers(customerResult.data || []);
  setTransactions(transactionResult.data || []);
  setRewards(rewardResult.data || []);
  setMenu(menuResult.data || []);
}

  useEffect(() => {
    load();
  }, []);

  const totalPoints = customers.reduce(
    (sum, c) => sum + Number(c.points || 0),
    0
  );

  const activeMenu = menu.filter(
    item => item.active
  ).length;

  const activeRewards = rewards.filter(
    reward => reward.active
  ).length;

  return (
    <div>

      <div className="admin-welcome">

        <div>
          <span>WELCOME BACK</span>
          <h2>At Home Sushi overview</h2>
          <p>
            Here's what's happening with your loyalty club.
          </p>
        </div>

        <button
          className="admin-outline-button"
          onClick={load}
        >
          <RefreshCw size={16} />
          Refresh
        </button>

      </div>

      <div className="admin-stat-grid">

        <AdminStat
          icon={Users}
          label="Total customers"
          value={customers.length}
          description="Registered members"
        />

        <AdminStat
          icon={Star}
          label="Sushi Points"
          value={totalPoints.toFixed(0)}
          description="Points currently held"
        />

        <AdminStat
          icon={UtensilsCrossed}
          label="Active menu"
          value={activeMenu}
          description={`${menu.length} total items`}
        />

        <AdminStat
          icon={Gift}
          label="Active rewards"
          value={activeRewards}
          description={`${rewards.length} total rewards`}
        />

      </div>

      <div className="admin-two-column">

        <section className="admin-panel">

          <div className="admin-panel-heading">
            <div>
              <span>RECENT ACTIVITY</span>
              <h3>Latest transactions</h3>
            </div>

            <Receipt size={19} />
          </div>

          {transactions.length === 0 ? (
            <AdminEmpty text="No transactions yet." />
          ) : (
            <div className="admin-activity-list">

              {transactions.slice(0, 7).map(tx => {

                const customer = customers.find(
                  c => c.id === tx.customer_id
                );

                return (
                  <div
                    className="admin-activity-row"
                    key={tx.id}
                  >

                    <div className="activity-icon">
                      <Star size={16} />
                    </div>

                    <div>
                      <strong>
                        {customer?.full_name ||
                          'Customer'}
                      </strong>

                      <span>
                        {tx.transaction_type}
                        {' · '}
                        {formatDateTime(
                          tx.created_at
                        )}
                      </span>
                    </div>

                    <b>
                      +{Number(
                        tx.points_earned || 0
                      ).toFixed(2)}
                    </b>

                  </div>
                );
              })}

            </div>
          )}

        </section>

       <section className="admin-panel">

  <div className="admin-panel-heading">
    <div>
      <span>QUICK ACTIONS</span>
      <h3>Manage your store</h3>
    </div>

    <Sparkles size={19} />
  </div>

  <div className="quick-action-grid">

    <button
      onClick={() =>
        document
          .querySelector('[data-admin-page="menu"]')
      }
    >
      <UtensilsCrossed size={20} />
      <span>
        <strong>Menu</strong>
        Update sushi items
      </span>
    </button>

    <button>
      <Gift size={20} />
      <span>
        <strong>Rewards</strong>
        Manage rewards
      </span>
    </button>

    <button>
      <Users size={20} />
      <span>
        <strong>Customers</strong>
        View members
      </span>
    </button>

    <button>
      <Store size={20} />
      <span>
        <strong>Business</strong>
        Store information
      </span>
    </button>

  </div>

</section>
      </div>

    </div>
  );
}

function AdminStat({
  icon: Icon,
  label,
  value,
  description
}) {
  return (
    <div className="admin-stat-card">

      <div className="admin-stat-icon">
        <Icon size={19} />
      </div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{description}</small>
      </div>

    </div>
  );
}

function AdminEmpty({ text }) {
  return (
    <div className="admin-empty">
      <Info size={20} />
      <span>{text}</span>
    </div>
  );
}

/* =====================================================
   ADMIN MENU
===================================================== */

function AdminMenu() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  const emptyItem = {
    name: '',
    category: 'classic',
    price: '',
    description: '',
    ingredients: '',
    image_url: '',
    active: true,
    sort_order: 0
  };

  async function load() {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('sort_order', {
        ascending: true
      });

    if (error) {
      console.error(error);
      return;
    }

    setItems(data || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function saveItem(e) {
    e.preventDefault();

    setBusy(true);

    const payload = {
      name: editing.name.trim(),
      category: editing.category,
      price: Number(editing.price || 0),
      description: editing.description || null,
      ingredients: editing.ingredients || null,
      image_url: editing.image_url || null,
      active: editing.active,
      sort_order: Number(editing.sort_order || 0)
    };

    let error;

    if (editing.id) {
      ({ error } = await supabase
        .from('menu_items')
        .update(payload)
        .eq('id', editing.id));
    } else {
      ({ error } = await supabase
        .from('menu_items')
        .insert(payload));
    }

    if (error) {
      alert(error.message);
    } else {
      setEditing(null);
      await load();
    }

    setBusy(false);
  }

  async function deleteItem(id) {
    if (!confirm('Delete this menu item?')) return;

    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id);

    if (error) {
      alert(error.message);
      return;
    }

    load();
  }

  const filtered = items.filter(item => {

    const matchesSearch =
      !search ||
      item.name
        ?.toLowerCase()
        .includes(search.toLowerCase());

    const matchesCategory =
      category === 'all' ||
      item.category === category;

    return matchesSearch && matchesCategory;
  });

  return (
    <div>

      <AdminSectionHeader
        eyebrow="MENU"
        title="Menu Management"
        description="Manage the sushi items customers see in the app."
        button={
          <button
            className="admin-primary-button"
            onClick={() =>
              setEditing({
                ...emptyItem
              })
            }
          >
            <Plus size={17} />
            Add sushi
          </button>
        }
      />

      <div className="admin-toolbar">

        <div className="admin-search">
          <Search size={17} />
          <input
            placeholder="Search menu..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="admin-category-pills">

  {[
    ['all', 'All'],
    ['appetizers', 'Appetizers'],
    ['classic', 'Classic'],
    ['specialty', 'Specialty'],
    ['signature', 'Signature'],
    ['veggie', 'Veggie'],
    ['nigiri', 'Nigiri'],
    ['sashimi', 'Sashimi'],
    ['platters', 'Platters']
  ].map(([value, label]) => (
    <button
      key={value}
      type="button"
      className={`admin-category-pill ${
        category === value ? 'active' : ''
      }`}
      onClick={() => setCategory(value)}
    >
      {label}
    </button>
  ))}

</div>
      </div>

      <div className="admin-table-card">

        <div className="admin-table-wrap">

          <table className="admin-table">

            <thead>
              <tr>
                <th>Item</th>
                <th>Category</th>
                <th>Price</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>

            <tbody>

              {filtered.map(item => (
                <tr key={item.id}>

                  <td>
                    <div className="menu-table-item">

                      <div className="menu-table-image">

                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt=""
                          />
                        ) : (
                          '🍣'
                        )}

                      </div>

                      <div>
                        <strong>{item.name}</strong>
                        <span>
                          {item.description || 'No description'}
                        </span>
                      </div>

                    </div>
                  </td>

                  <td>
                    <span className="admin-category">
                      {item.category || '—'}
                    </span>
                  </td>

                  <td>
                    <strong>{money(item.price)}</strong>
                  </td>

                  <td>
                    <AdminStatus
                      active={item.active}
                    />
                  </td>

                  <td>
                    <div className="admin-row-actions">

                      <button
                        onClick={() =>
                          setEditing({
                            ...item
                          })
                        }
                      >
                        <Edit3 size={16} />
                      </button>

                      <button
                        className="danger"
                        onClick={() =>
                          deleteItem(item.id)
                        }
                      >
                        <Trash2 size={16} />
                      </button>

                    </div>
                  </td>

                </tr>
              ))}

            </tbody>

          </table>

          {filtered.length === 0 && (
            <AdminEmpty text="No menu items found." />
          )}

        </div>

      </div>

      {editing && (
        <AdminModal
          title={editing.id ? 'Edit sushi' : 'Add sushi'}
          onClose={() => setEditing(null)}
        >

          <form
            className="admin-form"
            onSubmit={saveItem}
          >

            <div className="admin-form-grid">

              <div className="field">
                <label>Name</label>
                <input
                  value={editing.name}
                  onChange={e =>
                    setEditing({
                      ...editing,
                      name: e.target.value
                    })
                  }
                  required
                />
              </div>

              <div className="field">
                <label>Category</label>
                <select
                  value={editing.category}
                  onChange={e =>
                    setEditing({
                      ...editing,
                      category: e.target.value
                    })
                  }
                >
                  <option value="appetizers">Appetizers</option>
                  <option value="classic">Classic Rolls</option>
                  <option value="specialty">Specialty Rolls</option>
                  <option value="signature">Signature Rolls</option>
                  <option value="veggie">Veggie</option>
                  <option value="nigiri">Nigiri</option>
                  <option value="sashimi">Sashimi</option>
                  <option value="platters">Platters</option>
                </select>
              </div>

              <div className="field">
                <label>Price</label>
                <input
                  type="number"
                  value={editing.price}
                  onChange={e =>
                    setEditing({
                      ...editing,
                      price: e.target.value
                    })
                  }
                />
              </div>

              <div className="field">
                <label>Sort order</label>
                <input
                  type="number"
                  value={editing.sort_order}
                  onChange={e =>
                    setEditing({
                      ...editing,
                      sort_order: e.target.value
                    })
                  }
                />
              </div>

            </div>

            <div className="field">
              <label>Description</label>
              <textarea
                value={editing.description || ''}
                onChange={e =>
                  setEditing({
                    ...editing,
                    description: e.target.value
                  })
                }
              />
            </div>

            <div className="field">
              <label>Ingredients</label>
              <textarea
                value={editing.ingredients || ''}
                onChange={e =>
                  setEditing({
                    ...editing,
                    ingredients: e.target.value
                  })
                }
                placeholder="e.g. Salmon, avocado, cream cheese..."
              />
            </div>

            <div className="field">
              <label>Photo URL</label>
              <input
                value={editing.image_url || ''}
                onChange={e =>
                  setEditing({
                    ...editing,
                    image_url: e.target.value
                  })
                }
                placeholder="Paste image URL"
              />
            </div>

            <label className="admin-toggle-row">

              <input
                type="checkbox"
                checked={!!editing.active}
                onChange={e =>
                  setEditing({
                    ...editing,
                    active: e.target.checked
                  })
                }
              />

              <span>
                <strong>Available on menu</strong>
                <small>
                  Customers can see this item.
                </small>
              </span>

            </label>

            <div className="admin-modal-actions">

              <button
                type="button"
                className="admin-outline-button"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>

              <button
                className="admin-primary-button"
                disabled={busy}
              >
                <Save size={16} />
                {busy ? 'Saving...' : 'Save sushi'}
              </button>

            </div>

          </form>

        </AdminModal>
      )}

    </div>
  );
}

/* =====================================================
   ADMIN REWARDS
===================================================== */

function AdminRewards() {
  const [rewards, setRewards] = useState([]);
  const [editing, setEditing] = useState(null);

  async function load() {
    const { data } = await supabase
      .from('rewards')
      .select('*')
      .order('points_required');

    setRewards(data || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function save(e) {
    e.preventDefault();

    const payload = {
      name: editing.name,
      description: editing.description || null,
      points_required: Number(
        editing.points_required || 0
      ),
      active: editing.active
    };

    let error;

    if (editing.id) {
      ({ error } = await supabase
        .from('rewards')
        .update(payload)
        .eq('id', editing.id));
    } else {
      ({ error } = await supabase
        .from('rewards')
        .insert(payload));
    }

    if (error) {
      alert(error.message);
      return;
    }

    setEditing(null);
    load();
  }

  async function remove(id) {
    if (!confirm('Delete this reward?')) return;

    const { error } = await supabase
      .from('rewards')
      .delete()
      .eq('id', id);

    if (error) {
      alert(error.message);
      return;
    }

    load();
  }

  return (
    <div>

      <AdminSectionHeader
        eyebrow="LOYALTY"
        title="Rewards"
        description="Create and manage rewards customers can redeem."
        button={
          <button
            className="admin-primary-button"
            onClick={() =>
              setEditing({
                name: '',
                description: '',
                points_required: 100,
                active: true
              })
            }
          >
            <Plus size={17} />
            Add reward
          </button>
        }
      />

      <div className="admin-reward-grid">

        {rewards.map(reward => (
          <div
            className="admin-reward-card"
            key={reward.id}
          >

            <div className="admin-reward-top">

              <div className="admin-reward-icon">
                <Gift size={21} />
              </div>

              <AdminStatus active={reward.active} />

            </div>

            <h3>{reward.name}</h3>

            <p>
              {reward.description ||
                'No description added.'}
            </p>

            <div className="admin-reward-points">
              <strong>
                {reward.points_required}
              </strong>
              <span>SUSHI POINTS</span>
            </div>

            <div className="admin-card-actions">

              <button
                onClick={() =>
                  setEditing({
                    ...reward
                  })
                }
              >
                <Edit3 size={15} />
                Edit
              </button>

              <button
                className="danger"
                onClick={() =>
                  remove(reward.id)
                }
              >
                <Trash2 size={15} />
                Delete
              </button>

            </div>

          </div>
        ))}

      </div>

      {editing && (
        <AdminModal
          title={
            editing.id
              ? 'Edit reward'
              : 'Add reward'
          }
          onClose={() => setEditing(null)}
        >

          <form
            className="admin-form"
            onSubmit={save}
          >

            <div className="field">
              <label>Reward name</label>
              <input
                value={editing.name}
                onChange={e =>
                  setEditing({
                    ...editing,
                    name: e.target.value
                  })
                }
                required
              />
            </div>

            <div className="field">
              <label>Description</label>
              <textarea
                value={editing.description || ''}
                onChange={e =>
                  setEditing({
                    ...editing,
                    description: e.target.value
                  })
                }
              />
            </div>

            <div className="field">
              <label>Points required</label>
              <input
                type="number"
                value={editing.points_required}
                onChange={e =>
                  setEditing({
                    ...editing,
                    points_required: e.target.value
                  })
                }
                required
              />
            </div>

            <label className="admin-toggle-row">
              <input
                type="checkbox"
                checked={!!editing.active}
                onChange={e =>
                  setEditing({
                    ...editing,
                    active: e.target.checked
                  })
                }
              />

              <span>
                <strong>Reward is active</strong>
                <small>
                  Customers can redeem it.
                </small>
              </span>
            </label>

            <div className="admin-modal-actions">

              <button
                type="button"
                className="admin-outline-button"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>

              <button className="admin-primary-button">
                <Save size={16} />
                Save reward
              </button>

            </div>

          </form>

        </AdminModal>
      )}

    </div>
  );
}

/* =====================================================
   ADMIN CUSTOMERS
===================================================== */

function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');

  async function load() {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', {
        ascending: false
      });

    setCustomers(data || []);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return customers.filter(customer => {

      const text = `${customer.full_name || ''} ${
        customer.email || ''
      } ${customer.phone || ''} ${
        customer.customer_code || ''
      }`.toLowerCase();

      return text.includes(search.toLowerCase());
    });
  }, [customers, search]);

  return (
    <div>

      <AdminSectionHeader
        eyebrow="MEMBERS"
        title="Customers"
        description="View your loyalty club members and their balances."
      />

      <div className="admin-toolbar">

        <div className="admin-search">
          <Search size={17} />
          <input
            placeholder="Search customers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="admin-toolbar-count">
          {filtered.length} customers
        </div>

      </div>

      <div className="admin-table-card">

        <div className="admin-table-wrap">

          <table className="admin-table">

            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Sushi Points</th>
                <th>Stamps</th>
                <th>Joined</th>
              </tr>
            </thead>

            <tbody>

              {filtered.map(customer => (
                <tr key={customer.id}>

                  <td>
                    <div className="customer-table-item">

                      <div className="customer-avatar">
                        {(customer.full_name || '?')
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>
                        <strong>
                          {customer.full_name || 'Unnamed'}
                        </strong>
                        <span>
                          {customer.customer_code || 'No code'}
                        </span>
                      </div>

                    </div>
                  </td>

                  <td>
                    <div className="table-contact">
                      <span>
                        {customer.email || '—'}
                      </span>
                      <span>
                        {customer.phone || '—'}
                      </span>
                    </div>
                  </td>

                  <td>
                    <strong>
                      {Number(
                        customer.points || 0
                      ).toFixed(0)}
                    </strong>
                  </td>

                  <td>
                    {customer.stamps || 0}
                  </td>

                  <td>
                    {formatDate(customer.created_at)}
                  </td>

                </tr>
              ))}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}

/* =====================================================
   ADMIN TRANSACTIONS
===================================================== */

function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');

  async function load() {
    const [{ data: tx }, { data: customerData }] =
      await Promise.all([
        supabase
          .from('transactions')
          .select('*')
          .order('created_at', {
            ascending: false
          })
          .limit(300),

        supabase
          .from('customers')
          .select('id,full_name,email')
      ]);

    setTransactions(tx || []);
    setCustomers(customerData || []);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = transactions.filter(tx => {

    const customer = customers.find(
      c => c.id === tx.customer_id
    );

    const text = `
      ${tx.transaction_type || ''}
      ${customer?.full_name || ''}
      ${customer?.email || ''}
    `.toLowerCase();

    return text.includes(search.toLowerCase());
  });

  return (
    <div>

      <AdminSectionHeader
        eyebrow="ACTIVITY"
        title="Transactions"
        description="Review customer purchases and Sushi Points activity."
      />

      <div className="admin-toolbar">

        <div className="admin-search">
          <Search size={17} />
          <input
            placeholder="Search transactions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

      </div>

      <div className="admin-table-card">

        <div className="admin-table-wrap">

          <table className="admin-table">

            <thead>
              <tr>
                <th>Customer</th>
                <th>Type</th>
                <th>Points</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>

              {filtered.map(tx => {

                const customer = customers.find(
                  c => c.id === tx.customer_id
                );

                return (
                  <tr key={tx.id}>

                    <td>
                      <strong>
                        {customer?.full_name ||
                          'Unknown customer'}
                      </strong>
                    </td>

                    <td>
                      <span className="admin-category">
                        {tx.transaction_type}
                      </span>
                    </td>

                    <td>
                      <strong className="points-green">
                        +{Number(
                          tx.points_earned || 0
                        ).toFixed(2)}
                      </strong>
                    </td>

                    <td>
                      {formatDateTime(tx.created_at)}
                    </td>

                  </tr>
                );
              })}

            </tbody>

          </table>

          {filtered.length === 0 && (
            <AdminEmpty text="No transactions found." />
          )}

        </div>

      </div>

    </div>
  );
}

/* =====================================================
   ADMIN BIRTHDAY
===================================================== */

function AdminBirthday() {
  const [rewards, setRewards] = useState([]);
  const [editing, setEditing] = useState(null);

  async function load() {
    const { data } = await supabase
      .from('birthday_rewards')
      .select('*')
      .order('id');

    setRewards(data || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function save(e) {
    e.preventDefault();

    const payload = {
      name: editing.name,
      reward_text: editing.reward_text,
      active: editing.active
    };

    let error;

    if (editing.id) {
      ({ error } = await supabase
        .from('birthday_rewards')
        .update(payload)
        .eq('id', editing.id));
    } else {
      ({ error } = await supabase
        .from('birthday_rewards')
        .insert(payload));
    }

    if (error) {
      alert(error.message);
      return;
    }

    setEditing(null);
    load();
  }

  return (
    <div>

      <AdminSectionHeader
        eyebrow="CUSTOMER PERKS"
        title="Birthday Rewards"
        description="Set the reward customers receive on their birthday."
        button={
          <button
            className="admin-primary-button"
            onClick={() =>
              setEditing({
                name: '',
                reward_text: '',
                active: true
              })
            }
          >
            <Plus size={17} />
            Add birthday reward
          </button>
        }
      />

      <div className="admin-reward-grid">

        {rewards.map(reward => (
          <div
            className="admin-reward-card"
            key={reward.id}
          >

            <div className="admin-reward-top">

              <div className="admin-reward-icon birthday">
                <CakeSlice size={21} />
              </div>

              <AdminStatus active={reward.active} />

            </div>

            <h3>{reward.name}</h3>

            <p>{reward.reward_text}</p>

            <button
              className="admin-card-link"
              onClick={() =>
                setEditing({
                  ...reward
                })
              }
            >
              <Edit3 size={15} />
              Edit reward
            </button>

          </div>
        ))}

      </div>

      {editing && (
        <AdminModal
          title={
            editing.id
              ? 'Edit birthday reward'
              : 'Add birthday reward'
          }
          onClose={() => setEditing(null)}
        >

          <form
            className="admin-form"
            onSubmit={save}
          >

            <div className="field">
              <label>Reward name</label>
              <input
                value={editing.name}
                onChange={e =>
                  setEditing({
                    ...editing,
                    name: e.target.value
                  })
                }
                required
              />
            </div>

            <div className="field">
              <label>Reward text</label>
              <textarea
                value={editing.reward_text}
                onChange={e =>
                  setEditing({
                    ...editing,
                    reward_text: e.target.value
                  })
                }
                required
              />
            </div>

            <label className="admin-toggle-row">
              <input
                type="checkbox"
                checked={!!editing.active}
                onChange={e =>
                  setEditing({
                    ...editing,
                    active: e.target.checked
                  })
                }
              />
              <span>
                <strong>Active</strong>
                <small>
                  Customers can receive this birthday reward.
                </small>
              </span>
            </label>

            <button className="admin-primary-button">
              <Save size={16} />
              Save
            </button>

          </form>

        </AdminModal>
      )}

    </div>
  );
}

/* =====================================================
   ADMIN LOYALTY
===================================================== */

function AdminLoyalty() {
  const [pointsPerAmount, setPointsPerAmount] =
    useState('100');

  const [stampsEnabled, setStampsEnabled] =
    useState(true);

  const [redemptionEnabled, setRedemptionEnabled] =
    useState(true);

  const [message, setMessage] = useState('');

  return (
    <div>

      <AdminSectionHeader
        eyebrow="LOYALTY PROGRAM"
        title="Loyalty Settings"
        description="Control how customers earn and redeem Sushi Points."
      />

      <div className="admin-settings-grid">

        <section className="admin-panel">

          <div className="admin-panel-heading">
            <div>
              <span>EARNING</span>
              <h3>Points earning rules</h3>
            </div>
            <Star size={19} />
          </div>

          <div className="field">
            <label>Purchase amount per point</label>

            <div className="input-with-prefix">
              <span>₱</span>
              <input
                type="number"
                value={pointsPerAmount}
                onChange={e =>
                  setPointsPerAmount(e.target.value)
                }
              />
            </div>

            <small className="admin-help">
              Example: ₱100 = 1 Sushi Point.
            </small>
          </div>

        </section>

        <section className="admin-panel">

          <div className="admin-panel-heading">
            <div>
              <span>STAMPS</span>
              <h3>Stamp card</h3>
            </div>
            <Ticket size={19} />
          </div>

          <label className="admin-toggle-row">

            <input
              type="checkbox"
              checked={stampsEnabled}
              onChange={e =>
                setStampsEnabled(e.target.checked)
              }
            />

            <span>
              <strong>Enable stamps</strong>
              <small>
                Keep stamp tracking available for customers.
              </small>
            </span>

          </label>

        </section>

        <section className="admin-panel">

          <div className="admin-panel-heading">
            <div>
              <span>REDEMPTIONS</span>
              <h3>Reward redemption</h3>
            </div>
            <Gift size={19} />
          </div>

          <label className="admin-toggle-row">

            <input
              type="checkbox"
              checked={redemptionEnabled}
              onChange={e =>
                setRedemptionEnabled(e.target.checked)
              }
            />

            <span>
              <strong>Enable redemptions</strong>
              <small>
                Allow customers to generate reward codes.
              </small>
            </span>

          </label>

        </section>

      </div>

      {message && (
        <div className="notice">
          {message}
        </div>
      )}

      <button
        className="admin-primary-button"
        onClick={() =>
          setMessage(
            'Loyalty settings are ready to connect to your app settings table.'
          )
        }
      >
        <Save size={16} />
        Save loyalty settings
      </button>

    </div>
  );
}

/* =====================================================
   ADMIN BUSINESS
===================================================== */

function AdminBusiness() {
  const [business, setBusiness] = useState({
    name: 'At Home Sushi',
    location: 'Bustos, Bulacan',
    phone: '',
    facebook: 'https://www.facebook.com/athomesushibustos',
    instagram: '',
    hours: '11:00 AM – 9:00 PM'
  });

  const [saved, setSaved] = useState(false);

  function save(e) {
    e.preventDefault();

    localStorage.setItem(
      'ahsBusinessInfo',
      JSON.stringify(business)
    );

    setSaved(true);

    setTimeout(() => setSaved(false), 2500);
  }

  useEffect(() => {
    const stored =
      localStorage.getItem('ahsBusinessInfo');

    if (stored) {
      setBusiness(JSON.parse(stored));
    }
  }, []);

  return (
    <div>

      <AdminSectionHeader
        eyebrow="BUSINESS"
        title="Business Information"
        description="Manage the information displayed across your loyalty app."
      />

      <section className="admin-panel admin-form-panel">

        <form
          className="admin-form"
          onSubmit={save}
        >

          <div className="admin-form-grid">

            <div className="field">
              <label>Business name</label>
              <input
                value={business.name}
                onChange={e =>
                  setBusiness({
                    ...business,
                    name: e.target.value
                  })
                }
              />
            </div>

            <div className="field">
              <label>Location</label>
              <input
                value={business.location}
                onChange={e =>
                  setBusiness({
                    ...business,
                    location: e.target.value
                  })
                }
              />
            </div>

            <div className="field">
              <label>Contact number</label>
              <input
                value={business.phone}
                onChange={e =>
                  setBusiness({
                    ...business,
                    phone: e.target.value
                  })
                }
              />
            </div>

            <div className="field">
              <label>Opening hours</label>
              <input
                value={business.hours}
                onChange={e =>
                  setBusiness({
                    ...business,
                    hours: e.target.value
                  })
                }
              />
            </div>

            <div className="field">
              <label>Facebook</label>
              <input
                value={business.facebook}
                onChange={e =>
                  setBusiness({
                    ...business,
                    facebook: e.target.value
                  })
                }
              />
            </div>

            <div className="field">
              <label>Instagram</label>
              <input
                value={business.instagram}
                onChange={e =>
                  setBusiness({
                    ...business,
                    instagram: e.target.value
                  })
                }
              />
            </div>

          </div>

          {saved && (
            <div className="notice">
              Business information saved.
            </div>
          )}

          <button className="admin-primary-button">
            <Save size={16} />
            Save business information
          </button>

        </form>

      </section>

    </div>
  );
}

/* =====================================================
   ADMIN HOMEPAGE
===================================================== */

function AdminHomepage() {
  const [heroTitle, setHeroTitle] =
    useState('Good sushi. Better rewards.');

  const [description, setDescription] =
    useState(
      'Enjoy your favorites, earn Sushi Points, and make every order count.'
    );

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored =
      localStorage.getItem('ahsHomepage');

    if (stored) {
      const data = JSON.parse(stored);

      setHeroTitle(
        data.heroTitle ||
          'Good sushi. Better rewards.'
      );

      setDescription(
        data.description || ''
      );
    }
  }, []);

  function save(e) {
    e.preventDefault();

    localStorage.setItem(
      'ahsHomepage',
      JSON.stringify({
        heroTitle,
        description
      })
    );

    setSaved(true);

    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div>

      <AdminSectionHeader
        eyebrow="WEBSITE"
        title="Homepage"
        description="Control the messaging customers see when they open the loyalty club."
      />

      <div className="admin-settings-grid">

        <section className="admin-panel">

          <div className="admin-panel-heading">
            <div>
              <span>HERO SECTION</span>
              <h3>Main message</h3>
            </div>

            <Home size={19} />
          </div>

          <form
            className="admin-form"
            onSubmit={save}
          >

            <div className="field">
              <label>Hero title</label>
              <textarea
                value={heroTitle}
                onChange={e =>
                  setHeroTitle(e.target.value)
                }
              />
            </div>

            <div className="field">
              <label>Hero description</label>
              <textarea
                value={description}
                onChange={e =>
                  setDescription(e.target.value)
                }
              />
            </div>

            {saved && (
              <div className="notice">
                Homepage content saved.
              </div>
            )}

            <button className="admin-primary-button">
              <Save size={16} />
              Save homepage
            </button>

          </form>

        </section>

        <section className="admin-panel">

          <div className="admin-panel-heading">
            <div>
              <span>PREVIEW</span>
              <h3>Hero preview</h3>
            </div>
          </div>

          <div className="admin-hero-preview">

            <span>AT HOME SUSHI</span>

            <h2>
              {heroTitle}
            </h2>

            <p>
              {description}
            </p>

          </div>

        </section>

      </div>

    </div>
  );
}

/* =====================================================
   ADMIN IMAGES
===================================================== */

function AdminImages() {
  const [logoPreview, setLogoPreview] =
    useState(null);

  function handleLogo(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    const url = URL.createObjectURL(file);

    setLogoPreview(url);

    /*
      This is a visual uploader for now.
      We will connect it to Supabase Storage
      next so the image becomes permanent.
    */
  }

  return (
    <div>

      <AdminSectionHeader
        eyebrow="MEDIA"
        title="Image Library"
        description="Manage your brand and menu imagery."
      />

      <div className="admin-settings-grid">

        <section className="admin-panel">

          <div className="admin-panel-heading">
            <div>
              <span>BRANDING</span>
              <h3>Business logo</h3>
            </div>

            <ImageIcon size={19} />
          </div>

          <div className="admin-logo-upload">

            <div className="admin-logo-preview">

              <img
                src={logoPreview || logo}
                alt="Business logo"
              />

            </div>

            <label className="admin-upload-button">

              <Upload size={16} />
              Choose logo

              <input
                type="file"
                accept="image/*"
                onChange={handleLogo}
              />

            </label>

            <small>
              Recommended: square JPG or PNG.
            </small>

          </div>

        </section>

        <section className="admin-panel">

          <div className="admin-panel-heading">
            <div>
              <span>MENU PHOTOS</span>
              <h3>Image uploading</h3>
            </div>

            <UtensilsCrossed size={19} />
          </div>

          <div className="admin-upload-dropzone">

            <Upload size={28} />

            <strong>
              Upload menu photos
            </strong>

            <span>
              JPG, PNG or WEBP
            </span>

            <button className="admin-outline-button">
              Select images
            </button>

          </div>

        </section>

      </div>

    </div>
  );
}

/* =====================================================
   ADMIN STAFF
===================================================== */

function AdminStaff() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .order('email');

    if (error) {
      console.error(error);
    }

    setAdmins(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>

      <AdminSectionHeader
        eyebrow="ACCESS CONTROL"
        title="Admin & Staff"
        description="Manage the people who can access your business dashboard."
      />

      <section className="admin-panel">

        <div className="admin-panel-heading">

          <div>
            <span>AUTHORIZED USERS</span>
            <h3>Administrators</h3>
          </div>

          <Shield size={19} />

        </div>

        {loading ? (
          <AdminEmpty text="Loading administrators..." />
        ) : admins.length === 0 ? (
          <AdminEmpty text="No administrators found." />
        ) : (
          <div className="admin-staff-list">

            {admins.map(admin => (
              <div
                className="admin-staff-row"
                key={admin.id}
              >

                <div className="customer-avatar">
                  {(admin.email || 'A')
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>
                  <strong>{admin.email}</strong>
                  <span>Administrator</span>
                </div>

                <AdminStatus active />

              </div>
            ))}

          </div>
        )}

      </section>

      <div className="admin-info-box">

        <Shield size={20} />

        <div>
          <strong>Admin access is protected</strong>
          <p>
            Only accounts listed in the
            <code> admin_users </code>
            table can enter this dashboard.
          </p>
        </div>

      </div>

    </div>
  );
}

/* =====================================================
   ADMIN APP SETTINGS
===================================================== */

function AdminAppSettings() {
  const [settings, setSettings] = useState({
    maintenance: false,
    customerSignup: true,
    showMenu: true,
    showRewards: true
  });

  return (
    <div>

      <AdminSectionHeader
        eyebrow="SYSTEM"
        title="App Settings"
        description="General controls for the At Home Sushi loyalty application."
      />

      <div className="admin-settings-list">

        <AdminSetting
          icon={UserPlus}
          title="Customer registration"
          description="Allow new customers to join the loyalty club."
          checked={settings.customerSignup}
          onChange={value =>
            setSettings({
              ...settings,
              customerSignup: value
            })
          }
        />

        <AdminSetting
          icon={UtensilsCrossed}
          title="Show menu"
          description="Display the sushi menu on the customer homepage."
          checked={settings.showMenu}
          onChange={value =>
            setSettings({
              ...settings,
              showMenu: value
            })
          }
        />

        <AdminSetting
          icon={Gift}
          title="Show rewards"
          description="Display available rewards to customers."
          checked={settings.showRewards}
          onChange={value =>
            setSettings({
              ...settings,
              showRewards: value
            })
          }
        />

        <AdminSetting
          icon={SettingsIcon}
          title="Maintenance mode"
          description="Temporarily disable customer access while you make changes."
          checked={settings.maintenance}
          onChange={value =>
            setSettings({
              ...settings,
              maintenance: value
            })
          }
        />

      </div>

    </div>
  );
}

function AdminSetting({
  icon: Icon,
  title,
  description,
  checked,
  onChange
}) {
  return (
    <div className="admin-setting-row">

      <div className="admin-setting-icon">
        <Icon size={19} />
      </div>

      <div className="admin-setting-text">
        <strong>{title}</strong>
        <span>{description}</span>
      </div>

      <button
        type="button"
        className={`admin-switch ${
          checked ? 'on' : ''
        }`}
        onClick={() => onChange(!checked)}
      >
        <span />
      </button>

    </div>
  );
}

/* =====================================================
   ADMIN COMPONENT HELPERS
===================================================== */

function AdminSectionHeader({
  eyebrow,
  title,
  description,
  button
}) {
  return (
    <div className="admin-section-header">

      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      {button && button}

    </div>
  );
}

function AdminStatus({ active }) {
  return (
    <span
      className={`admin-status ${
        active ? 'active' : 'inactive'
      }`}
    >
      <span />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

function AdminModal({
  title,
  children,
  onClose
}) {
  return (
    <div
      className="admin-modal-overlay"
      onClick={onClose}
    >

      <div
        className="admin-modal"
        onClick={e => e.stopPropagation()}
      >

        <div className="admin-modal-header">

          <div>
            <span>EDIT</span>
            <h3>{title}</h3>
          </div>

          <button onClick={onClose}>
            <X size={19} />
          </button>

        </div>

        <div className="admin-modal-body">
          {children}
        </div>

      </div>

    </div>
  );
}

/* =====================================================
   ROUTING
===================================================== */

const path = window.location.pathname;

const rootElement =
  document.getElementById('root');

if (!rootElement) {
  throw new Error(
    'Root element #root was not found.'
  );
}

createRoot(rootElement).render(
  path === '/admin'
    ? <Admin />
    : path === '/staff'
    ? <Staff />
    : <App />
);
