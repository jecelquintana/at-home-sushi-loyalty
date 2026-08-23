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
  History as HistoryIcon,
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
  Store,
  Menu as MenuIcon,
  Users,
  Receipt,
  SlidersHorizontal,
  ImagePlus,
  Pencil,
  Trash2,
  Plus,
  ArrowLeft,
  Upload,
  Clock,
  Award,
  Sparkles,
  Search,
  RefreshCw,
  ChevronDown,
  Home as HomeIcon
} from 'lucide-react';

import './styles.css';
import logo from './logo.jpg';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

/* =====================================================
   HELPERS
===================================================== */

function formatMoney(value) {
  return `₱${Number(value || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function formatDate(value) {
  if (!value) return '—';

  return new Date(value).toLocaleDateString(
    'en-PH',
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }
  );
}

function formatDateTime(value) {
  if (!value) return '—';

  return new Date(value).toLocaleString(
    'en-PH',
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }
  );
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/* =====================================================
   PASSWORD FIELD
===================================================== */

function PasswordField({
  value,
  onChange,
  placeholder = 'Your password'
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="field">
      <label>Password</label>

      <div className="password-wrap">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required
          minLength={8}
        />

        <button
          type="button"
          className="password-toggle"
          onClick={() =>
            setShow((current) => !current)
          }
          aria-label={
            show
              ? 'Hide password'
              : 'Show password'
          }
        >
          {show ? (
            <EyeOff size={17} />
          ) : (
            <Eye size={17} />
          )}
        </button>
      </div>
    </div>
  );
}

/* =====================================================
   LOADING
===================================================== */

function LoadingScreen({
  text = 'Loading your loyalty club'
}) {
  return (
    <div className="loading-screen">
      <div className="loading-mark">🍣</div>

      <div className="loading-brand">
        AT HOME SUSHI
      </div>

      <div className="loading-text">
        {text}
      </div>
    </div>
  );
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
      const {
        data,
        error
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        console.error(
          'Session error:',
          error
        );

        setLoading(false);
        return;
      }

      if (data.session) {
        setSession(data.session);

        await loadProfile(
          data.session.user
        );
      } else {
        setLoading(false);
      }
    }

    start();

    const {
      data: {
        subscription
      }
    } =
      supabase.auth.onAuthStateChange(
        async (
          _event,
          currentSession
        ) => {
          if (!mounted) return;

          setSession(currentSession);

          if (currentSession) {
            await loadProfile(
              currentSession.user
            );
          } else {
            setProfile(null);
            setLoading(false);
          }
        }
      );

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

    const {
      data,
      error
    } = await supabase
      .from('customers')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error(
        'Customer profile error:',
        error
      );

      setProfile(null);
      setLoading(false);
      return;
    }

    if (data) {
      setProfile(data);
      setLoading(false);
      return;
    }

    const metadata =
      user.user_metadata || {};

    const newCustomer = {
      id: user.id,
      full_name:
        metadata.full_name || '',
      phone:
        metadata.phone || null,
      email:
        user.email || null,
      birthday:
        metadata.birthday || null,
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
      console.error(
        'Could not create customer profile:',
        createError
      );

      setProfile(null);
      setLoading(false);
      return;
    }

    setProfile(createdProfile);
    setLoading(false);
  }

  if (loading) {
    return (
      <LoadingScreen />
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
      reloadProfile={() =>
        loadProfile(session.user)
      }
    />
  );
}

/* =====================================================
   CUSTOMER AUTH
===================================================== */

function Auth({
  mode,
  setMode
}) {
  const [name, setName] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [phone, setPhone] =
    useState('');

  const [birthday, setBirthday] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [busy, setBusy] =
    useState(false);

  const [msg, setMsg] =
    useState('');

  const [remember, setRemember] =
    useState(
      localStorage.getItem(
        'rememberLogin'
      ) === 'true'
    );

  useEffect(() => {
    const saved =
      localStorage.getItem(
        'savedLoginEmail'
      );

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
        localStorage.setItem(
          'rememberLogin',
          'true'
        );

        localStorage.setItem(
          'savedLoginEmail',
          email
        );
      } else {
        localStorage.removeItem(
          'rememberLogin'
        );

        localStorage.removeItem(
          'savedLoginEmail'
        );
      }

      const {
        error
      } =
        await supabase.auth.signInWithPassword(
          {
            email:
              email.trim(),
            password
          }
        );

      if (error) {
        setMsg(error.message);
      }

      setBusy(false);
      return;
    }

    if (!name.trim()) {
      setMsg(
        'Please enter your full name.'
      );

      setBusy(false);
      return;
    }

    const {
      data,
      error
    } =
      await supabase.auth.signUp({
        email:
          email.trim(),

        password,

        options: {
          data: {
            full_name:
              name.trim(),

            phone:
              phone.trim() ||
              null,

            birthday:
              birthday ||
              null
          }
        }
      });

    if (error) {
      setMsg(error.message);
      setBusy(false);
      return;
    }

    if (
      data?.session &&
      data?.user
    ) {
      const {
        error:
          profileError
      } =
        await supabase
          .from('customers')
          .insert({
            id: data.user.id,
            full_name:
              name.trim(),
            phone:
              phone.trim() ||
              null,
            email:
              data.user.email ||
              email.trim(),
            birthday:
              birthday ||
              null,
            points: 0,
            stamps: 0
          });

      if (profileError) {
        console.error(
          'Profile creation error:',
          profileError
        );
      }
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
          <img
            src={logo}
            alt="At Home Sushi"
          />

          <h1>
            AT HOME SUSHI
          </h1>

          <span>
            LOYALTY CLUB
          </span>
        </div>

        <div className="auth-card">

          <div className="auth-tabs">

            <button
              type="button"
              className={
                mode === 'login'
                  ? 'active'
                  : ''
              }
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
              className={
                mode === 'signup'
                  ? 'active'
                  : ''
              }
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

          <form
            onSubmit={submit}
          >

            {mode ===
              'signup' && (
              <>
                <div className="field">
                  <label>
                    Full name
                  </label>

                  <input
                    value={name}
                    onChange={(e) =>
                      setName(
                        e.target.value
                      )
                    }
                    placeholder="Your name"
                    required
                  />
                </div>

                <div className="field">
                  <label>
                    Phone number
                  </label>

                  <input
                    value={phone}
                    onChange={(e) =>
                      setPhone(
                        e.target.value
                      )
                    }
                    placeholder="09xxxxxxxxx"
                  />
                </div>

                <div className="field">
                  <label>
                    Birthday
                  </label>

                  <input
                    type="date"
                    value={birthday}
                    onChange={(e) =>
                      setBirthday(
                        e.target.value
                      )
                    }
                  />
                </div>
              </>
            )}

            <div className="field">
              <label>
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }
                placeholder="you@email.com"
                required
              />
            </div>

            <PasswordField
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
            />

            {mode ===
              'login' && (
              <label className="remember-row">
                <input
                  type="checkbox"
                  checked={
                    remember
                  }
                  onChange={(e) =>
                    setRemember(
                      e.target.checked
                    )
                  }
                />

                <span>
                  Remember me
                </span>
              </label>
            )}

            {msg && (
              <div className="notice">
                {msg}
              </div>
            )}

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
                  mode ===
                    'login'
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
  const [tab, setTab] =
    useState('home');

  const [rewards, setRewards] =
    useState([]);

  const [transactions, setTransactions] =
    useState([]);

  const [
    birthdayReward,
    setBirthdayReward
  ] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, [session.user.id]);

  useEffect(() => {
    if (profile) {
      checkBirthdayReward();
    }
  }, [profile]);

  async function loadDashboard() {
    const {
      data: rewardsData,
      error: rewardsError
    } = await supabase
      .from('rewards')
      .select('*')
      .eq('active', true)
      .order('points_required');

    if (rewardsError) {
      console.error(
        'Rewards error:',
        rewardsError
      );
    }

    setRewards(
      rewardsData || []
    );

    const {
      data: txData,
      error: txError
    } = await supabase
      .from('transactions')
      .select('*')
      .eq(
        'customer_id',
        session.user.id
      )
      .order(
        'created_at',
        {
          ascending: false
        }
      )
      .limit(30);

    if (txError) {
      console.error(
        'Transactions error:',
        txError
      );
    }

    setTransactions(
      txData || []
    );
  }

  async function checkBirthdayReward() {
    if (!profile?.birthday)
      return;

    const today =
      new Date();

    const birthday =
      new Date(
        profile.birthday
      );

    const isBirthday =
      today.getMonth() ===
        birthday.getMonth() &&
      today.getDate() ===
        birthday.getDate();

    if (!isBirthday)
      return;

    const year =
      today.getFullYear();

    const {
      data: claimed
    } =
      await supabase
        .from('birthday_claims')
        .select('id')
        .eq(
          'customer_id',
          profile.id
        )
        .eq(
          'birthday_year',
          year
        )
        .maybeSingle();

    if (claimed) return;

    const {
      data: reward
    } =
      await supabase
        .from('birthday_rewards')
        .select('*')
        .eq('active', true)
        .order('id', {
          ascending: true
        })
        .limit(1)
        .maybeSingle();

    if (reward) {
      setBirthdayReward(
        reward
      );
    }
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  if (!profile) {
    return (
      <LoadingScreen
        text="Preparing your loyalty card"
      />
    );
  }

  return (
    <div className="app-shell">

      <header className="app-header">

        <div className="header-brand">
          <img
            src={logo}
            alt="At Home Sushi"
          />

          <div>
            <strong>
              AT HOME SUSHI
            </strong>

            <span>
              LOYALTY CLUB
            </span>
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
              <span>
                YOUR BIRTHDAY REWARD
              </span>

              <strong>
                {birthdayReward.name}
              </strong>

              <p>
                {
                  birthdayReward.reward_text
                }
              </p>
            </div>

          </div>
        )}

        {tab === 'home' && (
          <Home
            profile={profile}
            rewards={rewards}
            onGoRewards={() =>
              setTab('rewards')
            }
          />
        )}

        {tab === 'card' && (
          <DigitalCard
            profile={profile}
          />
        )}

        {tab === 'rewards' && (
          <Rewards
            profile={profile}
            rewards={rewards}
            onRefresh={reloadProfile}
          />
        )}

        {tab === 'history' && (
          <HistoryTab
            transactions={
              transactions
            }
          />
        )}

        {tab === 'settings' && (
          <CustomerSettings
            session={session}
            profile={profile}
            reloadProfile={
              reloadProfile
            }
            onLogout={logout}
          />
        )}

      </main>

      <nav className="bottom-nav">

        <button
          className={
            tab === 'home'
              ? 'selected'
              : ''
          }
          onClick={() =>
            setTab('home')
          }
        >
          <Star size={20} />
          <span>Home</span>
        </button>

        <button
          className={
            tab === 'card'
              ? 'selected'
              : ''
          }
          onClick={() =>
            setTab('card')
          }
        >
          <QrCode size={20} />
          <span>My Card</span>
        </button>

        <button
          className={
            tab === 'rewards'
              ? 'selected'
              : ''
          }
          onClick={() =>
            setTab('rewards')
          }
        >
          <Gift size={20} />
          <span>Rewards</span>
        </button>

        <button
          className={
            tab === 'history'
              ? 'selected'
              : ''
          }
          onClick={() =>
            setTab('history')
          }
        >
          <HistoryIcon size={20} />
          <span>History</span>
        </button>

        <button
          className={
            tab === 'settings'
              ? 'selected'
              : ''
          }
          onClick={() =>
            setTab('settings')
          }
        >
          <SettingsIcon size={20} />
          <span>Settings</span>
        </button>

      </nav>

    </div>
  );
}

/* =====================================================
   HOME
===================================================== */

function Home({
  profile,
  rewards,
  onGoRewards
}) {
  const points =
    Number(profile.points || 0);

  const [menu, setMenu] =
    useState([]);

  const [menuLoading, setMenuLoading] =
    useState(true);

  const [
    activeCategory,
    setActiveCategory
  ] = useState('all');

  const [orderOpen, setOrderOpen] =
    useState(false);

  const [
    selectedMenuItem,
    setSelectedMenuItem
  ] = useState(null);

  useEffect(() => {
    loadMenu();
  }, []);

  async function loadMenu() {
    setMenuLoading(true);

    const {
      data,
      error
    } = await supabase
      .from('menu_items')
      .select('*')
      .eq('active', true)
      .order('sort_order', {
        ascending: true
      });

    if (error) {
      console.error(
        'Menu loading error:',
        error
      );

      setMenu([]);
    } else {
      setMenu(data || []);
    }

    setMenuLoading(false);
  }

  const categories = [
    {
      id: 'all',
      label: 'All'
    },
    {
      id: 'appetizers',
      label: 'Appetizers'
    },
    {
      id: 'classic',
      label: 'Classic Rolls'
    },
    {
      id: 'specialty',
      label: 'Specialty Rolls'
    },
    {
      id: 'signature',
      label: 'Signature Rolls'
    },
    {
      id: 'veggie',
      label: 'Veggie'
    },
    {
      id: 'nigiri',
      label: 'Nigiri'
    },
    {
      id: 'sashimi',
      label: 'Sashimi'
    },
    {
      id: 'platters',
      label: 'Platters'
    }
  ];

  const filteredMenu =
    activeCategory === 'all'
      ? menu
      : menu.filter(
          (item) =>
            String(
              item.category || ''
            ).toLowerCase() ===
            activeCategory
        );

  function openOrder(item) {
    setSelectedMenuItem(item);
    setOrderOpen(true);
  }

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
            <span>
              Better rewards.
            </span>
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
                  .getElementById(
                    'menu-section'
                  )
                  ?.scrollIntoView({
                    behavior:
                      'smooth'
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
                  .getElementById(
                    'points-section'
                  )
                  ?.scrollIntoView({
                    behavior:
                      'smooth'
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

        <h2>
          Your Sushi Points
        </h2>

        <p className="section-description">
          Every order brings you closer to something delicious.
        </p>

        <div className="points-card">

          <div>
            <span>
              POINT BALANCE
            </span>

            <strong>
              {points.toFixed(0)}
            </strong>

            <small>
              SUSHI POINTS
            </small>
          </div>

          <button
            onClick={onGoRewards}
          >
            <ChevronRight size={20} />
          </button>

        </div>

        <div className="earn-steps">

          <div>
            <b>01</b>

            <span>
              <strong>
                ORDER
              </strong>

              Enjoy your favorite sushi.
            </span>
          </div>

          <div>
            <b>02</b>

            <span>
              <strong>
                EARN
              </strong>

              ₱100 spent = 1 Sushi Point.
            </span>
          </div>

          <div>
            <b>03</b>

            <span>
              <strong>
                REDEEM
              </strong>

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

        <h2>
          Explore Our Menu
        </h2>

        <p className="section-description">
          Find your favorite roll, nigiri, sashimi or platter.
        </p>

        <div className="menu-categories">

          {categories.map(
            (category) => (
              <button
                key={
                  category.id
                }
                type="button"
                className={
                  activeCategory ===
                  category.id
                    ? 'active'
                    : ''
                }
                onClick={() =>
                  setActiveCategory(
                    category.id
                  )
                }
              >
                {
                  category.label
                }
              </button>
            )
          )}

        </div>

        {menuLoading && (
          <div className="empty-card large">
            <div className="loading-mark">
              🍣
            </div>

            <strong>
              Loading our menu...
            </strong>

            <p>
              Please wait a moment.
            </p>
          </div>
        )}

        {!menuLoading &&
          filteredMenu.length ===
            0 && (
            <div className="empty-card large">
              <div className="loading-mark">
                🍣
              </div>

              <strong>
                No menu items available.
              </strong>

              <p>
                Check back soon for our latest menu.
              </p>
            </div>
          )}

        {!menuLoading &&
          filteredMenu.length >
            0 && (
            <div className="menu-grid">

              {filteredMenu.map(
                (item) => (
                  <article
                    className="menu-item-card"
                    key={item.id}
                  >

                    <div className="menu-item-image">

                      {item.image_url ? (
                        <img
                          src={
                            item.image_url
                          }
                          alt={
                            item.name
                          }
                          onError={(
                            e
                          ) => {
                            e.currentTarget.style.display =
                              'none';

                            e.currentTarget.parentElement.classList.add(
                              'missing'
                            );
                          }}
                        />
                      ) : (
                        <div className="photo-fallback">
                          <span>
                            🍣
                          </span>

                          <small>
                            AT HOME SUSHI
                          </small>
                        </div>
                      )}

                    </div>

                    <div className="menu-item-content">

                      <div className="menu-item-top">
                        <h3>
                          {
                            item.name
                          }
                        </h3>

                        {item.price !=
                          null && (
                          <strong>
                            {formatMoney(
                              item.price
                            )}
                          </strong>
                        )}
                      </div>

                      {item.description && (
                        <p>
                          {
                            item.description
                          }
                        </p>
                      )}

                      <button
                        type="button"
                        className="order-button"
                        onClick={() =>
                          openOrder(
                            item
                          )
                        }
                      >
                        Order this
                        <ChevronRight
                          size={17}
                        />
                      </button>

                    </div>

                  </article>
                )
              )}

            </div>
          )}

      </section>

      <section className="home-section rewards-home">

        <div className="section-label">
          YOUR BENEFITS
        </div>

        <h2>
          Rewards
        </h2>

        <p className="section-description">
          A little something for every sushi lover.
        </p>

        <div className="home-rewards">

          {rewards
            .slice(0, 3)
            .map(
              (reward, i) => (
                <div
                  className="home-reward"
                  key={
                    reward.id
                  }
                >

                  <span>
                    0{i + 1}
                  </span>

                  <div>
                    <strong>
                      {
                        reward.name
                      }
                    </strong>

                    <p>
                      {reward.description ||
                        'Use your Sushi Points for this reward.'}
                    </p>
                  </div>

                  <b>
                    {
                      reward.points_required
                    }
                  </b>

                </div>
              )
            )}

          {rewards.length ===
            0 && (
            <div className="empty-card">
              Rewards will appear here once available.
            </div>
          )}

        </div>

        <button
          className="primary-button"
          onClick={
            onGoRewards
          }
        >
          View all rewards
          <ChevronRight size={17} />
        </button>

      </section>

      {orderOpen &&
        selectedMenuItem && (
          <div
            className="modal-overlay"
            onClick={() =>
              setOrderOpen(false)
            }
          >

            <div
              className="order-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <button
                className="modal-close"
                onClick={() =>
                  setOrderOpen(false)
                }
              >
                <X size={19} />
              </button>

              <div className="section-label">
                {
                  selectedMenuItem.name
                }
              </div>

              <h2>
                How would you like to order?
              </h2>

              <p>
                Choose your preferred way to order.
              </p>

              <a
                className="order-choice"
                href="https://www.ordermo.ph/restaurants/at-home-sushi/M8y6MG8S?n=QXQgSG9tZSBTdXNoaQ==&p=cG5n&c=anBn"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="choice-icon">
                  <ShoppingBag size={19} />
                </span>

                <span>
                  <strong>
                    Order Online
                  </strong>

                  <small>
                    OrderMo
                  </small>
                </span>

                <ChevronRight size={18} />
              </a>

              <a
                className="order-choice"
                href="https://www.facebook.com/athomesushibustos"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="choice-icon">
                  <MessageCircle size={19} />
                </span>

                <span>
                  <strong>
                    Order via Facebook
                  </strong>

                  <small>
                    Message At Home Sushi
                  </small>
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

function DigitalCard({
  profile
}) {
  return (
    <div className="page-container">

      <div className="page-heading">
        <span className="section-label">
          YOUR MEMBERSHIP
        </span>

        <h1>
          My Card
        </h1>
      </div>

      <div className="digital-card">

        <div className="digital-top">
          <div>
            <strong>
              AT HOME SUSHI
            </strong>

            <span>
              LOYALTY CLUB
            </span>
          </div>

          <QrCode size={20} />
        </div>

        <div className="qr-box">
          <QRCodeSVG
            value={
              profile.customer_code ||
              profile.id ||
              ''
            }
            size={190}
            includeMargin
          />
        </div>

        <div className="digital-member">

          <span>
            MEMBER
          </span>

          <strong>
            {
              profile.full_name
            }
          </strong>

          <small>
            {
              profile.customer_code ||
              profile.id
            }
          </small>

        </div>

        <div className="digital-balances">

          <div>
            <span>
              POINTS
            </span>

            <strong>
              {Number(
                profile.points ||
                  0
              ).toFixed(0)}
            </strong>
          </div>

          <div>
            <span>
              STAMPS
            </span>

            <strong>
              {
                profile.stamps ||
                0
              }
            </strong>
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
  const [
    selected,
    setSelected
  ] = useState(null);

  const [code, setCode] =
    useState('');

  const [busy, setBusy] =
    useState(false);

  const [msg, setMsg] =
    useState('');

  const points =
    Number(
      profile.points || 0
    );

  async function redeem() {
    if (!selected) return;

    const required =
      Number(
        selected.points_required
      );

    if (points < required) {
      setMsg(
        'You do not have enough Sushi Points.'
      );

      return;
    }

    setBusy(true);
    setMsg('');

    const redemptionCode =
      'AHS-' +
      Math.random()
        .toString(36)
        .substring(
          2,
          7
        )
        .toUpperCase();

    const {
      data,
      error
    } =
      await supabase
        .from(
          'point_redemptions'
        )
        .insert({
          customer_id:
            profile.id,

          reward_id:
            selected.id,

          points_used:
            required,

          redemption_code:
            redemptionCode,

          status:
            'pending'
        })
        .select()
        .single();

    if (error) {
      setMsg(
        error.message
      );

      setBusy(false);
      return;
    }

    setCode(
      data.redemption_code
    );

    setBusy(false);
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(
        code
      );

      setMsg(
        'Code copied!'
      );
    } catch {
      setMsg(
        'Please copy the code manually.'
      );
    }
  }

  if (code) {
    return (
      <div className="page-container">

        <div className="success-card">

          <CheckCircle
            size={46}
          />

          <span className="section-label">
            REDEMPTION CODE
          </span>

          <h1>
            Show this to staff
          </h1>

          <p>
            Staff will confirm your redemption before your points are deducted.
          </p>

          <div className="redemption-code">
            {code}
          </div>

          <button
            className="primary-button"
            onClick={
              copyCode
            }
          >
            <Copy size={17} />
            Copy code
          </button>

          {msg && (
            <div className="notice">
              {msg}
            </div>
          )}

          <button
            className="text-button"
            onClick={() => {
              setCode('');
              setSelected(null);
              setMsg('');
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

        <h1>
          Rewards
        </h1>

        <p>
          You have{' '}
          <strong>
            {points.toFixed(0)}
            {' '}
            Sushi Points
          </strong>.
        </p>

      </div>

      <div className="reward-list">

        {rewards.map(
          (reward) => {
            const required =
              Number(
                reward.points_required
              );

            const available =
              points >=
              required;

            const isSelected =
              selected?.id ===
              reward.id;

            return (
              <button
                type="button"
                key={reward.id}
                className={`reward-card ${
                  isSelected
                    ? 'selected'
                    : ''
                } ${
                  !available
                    ? 'locked'
                    : ''
                }`}
                disabled={
                  !available
                }
                onClick={() =>
                  setSelected(
                    reward
                  )
                }
              >

                <span className="reward-number">
                  <Gift size={18} />
                </span>

                <span className="reward-content">

                  <strong>
                    {
                      reward.name
                    }
                  </strong>

                  <small>
                    {
                      reward.description ||
                      'Use your Sushi Points for this reward.'
                    }
                  </small>

                  <b>
                    {
                      required
                    }{' '}
                    points
                  </b>

                </span>

                <ChevronRight size={18} />

              </button>
            );
          }
        )}

        {rewards.length ===
          0 && (
          <div className="empty-card large">

            <Gift size={25} />

            <strong>
              No rewards available yet
            </strong>

            <p>
              Check back soon for rewards.
            </p>

          </div>
        )}

      </div>

      {selected && (
        <div className="redeem-box">

          <span className="section-label">
            CONFIRM REWARD
          </span>

          <h2>
            Redeem{' '}
            {
              selected.name
            }?
          </h2>

          <p>
            This will create a redemption code for{' '}
            <strong>
              {
                selected.points_required
              } points.
            </strong>
          </p>

          {msg && (
            <div className="notice">
              {msg}
            </div>
          )}

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

function HistoryTab({
  transactions
}) {
  return (
    <div className="page-container">

      <div className="page-heading">
        <span className="section-label">
          YOUR ACTIVITY
        </span>

        <h1>
          History
        </h1>
      </div>

      {transactions.length ===
      0 ? (
        <div className="empty-card large">

          <HistoryIcon size={25} />

          <strong>
            No transactions yet
          </strong>

          <p>
            Your activity will appear here.
          </p>

        </div>
      ) : (
        <div className="history-list">

          {transactions.map(
            (tx) => (
              <div
                className="history-card"
                key={tx.id}
              >

                <div>
                  <strong>
                    {
                      tx.transaction_type
                    }
                  </strong>

                  <small>
                    {formatDateTime(
                      tx.created_at
                    )}
                  </small>
                </div>

                <b className="history-points">
                  +
                  {Number(
                    tx.points_earned ||
                      0
                  ).toFixed(2)}
                </b>

              </div>
            )
          )}

        </div>
      )}

    </div>
  );
}

/* =====================================================
   CUSTOMER SETTINGS
===================================================== */

function CustomerSettings({
  session,
  profile,
  reloadProfile,
  onLogout
}) {
  const [name,setName]=useState(profile.full_name||'');
  const [phone,setPhone]=useState(profile.phone||'');
  const [birthday,setBirthday]=useState(profile.birthday||'');
  const [newPassword,setNewPassword]=useState('');
  const [confirmPassword,setConfirmPassword]=useState('');
  const [profileBusy,setProfileBusy]=useState(false);
  const [passwordBusy,setPasswordBusy]=useState(false);
  const [profileMessage,setProfileMessage]=useState('');
  const [passwordMessage,setPasswordMessage]=useState('');

  useEffect(()=>{
    setName(profile.full_name||'');
    setPhone(profile.phone||'');
    setBirthday(profile.birthday||'');
  },[profile]);

  async function saveProfile(e){
    e.preventDefault();

    if(!name.trim()){
      setProfileMessage(
        'Please enter your full name.'
      );
      return;
    }

    setProfileBusy(true);
    setProfileMessage('');

    const updates={
      full_name:name.trim(),
      phone:phone.trim()||null,
      birthday:birthday||null
    };

    const {error}=await supabase
      .from('customers')
      .update(updates)
      .eq('id',session.user.id);

    if(error){
      setProfileMessage(error.message);
      setProfileBusy(false);
      return;
    }

    await supabase.auth.updateUser({
      data:updates
    });

    await reloadProfile();

    setProfileMessage(
      'Your profile has been updated.'
    );

    setProfileBusy(false);
  }

  async function changePassword(e){
    e.preventDefault();

    if(newPassword.length<8){
      setPasswordMessage(
        'Your new password must be at least 8 characters.'
      );
      return;
    }

    if(newPassword!==confirmPassword){
      setPasswordMessage(
        'Your new passwords do not match.'
      );
      return;
    }

    setPasswordBusy(true);
    setPasswordMessage('');

    const {error}=await supabase.auth.updateUser({
      password:newPassword
    });

    if(error){
      setPasswordMessage(error.message);
    }else{
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage(
        'Your password has been changed.'
      );
    }

    setPasswordBusy(false);
  }

  return (
    <div className="page-container settings-page">

      <div className="page-heading">

        <span className="section-label">
          YOUR ACCOUNT
        </span>

        <h1>
          Settings
        </h1>

        <p>
          Manage your loyalty club account.
        </p>

      </div>

      <section className="settings-card">

        <div className="settings-card-heading">

          <span className="settings-icon">
            <User size={18} />
          </span>

          <div>
            <h2>
              Profile information
            </h2>

            <p>
              Keep your details up to date.
            </p>
          </div>

        </div>

        <form
          onSubmit={saveProfile}
        >

          <div className="field">
            <label>
              Full name
            </label>

            <input
              value={name}
              onChange={(e)=>
                setName(
                  e.target.value
                )
              }
              required
            />
          </div>

          <div className="field">
            <label>
              Phone number
            </label>

            <input
              value={phone}
              onChange={(e)=>
                setPhone(
                  e.target.value
                )
              }
              placeholder="09xxxxxxxxx"
            />
          </div>

          <div className="field">
            <label>
              Birthday
            </label>

            <input
              type="date"
              value={birthday}
              onChange={(e)=>
                setBirthday(
                  e.target.value
                )
              }
            />
          </div>

          {profileMessage && (
            <div className="notice">
              {profileMessage}
            </div>
          )}

          <button
            className="primary-button"
            type="submit"
            disabled={
              profileBusy
            }
          >
            <Save size={16} />

            {profileBusy
              ? 'Saving...'
              : 'Save changes'}
          </button>

        </form>

      </section>

      <section className="settings-card">

        <div className="settings-card-heading">

          <span className="settings-icon">
            <Lock size={18} />
          </span>

          <div>
            <h2>
              Change password
            </h2>

            <p>
              Use at least 8 characters.
            </p>
          </div>

        </div>

        <form
          onSubmit={
            changePassword
          }
        >

          <div className="field">
            <label>
              New password
            </label>

            <input
              type="password"
              value={newPassword}
              onChange={(e)=>
                setNewPassword(
                  e.target.value
                )
              }
              placeholder="New password"
              required
              minLength={8}
            />
          </div>

          <div className="field">
            <label>
              Confirm new password
            </label>

            <input
              type="password"
              value={
                confirmPassword
              }
              onChange={(e)=>
                setConfirmPassword(
                  e.target.value
                )
              }
              placeholder="Repeat new password"
              required
              minLength={8}
            />
          </div>

          {passwordMessage && (
            <div className="notice">
              {passwordMessage}
            </div>
          )}

          <button
            className="secondary-button"
            type="submit"
            disabled={
              passwordBusy
            }
          >
            {passwordBusy
              ? 'Updating...'
              : 'Update password'}
          </button>

        </form>

      </section>

      <section className="settings-card settings-links">

        <a href="#privacy-policy">
          <Shield size={18} />

          <span>
            <strong>
              Privacy Policy
            </strong>

            <small>
              How we handle your information
            </small>
          </span>

          <ChevronRight size={18} />
        </a>

        <a href="#terms-and-conditions">
          <Scale size={18} />

          <span>
            <strong>
              Terms &amp; Conditions
            </strong>

            <small>
              The terms for using the loyalty club
            </small>
          </span>

          <ChevronRight size={18} />
        </a>

        <a href="#about-at-home-sushi">
          <Info size={18} />

          <span>
            <strong>
              About At Home Sushi
            </strong>

            <small>
              Quick rolls. Bold flavors. Great rewards.
            </small>
          </span>

          <ChevronRight size={18} />
        </a>

      </section>

      <section className="settings-card settings-legal">

        <div id="privacy-policy">
          <h2>
            Privacy Policy
          </h2>

          <p>
            We use your account details to operate your loyalty membership, including points, rewards, and birthday offers.
          </p>
        </div>

        <div id="terms-and-conditions">
          <h2>
            Terms &amp; Conditions
          </h2>

          <p>
            Points and rewards are subject to availability and may not be exchanged for cash.
          </p>
        </div>

        <div id="about-at-home-sushi">
          <h2>
            About At Home Sushi
          </h2>

          <p>
            At Home Sushi brings quick rolls, bold flavors, and a little extra value to every order.
          </p>
        </div>

      </section>

      <button
        className="logout-button"
        type="button"
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
  const [staffSession,setStaffSession]=useState(null);
  const [checking,setChecking]=useState(true);
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [remember,setRemember]=useState(
    localStorage.getItem('staffRemember')==='true'
  );
  const [customerCode,setCustomerCode]=useState('');
  const [customer,setCustomer]=useState(null);
  const [amount,setAmount]=useState('');
  const [notes,setNotes]=useState('');
  const [msg,setMsg]=useState('');
  const [busy,setBusy]=useState(false);

  useEffect(()=>{
    checkStaffSession();
  },[]);

  async function checkStaffSession(){
    const {data}=await supabase.auth.getSession();
    setStaffSession(data.session);
    setChecking(false);
  }

  async function staffLogin(e){
    e.preventDefault();

    setBusy(true);
    setMsg('');

    if(remember){
      localStorage.setItem(
        'staffRemember',
        'true'
      );
    }else{
      localStorage.removeItem(
        'staffRemember'
      );
    }

    const {
      data,
      error
    }=await supabase.auth.signInWithPassword({
      email,
      password
    });

    if(error){
      setMsg(error.message);
      setBusy(false);
      return;
    }

    setStaffSession(data.session);
    setBusy(false);
  }

  async function staffLogout(){
    await supabase.auth.signOut();
    setStaffSession(null);
  }

  async function findCustomer(){
    const code=customerCode.trim();

    setMsg('');
    setCustomer(null);

    if(!code){
      setMsg(
        'Please enter the customer QR code.'
      );
      return;
    }

    setBusy(true);

    const {
      data,
      error
    }=await supabase
      .from('customers')
      .select('*')
      .eq('customer_code',code)
      .maybeSingle();

    setBusy(false);

    if(error){
      setMsg(error.message);
      return;
    }

    if(!data){
      setMsg(
        'Customer not found.'
      );
      return;
    }

    setCustomer(data);
    setNotes(data.notes||'');

    setMsg(
      `Customer found: ${data.full_name}`
    );
  }

  async function addPoints(){
    if(!customer){
      setMsg(
        'Find a customer first.'
      );
      return;
    }

    const purchase=parseFloat(amount);

    if(
      !Number.isFinite(
        purchase
      )||
      purchase<=0
    ){
      setMsg(
        'Enter a valid purchase amount.'
      );
      return;
    }

    const points=purchase/100;

    const newPoints=
      Number(customer.points||0)+points;

    setBusy(true);
    setMsg('');

    const {
      error:updateError
    }=await supabase
      .from('customers')
      .update({
        points:newPoints
      })
      .eq('id',customer.id);

    if(updateError){
      setMsg(updateError.message);
      setBusy(false);
      return;
    }

    const {
      error:transactionError
    }=await supabase
      .from('transactions')
      .insert({
        customer_id:customer.id,
        transaction_type:'purchase',
        points_earned:points
      });

    if(transactionError){
      setMsg(
        transactionError.message
      );
      setBusy(false);
      return;
    }

    setCustomer({
      ...customer,
      points:newPoints
    });

    setAmount('');

    setMsg(
      `Success! ${points.toFixed(
        2
      )} Sushi Points added.`
    );

    setBusy(false);
  }

  async function saveNotes(){
    if(!customer){
      setMsg(
        'Find a customer first.'
      );
      return;
    }

    setBusy(true);
    setMsg('');

    const {error}=await supabase
      .from('customers')
      .update({notes})
      .eq('id',customer.id);

    if(error){
      setMsg(error.message);
    }else{
      setCustomer({
        ...customer,
        notes
      });

      setMsg(
        'Customer notes saved.'
      );
    }

    setBusy(false);
  }

  async function claimBirthdayReward(){
    if(!customer){
      setMsg(
        'Find a customer first.'
      );
      return;
    }

    if(!customer.birthday){
      setMsg(
        'This customer has no birthday saved.'
      );
      return;
    }

    const today=new Date();
    const birthday=new Date(
      customer.birthday
    );

    const isBirthday=
      today.getMonth()===
        birthday.getMonth()&&
      today.getDate()===
        birthday.getDate();

    if(!isBirthday){
      setMsg(
        'Today is not this customer’s birthday.'
      );
      return;
    }

    const year=
      today.getFullYear();

    setBusy(true);
    setMsg('');

    const {
      data:claimed,
      error:checkError
    }=await supabase
      .from('birthday_claims')
      .select('id')
      .eq('customer_id',customer.id)
      .eq('birthday_year',year)
      .maybeSingle();

    if(checkError){
      setMsg(checkError.message);
      setBusy(false);
      return;
    }

    if(claimed){
      setMsg(
        'Birthday reward already claimed this year.'
      );
      setBusy(false);
      return;
    }

    const {
      data:reward,
      error:rewardError
    }=await supabase
      .from('birthday_rewards')
      .select('*')
      .eq('active',true)
      .order('id',{
        ascending:true
      })
      .limit(1)
      .maybeSingle();

    if(rewardError){
      setMsg(rewardError.message);
      setBusy(false);
      return;
    }

    if(!reward){
      setMsg(
        'No active birthday reward found.'
      );
      setBusy(false);
      return;
    }

    const {
      error:claimError
    }=await supabase
      .from('birthday_claims')
      .insert({
        customer_id:customer.id,
        birthday_year:year
      });

    if(claimError){
      setMsg(claimError.message);
      setBusy(false);
      return;
    }

    setMsg(
      `Birthday reward claimed: ${reward.reward_text}`
    );

    setBusy(false);
  }

  if(checking){
    return (
      <LoadingScreen
        text="Checking staff access"
      />
    );
  }

  if(!staffSession){
    return (
      <div className="auth-page">

        <div className="auth-shell">

          <div className="auth-brand">

            <img
              src={logo}
              alt="At Home Sushi"
            />

            <h1>
              AT HOME SUSHI
            </h1>

            <span>
              STAFF ACCESS
            </span>

          </div>

          <div className="auth-card">

            <div className="auth-heading">

              <h2>
                Staff Login
              </h2>

              <p>
                Manage customer points and rewards.
              </p>

            </div>

            <form
              onSubmit={
                staffLogin
              }
            >

              <div className="field">
                <label>
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e)=>
                    setEmail(
                      e.target.value
                    )
                  }
                  placeholder="Staff email"
                  required
                />
              </div>

              <PasswordField
                value={password}
                onChange={(e)=>
                  setPassword(
                    e.target.value
                  )
                }
                placeholder="Staff password"
              />

              <label className="remember-row">

                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e)=>
                    setRemember(
                      e.target.checked
                    )
                  }
                />

                <span>
                  Remember me
                </span>

              </label>

              {msg && (
                <div className="notice">
                  {msg}
                </div>
              )}

              <button
                className="primary-button"
                type="submit"
                disabled={busy}
              >
                <LogIn size={17}/>

                {busy
                  ? 'Logging in...'
                  : 'Log in'}
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

          <img
            src={logo}
            alt="At Home Sushi"
          />

          <div>
            <strong>
              AT HOME SUSHI
            </strong>

            <span>
              STAFF PANEL
            </span>
          </div>

        </div>

        <button
          className="header-action"
          onClick={
            staffLogout
          }
        >
          <LogOut size={18}/>
        </button>

      </header>

      <main className="staff-main">

        <div className="staff-heading">

          <span>
            STAFF
          </span>

          <h1>
            Customer Points
          </h1>

          <p>
            Scan or enter a customer's loyalty code.
          </p>

        </div>

        <div className="staff-card">

          <div className="section-label">
            FIND CUSTOMER
          </div>

          <div className="field">

            <label>
              Customer QR / Code
            </label>

            <input
              value={
                customerCode
              }
              onChange={(e)=>
                setCustomerCode(
                  e.target.value
                )
              }
              placeholder="Enter customer code"
            />

          </div>

          <button
            className="primary-button"
            onClick={
              findCustomer
            }
            disabled={busy}
          >
            <ScanLine size={18}/>

            {busy
              ? 'Finding...'
              : 'Find Customer'}
          </button>

        </div>

        {customer && (
          <div className="staff-card customer-card">

            <div className="section-label">
              CUSTOMER
            </div>

            <h2>
              {
                customer.full_name
              }
            </h2>

            {customer.email && (
              <p className="staff-muted">
                {
                  customer.email
                }
              </p>
            )}

            {customer.phone && (
              <p className="staff-muted">
                {
                  customer.phone
                }
              </p>
            )}

            <div className="staff-balances">

              <div>
                <Star size={18}/>

                <span>
                  POINTS
                </span>

                <strong>
                  {Number(
                    customer.points||
                    0
                  ).toFixed(2)}
                </strong>
              </div>

              <div>
                <Ticket size={18}/>

                <span>
                  STAMPS
                </span>

                <strong>
                  {
                    customer.stamps||
                    0
                  }
                </strong>
              </div>

            </div>

            {customer.birthday && (
              <p className="staff-muted birthday-line">

                <Cake size={15}/>

                Birthday:{' '}

                {formatDate(
                  customer.birthday
                )}

              </p>
            )}

            <div className="staff-divider"/>

            <div className="section-label">
              ADD POINTS
            </div>

            <div className="field">

              <label>
                Purchase amount
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e)=>
                  setAmount(
                    e.target.value
                  )
                }
                placeholder="₱0.00"
              />

            </div>

            {amount &&
              Number(amount)>0 && (
              <p className="points-preview">
                Points to add:{' '}
                <strong>
                  {(
                    Number(amount)/
                    100
                  ).toFixed(2)}
                </strong>
              </p>
            )}

            <button
              className="primary-button"
              onClick={
                addPoints
              }
              disabled={busy}
            >
              <PlusCircle size={18}/>

              {busy
                ? 'Updating...'
                : 'Add Points'}
            </button>

            <button
              className="secondary-staff-button"
              onClick={
                claimBirthdayReward
              }
              disabled={busy}
            >
              <Cake size={17}/>
              Claim Birthday Reward
            </button>

            <div className="staff-divider"/>

            <div className="section-label">
              CUSTOMER NOTES
            </div>

            <div className="field">

              <label>
                <FileText size={14}/>
                Notes
              </label>

              <textarea
                value={notes}
                onChange={(e)=>
                  setNotes(
                    e.target.value
                  )
                }
                placeholder="Add notes about this customer..."
              />

            </div>

            <button
              className="secondary-staff-button"
              onClick={
                saveNotes
              }
              disabled={busy}
            >
              {busy
                ? 'Saving...'
                : 'Save Notes'}
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

function AdminLogin({
  onLogin
}) {
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [remember,setRemember]=useState(
    localStorage.getItem(
      'adminRemember'
    ) === 'true'
  );
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState('');

  useEffect(()=>{
    const saved=
      localStorage.getItem(
        'adminEmail'
      );

    if(saved){
      setEmail(saved);
    }
  },[]);

  async function submit(e){
    e.preventDefault();

    setBusy(true);
    setMsg('');

    const {
      data,
      error
    }=await supabase.auth.signInWithPassword({
      email:email.trim(),
      password
    });

    if(error){
      setMsg(error.message);
      setBusy(false);
      return;
    }

    if(remember){
      localStorage.setItem(
        'adminRemember',
        'true'
      );

      localStorage.setItem(
        'adminEmail',
        email
      );
    }else{
      localStorage.removeItem(
        'adminRemember'
      );

      localStorage.removeItem(
        'adminEmail'
      );
    }

    onLogin(
      data.session
    );

    setBusy(false);
  }

  return (
    <div className="auth-page">

      <div className="auth-shell">

        <div className="auth-brand">

          <img
            src={logo}
            alt="At Home Sushi"
          />

          <h1>
            AT HOME SUSHI
          </h1>

          <span>
            ADMIN
          </span>

        </div>

        <div className="auth-card">

          <div className="auth-heading">

            <h2>
              Admin Login
            </h2>

            <p>
              Manage your At Home Sushi loyalty club.
            </p>

          </div>

          <form
            onSubmit={
              submit
            }
          >

            <div className="field">
              <label>
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e)=>
                  setEmail(
                    e.target.value
                  )
                }
                placeholder="Admin email"
                required
              />
            </div>

            <PasswordField
              value={password}
              onChange={(e)=>
                setPassword(
                  e.target.value
                )
              }
              placeholder="Admin password"
            />

            <label className="remember-row">

              <input
                type="checkbox"
                checked={
                  remember
                }
                onChange={(e)=>
                  setRemember(
                    e.target.checked
                  )
                }
              />

              <span>
                Remember me
              </span>

            </label>

            {msg && (
              <div className="notice">
                {msg}
              </div>
            )}

            <button
              className="primary-button"
              type="submit"
              disabled={busy}
            >
              <LogIn size={17}/>

              {busy
                ? 'Logging in...'
                : 'Enter Admin'}
            </button>

          </form>

        </div>

      </div>

    </div>
  );
}

/* =====================================================
   ADMIN APP
===================================================== */

function AdminApp({
  session,
  onLogout
}) {
  const [
    section,
    setSection
  ] = useState('dashboard');

  const [
    refreshKey,
    setRefreshKey
  ] = useState(0);

  const [sidebarOpen,setSidebarOpen]=useState(false);

  function refresh(){
    setRefreshKey(
      value=>value+1
    );
  }

  const nav=[
    {
      id:'dashboard',
      label:'Dashboard',
      icon:LayoutDashboard
    },
    {
      id:'business',
      label:'Business',
      icon:Store
    },
    {
      id:'menu',
      label:'Menu Management',
      icon:MenuIcon
    },
    {
      id:'rewards',
      label:'Rewards',
      icon:Gift
    },
    {
      id:'loyalty',
      label:'Loyalty Settings',
      icon:Star
    },
    {
      id:'customers',
      label:'Customers',
      icon:Users
    },
    {
      id:'transactions',
      label:'Transactions',
      icon:Receipt
    },
    {
      id:'birthday',
      label:'Birthday Rewards',
      icon:Cake
    },
    {
      id:'staff',
      label:'Admin / Staff',
      icon:Shield
    },
    {
      id:'homepage',
      label:'Homepage',
      icon:HomeIcon
    },
    {
      id:'general',
      label:'General Settings',
      icon:SlidersHorizontal
    }
  ];

  function changeSection(id){
    setSection(id);
    setSidebarOpen(false);
  }

  return (
    <div className="admin-shell">

      <aside
        className={`admin-sidebar ${
          sidebarOpen
            ? 'open'
            : ''
        }`}
      >

        <div className="admin-sidebar-brand">

          <img
            src={logo}
            alt="At Home Sushi"
          />

          <div>
            <strong>
              AT HOME SUSHI
            </strong>

            <span>
              ADMIN
            </span>
          </div>

        </div>

        <nav className="admin-nav">

          <div className="admin-nav-label">
            MANAGEMENT
          </div>

          {nav.map(
            item=>{
              const Icon=item.icon;

              return (
                <button
                  key={item.id}
                  className={
                    section===
                    item.id
                      ? 'active'
                      : ''
                  }
                  onClick={()=>
                    changeSection(
                      item.id
                    )
                  }
                >
                  <Icon size={18}/>
                  <span>
                    {item.label}
                  </span>
                </button>
              );
            }
          )}

        </nav>

        <div className="admin-sidebar-footer">

          <button
            onClick={
              onLogout
            }
          >
            <LogOut size={17}/>
            Sign out
          </button>

        </div>

      </aside>

      {sidebarOpen && (
        <div
          className="admin-mobile-overlay"
          onClick={()=>
            setSidebarOpen(false)
          }
        />
      )}

      <div className="admin-content">

        <header className="admin-header">

          <button
            className="admin-mobile-menu"
            onClick={()=>
              setSidebarOpen(
                true
              )
            }
          >
            <MenuIcon size={21}/>
          </button>

          <div>

            <span className="section-label">
              ADMINISTRATION
            </span>

            <h1>
              {
                nav.find(
                  item=>
                    item.id===
                    section
                )?.label ||
                'Dashboard'
              }
            </h1>

          </div>

          <div className="admin-header-actions">

            <button
              title="Refresh"
              onClick={
                refresh
              }
            >
              <RefreshCw
                size={18}
              />
            </button>

            <button
              title="View customer app"
              onClick={()=>{
                window.location.href='/';
              }}
            >
              <HomeIcon
                size={18}
              />
            </button>

          </div>

        </header>

        <main className="admin-main">

          {section==='dashboard'&&(
            <AdminDashboard
              key={refreshKey}
              onNavigate={
                changeSection
              }
            />
          )}

          {section==='business'&&(
            <BusinessSettings
              key={refreshKey}
            />
          )}

          {section==='menu'&&(
            <MenuManagement
              key={refreshKey}
            />
          )}

          {section==='rewards'&&(
            <RewardManagement
              key={refreshKey}
            />
          )}

          {section==='loyalty'&&(
            <LoyaltySettings
              key={refreshKey}
            />
          )}

          {section==='customers'&&(
            <CustomerManagement
              key={refreshKey}
            />
          )}

          {section==='transactions'&&(
            <TransactionManagement
              key={refreshKey}
            />
          )}

          {section==='birthday'&&(
            <BirthdayManagement
              key={refreshKey}
            />
          )}

          {section==='staff'&&(
            <StaffSettings
              key={refreshKey}
            />
          )}

          {section==='homepage'&&(
            <HomepageSettings
              key={refreshKey}
            />
          )}

          {section==='general'&&(
            <GeneralSettings
              key={refreshKey}
            />
          )}

        </main>

      </div>

    </div>
  );
}

/* =====================================================
   ADMIN DASHBOARD
===================================================== */

function AdminDashboard({
  onNavigate
}) {
  const [stats,setStats]=useState({
    customers:0,
    menu:0,
    rewards:0,
    transactions:0
  });

  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    load();
  },[]);

  async function count(table){
    const {
      count,
      error
    }=await supabase
      .from(table)
      .select('*',{
        count:'exact',
        head:true
      });

    if(error){
      console.error(
        table,
        error
      );
    }

    return count||0;
  }

  async function load(){
    setLoading(true);

    const [
      customers,
      menu,
      rewards,
      transactions
    ]=await Promise.all([
      count('customers'),
      count('menu_items'),
      count('rewards'),
      count('transactions')
    ]);

    setStats({
      customers,
      menu,
      rewards,
      transactions
    });

    setLoading(false);
  }

  const cards=[
    {
      label:'Customers',
      value:stats.customers,
      icon:Users,
      section:'customers'
    },
    {
      label:'Menu Items',
      value:stats.menu,
      icon:MenuIcon,
      section:'menu'
    },
    {
      label:'Active Rewards',
      value:stats.rewards,
      icon:Gift,
      section:'rewards'
    },
    {
      label:'Transactions',
      value:stats.transactions,
      icon:Receipt,
      section:'transactions'
    }
  ];

  return (
    <div>

      <div className="admin-welcome">

        <div>
          <span className="section-label">
            AT HOME SUSHI
          </span>

          <h2>
            Good evening, Admin.
          </h2>

          <p>
            Here's what's happening with your loyalty club.
          </p>
        </div>

      </div>

      <div className="admin-stat-grid">

        {cards.map(
          card=>{
            const Icon=card.icon;

            return (
              <button
                className="admin-stat-card"
                key={card.label}
                onClick={()=>
                  onNavigate(
                    card.section
                  )
                }
              >

                <span className="admin-stat-icon">
                  <Icon size={20}/>
                </span>

                <span className="admin-stat-label">
                  {card.label}
                </span>

                <strong>
                  {loading
                    ? '—'
                    : card.value}
                </strong>

                <ChevronRight size={17}/>

              </button>
            );
          }
        )}

      </div>

      <div className="admin-section-grid">

        <section className="admin-panel">

          <div className="admin-panel-heading">

            <div>
              <span className="section-label">
                QUICK ACTIONS
              </span>

              <h2>
                Manage your store
              </h2>
            </div>

          </div>

          <div className="quick-action-grid">

            <button
              onClick={()=>
                onNavigate(
                  'menu'
                )
              }
            >
              <Plus size={18}/>
              Add sushi
            </button>

            <button
              onClick={()=>
                onNavigate(
                  'rewards'
                )
              }
            >
              <Gift size={18}/>
              Add reward
            </button>

            <button
              onClick={()=>
                onNavigate(
                  'business'
                )
              }
            >
              <Store size={18}/>
              Business info
            </button>

            <button
              onClick={()=>
                onNavigate(
                  'homepage'
                )
              }
            >
              <Sparkles size={18}/>
              Homepage
            </button>

          </div>

        </section>

        <section className="admin-panel">

          <div className="admin-panel-heading">

            <div>
              <span className="section-label">
                SYSTEM
              </span>

              <h2>
                App settings
              </h2>
            </div>

          </div>

          <button
            className="admin-list-action"
            onClick={()=>
              onNavigate(
                'loyalty'
              )
            }
          >
            <Star size={18}/>
            <span>
              <strong>
                Loyalty rules
              </strong>
              <small>
                Points, stamps and redemption
              </small>
            </span>
            <ChevronRight size={18}/>
          </button>

          <button
            className="admin-list-action"
            onClick={()=>
              onNavigate(
                'general'
              )
            }
          >
            <SlidersHorizontal size={18}/>
            <span>
              <strong>
                General settings
              </strong>
              <small>
                App-wide settings
              </small>
            </span>
            <ChevronRight size={18}/>
          </button>

          <button
            className="admin-list-action"
            onClick={()=>
              onNavigate(
                'staff'
              )
            }
          >
            <Shield size={18}/>
            <span>
              <strong>
                Admin / Staff
              </strong>
              <small>
                Manage access
              </small>
            </span>
            <ChevronRight size={18}/>
          </button>

        </section>

      </div>

    </div>
  );
}

/* =====================================================
   BUSINESS SETTINGS
===================================================== */

function BusinessSettings() {
  const [form,setForm]=useState({
    business_name:'At Home Sushi',
    location:'',
    contact_number:'',
    facebook:'',
    instagram:'',
    opening_hours:'',
    logo_url:''
  });

  const [loading,setLoading]=useState(true);
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState('');

  useEffect(()=>{
    load();
  },[]);

  async function load(){
    const {
      data,
      error
    }=await supabase
      .from('app_settings')
      .select('*')
      .eq('id',1)
      .maybeSingle();

    if(!error&&data){
      setForm(current=>({
        ...current,
        ...data
      }));
    }

    setLoading(false);
  }

  function update(key,value){
    setForm(current=>({
      ...current,
      [key]:value
    }));
  }

  async function save(e){
    e.preventDefault();

    setBusy(true);
    setMsg('');

    const payload={
      id:1,
      business_name:form.business_name,
      location:form.location,
      contact_number:form.contact_number,
      facebook:form.facebook,
      instagram:form.instagram,
      opening_hours:form.opening_hours,
      logo_url:form.logo_url
    };

    const {
      error
    }=await supabase
      .from('app_settings')
      .upsert(payload);

    if(error){
      setMsg(
        `Could not save: ${error.message}`
      );
    }else{
      setMsg(
        'Business information saved.'
      );
    }

    setBusy(false);
  }

  if(loading){
    return <AdminLoading/>;
  }

  return (
    <div className="admin-form-page">

      <AdminIntro
        label="BUSINESS"
        title="Business information"
        description="Control the information customers see throughout the loyalty app."
      />

      <form
        className="admin-panel admin-form"
        onSubmit={save}
      >

        <div className="admin-form-section">

          <h3>
            Business details
          </h3>

          <div className="admin-form-grid">

            <AdminInput
              label="Business name"
              value={form.business_name}
              onChange={v=>
                update(
                  'business_name',
                  v
                )
              }
            />

            <AdminInput
              label="Contact number"
              value={form.contact_number}
              onChange={v=>
                update(
                  'contact_number',
                  v
                )
              }
            />

            <AdminInput
              label="Location"
              value={form.location}
              onChange={v=>
                update(
                  'location',
                  v
                )
              }
              wide
            />

            <AdminInput
              label="Opening hours"
              value={form.opening_hours}
              onChange={v=>
                update(
                  'opening_hours',
                  v
                )
              }
              placeholder="Daily · 11:00 AM – 9:00 PM"
              wide
            />

          </div>

        </div>

        <div className="admin-form-section">

          <h3>
            Social media
          </h3>

          <div className="admin-form-grid">

            <AdminInput
              label="Facebook"
              value={form.facebook}
              onChange={v=>
                update(
                  'facebook',
                  v
                )
              }
            />

            <AdminInput
              label="Instagram"
              value={form.instagram}
              onChange={v=>
                update(
                  'instagram',
                  v
                )
              }
            />

          </div>

        </div>

        <div className="admin-form-section">

          <h3>
            Logo
          </h3>

          <p className="admin-help">
            Paste a public image URL for your logo. We can connect Supabase Storage uploading next if you want actual file uploads.
          </p>

          <AdminInput
            label="Logo image URL"
            value={form.logo_url}
            onChange={v=>
              update(
                'logo_url',
                v
              )
            }
            wide
            placeholder="https://..."
          />

          {form.logo_url && (
            <div className="admin-logo-preview">
              <img
                src={form.logo_url}
                alt="Business logo"
              />
            </div>
          )}

        </div>

        {msg&&(
          <div className="notice">
            {msg}
          </div>
        )}

        <AdminSaveButton
          busy={busy}
        />

      </form>

    </div>
  );
}

/* =====================================================
   MENU MANAGEMENT
===================================================== */

function MenuManagement() {
  const empty={
    id:null,
    name:'',
    category:'classic',
    description:'',
    ingredients:'',
    price:'',
    image_url:'',
    active:true,
    sort_order:0
  };

  const [
    items,
    setItems
  ]=useState([]);

  const [
    form,
    setForm
  ]=useState(empty);

  const [
    editing,
    setEditing
  ]=useState(false);

  const [
    busy,
    setBusy
  ]=useState(false);

  const [
    msg,
    setMsg
  ]=useState('');

  const [
    search,
    setSearch
  ]=useState('');

  useEffect(()=>{
    load();
  },[]);

  async function load(){
    const {
      data,
      error
    }=await supabase
      .from('menu_items')
      .select('*')
      .order('sort_order',{
        ascending:true
      })
      .order('name',{
        ascending:true
      });

    if(error){
      setMsg(error.message);
    }else{
      setItems(data||[]);
    }
  }

  function update(key,value){
    setForm(current=>({
      ...current,
      [key]:value
    }));
  }

  function startAdd(){
    setForm(empty);
    setEditing(true);
    setMsg('');
    window.scrollTo({
      top:0,
      behavior:'smooth'
    });
  }

  function startEdit(item){
    setForm({
      ...empty,
      ...item,
      price:item.price??''
    });

    setEditing(true);
    setMsg('');

    window.scrollTo({
      top:0,
      behavior:'smooth'
    });
  }

  function cancel(){
    setForm(empty);
    setEditing(false);
    setMsg('');
  }

  async function save(e){
    e.preventDefault();

    if(!form.name.trim()){
      setMsg(
        'Please enter a sushi name.'
      );
      return;
    }

    setBusy(true);
    setMsg('');

    const payload={
      name:form.name.trim(),
      category:form.category,
      description:
        form.description||
        null,
      ingredients:
        form.ingredients||
        null,
      price:
        form.price===''?
        null:
        Number(form.price),
      image_url:
        form.image_url||
        null,
      active:
        Boolean(form.active),
      sort_order:
        Number(
          form.sort_order||0
        )
    };

    let error;

    if(form.id){
      ({
        error
      }=await supabase
        .from('menu_items')
        .update(payload)
        .eq('id',form.id));
    }else{
      ({
        error
      }=await supabase
        .from('menu_items')
        .insert(payload));
    }

    if(error){
      setMsg(error.message);
    }else{
      setMsg(
        form.id
          ? 'Menu item updated.'
          : 'Menu item added.'
      );

      cancel();
      await load();
    }

    setBusy(false);
  }

  async function remove(item){
    const ok=window.confirm(
      `Delete "${item.name}"?`
    );

    if(!ok)return;

    setBusy(true);

    const {
      error
    }=await supabase
      .from('menu_items')
      .delete()
      .eq('id',item.id);

    if(error){
      setMsg(error.message);
    }else{
      await load();
      setMsg(
        'Menu item deleted.'
      );
    }

    setBusy(false);
  }

  async function toggle(item){
    const {
      error
    }=await supabase
      .from('menu_items')
      .update({
        active:!item.active
      })
      .eq('id',item.id);

    if(error){
      setMsg(error.message);
    }else{
      await load();
    }
  }

  const filtered=items.filter(
    item=>
      `${item.name} ${item.category}`
        .toLowerCase()
        .includes(
          search.toLowerCase()
        )
  );

  return (
    <div className="admin-form-page">

      <AdminIntro
        label="MENU"
        title="Menu management"
        description="Add, edit and control the sushi items customers see in the app."
        action={
          <button
            className="primary-button"
            onClick={
              startAdd
            }
          >
            <Plus size={17}/>
            Add sushi
          </button>
        }
      />

      {editing&&(
        <form
          className="admin-panel admin-form"
          onSubmit={save}
        >

          <div className="admin-panel-heading">

            <div>
              <span className="section-label">
                {form.id
                  ? 'EDIT ITEM'
                  : 'NEW ITEM'}
              </span>

              <h2>
                {form.id
                  ? 'Edit sushi'
                  : 'Add sushi'}
              </h2>
            </div>

            <button
              type="button"
              className="admin-icon-button"
              onClick={
                cancel
              }
            >
              <X size={18}/>
            </button>

          </div>

          <div className="admin-form-grid">

            <AdminInput
              label="Sushi name"
              value={form.name}
              onChange={v=>
                update(
                  'name',
                  v
                )
              }
            />

            <div className="field">
              <label>
                Category
              </label>

              <select
                value={
                  form.category
                }
                onChange={e=>
                  update(
                    'category',
                    e.target.value
                  )
                }
              >
                <option value="appetizers">
                  Appetizers
                </option>

                <option value="classic">
                  Classic Rolls
                </option>

                <option value="specialty">
                  Specialty Rolls
                </option>

                <option value="signature">
                  Signature Rolls
                </option>

                <option value="veggie">
                  Veggie
                </option>

                <option value="nigiri">
                  Nigiri
                </option>

                <option value="sashimi">
                  Sashimi
                </option>

                <option value="platters">
                  Platters
                </option>
              </select>
            </div>

            <AdminInput
              label="Price"
              type="number"
              value={
                form.price
              }
              onChange={v=>
                update(
                  'price',
                  v
                )
              }
              placeholder="0.00"
            />

            <AdminInput
              label="Sort order"
              type="number"
              value={
                form.sort_order
              }
              onChange={v=>
                update(
                  'sort_order',
                  v
                )
              }
            />

            <AdminInput
              label="Description"
              value={
                form.description
              }
              onChange={v=>
                update(
                  'description',
                  v
                )
              }
              wide
            />

            <div className="field admin-wide">
              <label>
                Ingredients
              </label>

              <textarea
                value={
                  form.ingredients
                }
                onChange={e=>
                  update(
                    'ingredients',
                    e.target.value
                  )
                }
                placeholder="Salmon, avocado, cream cheese..."
              />
            </div>

            <AdminInput
              label="Sushi photo URL"
              value={
                form.image_url
              }
              onChange={v=>
                update(
                  'image_url',
                  v
                )
              }
              wide
              placeholder="https://..."
            />

          </div>

          <label className="admin-toggle-row">

            <input
              type="checkbox"
              checked={
                Boolean(
                  form.active
                )
              }
              onChange={e=>
                update(
                  'active',
                  e.target.checked
                )
              }
            />

            <span>
              Available on the customer menu
            </span>

          </label>

          {form.image_url&&(
            <div className="admin-menu-preview">
              <img
                src={
                  form.image_url
                }
                alt={
                  form.name ||
                  'Preview'
                }
              />
            </div>
          )}

          {msg&&(
            <div className="notice">
              {msg}
            </div>
          )}

          <div className="admin-form-actions">

            <button
              type="button"
              className="secondary-button"
              onClick={
                cancel
              }
            >
              Cancel
            </button>

            <AdminSaveButton
              busy={busy}
              text={
                form.id
                  ? 'Save sushi'
                  : 'Add sushi'
              }
            />

          </div>

        </form>
      )}

      <div className="admin-panel">

        <div className="admin-toolbar">

          <div className="admin-search">

            <Search size={17}/>

            <input
              value={search}
              onChange={e=>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search sushi..."
            />

          </div>

          <span className="admin-count">
            {filtered.length} items
          </span>

        </div>

        <div className="admin-table-wrap">

          <table className="admin-table">

            <thead>
              <tr>
                <th>
                  Sushi
                </th>

                <th>
                  Category
                </th>

                <th>
                  Price
                </th>

                <th>
                  Status
                </th>

                <th>
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>

              {filtered.map(
                item=>(
                  <tr
                    key={
                      item.id
                    }
                  >

                    <td>
                      <div className="admin-product-cell">

                        {item.image_url?(
                          <img
                            src={
                              item.image_url
                            }
                            alt=""
                          />
                        ):(
                          <span>
                            🍣
                          </span>
                        )}

                        <div>
                          <strong>
                            {
                              item.name
                            }
                          </strong>

                          <small>
                            {
                              item.ingredients ||
                              item.description ||
                              'No description'
                            }
                          </small>
                        </div>

                      </div>
                    </td>

                    <td>
                      {
                        item.category
                      }
                    </td>

                    <td>
                      {
                        item.price!=null
                          ?formatMoney(
                            item.price
                          )
                          :'—'
                      }
                    </td>

                    <td>
                      <button
                        className={`status-pill ${
                          item.active
                            ?'active'
                            :'inactive'
                        }`}
                        onClick={()=>
                          toggle(
                            item
                          )
                        }
                      >
                        {
                          item.active
                            ?'Available'
                            :'Hidden'
                        }
                      </button>
                    </td>

                    <td>

                      <div className="admin-row-actions">

                        <button
                          className="admin-icon-button"
                          onClick={()=>
                            startEdit(
                              item
                            )
                          }
                          title="Edit"
                        >
                          <Pencil size={16}/>
                        </button>

                        <button
                          className="admin-icon-button danger"
                          onClick={()=>
                            remove(
                              item
                            )
                          }
                          title="Delete"
                        >
                          <Trash2 size={16}/>
                        </button>

                      </div>

                    </td>

                  </tr>
                )
              )}

              {filtered.length===0&&(
                <tr>
                  <td
                    colSpan="5"
                    className="admin-empty-cell"
                  >
                    No menu items found.
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}

/* =====================================================
   REWARD MANAGEMENT
===================================================== */

function RewardManagement() {
  const empty={
    id:null,
    name:'',
    description:'',
    points_required:'',
    active:true
  };

  const [rewards,setRewards]=useState([]);
  const [form,setForm]=useState(empty);
  const [editing,setEditing]=useState(false);
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState('');

  useEffect(()=>{
    load();
  },[]);

  async function load(){
    const {
      data,
      error
    }=await supabase
      .from('rewards')
      .select('*')
      .order('points_required',{
        ascending:true
      });

    if(error){
      setMsg(error.message);
    }else{
      setRewards(data||[]);
    }
  }

  function update(key,value){
    setForm(current=>({
      ...current,
      [key]:value
    }));
  }

  function add(){
    setForm(empty);
    setEditing(true);
    setMsg('');
  }

  function edit(item){
    setForm({
      ...empty,
      ...item
    });

    setEditing(true);
    setMsg('');
  }

  async function save(e){
    e.preventDefault();

    if(!form.name.trim()){
      setMsg(
        'Enter a reward name.'
      );
      return;
    }

    if(
      !Number.isFinite(
        Number(
          form.points_required
        )
      )
    ){
      setMsg(
        'Enter the points required.'
      );
      return;
    }

    setBusy(true);
    setMsg('');

    const payload={
      name:
        form.name.trim(),
      description:
        form.description||
        null,
      points_required:
        Number(
          form.points_required
        ),
      active:
        Boolean(form.active)
    };

    let error;

    if(form.id){
      ({
        error
      }=await supabase
        .from('rewards')
        .update(payload)
        .eq('id',form.id));
    }else{
      ({
        error
      }=await supabase
        .from('rewards')
        .insert(payload));
    }

    if(error){
      setMsg(error.message);
    }else{
      setEditing(false);
      setForm(empty);
      await load();

      setMsg(
        form.id
          ? 'Reward updated.'
          : 'Reward added.'
      );
    }

    setBusy(false);
  }

  async function remove(item){
    if(!window.confirm(
      `Delete "${item.name}"?`
    ))return;

    const {
      error
    }=await supabase
      .from('rewards')
      .delete()
      .eq('id',item.id);

    if(error){
      setMsg(error.message);
    }else{
      await load();
      setMsg(
        'Reward deleted.'
      );
    }
  }

  async function toggle(item){
    const {
      error
    }=await supabase
      .from('rewards')
      .update({
        active:!item.active
      })
      .eq('id',item.id);

    if(error){
      setMsg(error.message);
    }else{
      await load();
    }
  }

  return (
    <div className="admin-form-page">

      <AdminIntro
        label="REWARDS"
        title="Rewards management"
        description="Create the rewards customers can unlock with their Sushi Points."
        action={
          <button
            className="primary-button"
            onClick={
              add
            }
          >
            <Plus size={17}/>
            Add reward
          </button>
        }
      />

      {editing&&(
        <form
          className="admin-panel admin-form"
          onSubmit={save}
        >

          <div className="admin-form-grid">

            <AdminInput
              label="Reward name"
              value={form.name}
              onChange={v=>
                update(
                  'name',
                  v
                )
              }
            />

            <AdminInput
              label="Points required"
              type="number"
              value={
                form.points_required
              }
              onChange={v=>
                update(
                  'points_required',
                  v
                )
              }
            />

            <AdminInput
              label="Description"
              value={
                form.description
              }
              onChange={v=>
                update(
                  'description',
                  v
                )
              }
              wide
            />

          </div>

          <label className="admin-toggle-row">
            <input
              type="checkbox"
              checked={
                Boolean(
                  form.active
                )
              }
              onChange={e=>
                update(
                  'active',
                  e.target.checked
                )
              }
            />

            <span>
              Reward is active
            </span>
          </label>

          {msg&&(
            <div className="notice">
              {msg}
            </div>
          )}

          <div className="admin-form-actions">

            <button
              type="button"
              className="secondary-button"
              onClick={()=>{
                setEditing(false);
                setForm(empty);
              }}
            >
              Cancel
            </button>

            <AdminSaveButton
              busy={busy}
              text={
                form.id
                  ? 'Save reward'
                  : 'Add reward'
              }
            />

          </div>

        </form>
      )}

      <div className="admin-panel">

        <div className="admin-list">

          {rewards.map(
            reward=>(
              <div
                className="admin-list-row"
                key={
                  reward.id
                }
              >

                <div className="admin-list-icon">
                  <Gift size={19}/>
                </div>

                <div className="admin-list-main">

                  <strong>
                    {
                      reward.name
                    }
                  </strong>

                  <small>
                    {
                      reward.description ||
                      'No description'
                    }
                  </small>

                </div>

                <div className="admin-list-value">
                  {
                    reward.points_required
                  }
                  <small>
                    points
                  </small>
                </div>

                <button
                  className={`status-pill ${
                    reward.active
                      ?'active'
                      :'inactive'
                  }`}
                  onClick={()=>
                    toggle(
                      reward
                    )
                  }
                >
                  {
                    reward.active
                      ?'Active'
                      :'Inactive'
                  }
                </button>

                <div className="admin-row-actions">

                  <button
                    className="admin-icon-button"
                    onClick={()=>
                      edit(
                        reward
                      )
                    }
                  >
                    <Pencil size={16}/>
                  </button>

                  <button
                    className="admin-icon-button danger"
                    onClick={()=>
                      remove(
                        reward
                      )
                    }
                  >
                    <Trash2 size={16}/>
                  </button>

                </div>

              </div>
            )
          )}

          {rewards.length===0&&(
            <div className="admin-empty">
              No rewards have been created yet.
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

/* =====================================================
   LOYALTY SETTINGS
===================================================== */

function LoyaltySettings() {
  const defaults={
    points_per_amount:100,
    points_earned:1,
    stamps_enabled:true,
    stamps_required:8,
    redemption_enabled:true,
    minimum_redemption_points:0
  };

  const [form,setForm]=useState(defaults);
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(true);
  const [msg,setMsg]=useState('');

  useEffect(()=>{
    load();
  },[]);

  async function load(){
    const {
      data,
      error
    }=await supabase
      .from('loyalty_settings')
      .select('*')
      .eq('id',1)
      .maybeSingle();

    if(!error&&data){
      setForm({
        ...defaults,
        ...data
      });
    }

    setLoading(false);
  }

  function update(key,value){
    setForm(current=>({
      ...current,
      [key]:value
    }));
  }

  async function save(e){
    e.preventDefault();

    setBusy(true);
    setMsg('');

    const {
      error
    }=await supabase
      .from('loyalty_settings')
      .upsert({
        id:1,
        points_per_amount:
          Number(
            form.points_per_amount
          ),
        points_earned:
          Number(
            form.points_earned
          ),
        stamps_enabled:
          Boolean(
            form.stamps_enabled
          ),
        stamps_required:
          Number(
            form.stamps_required
          ),
        redemption_enabled:
          Boolean(
            form.redemption_enabled
          ),
        minimum_redemption_points:
          Number(
            form.minimum_redemption_points
          )
      });

    if(error){
      setMsg(error.message);
    }else{
      setMsg(
        'Loyalty settings saved.'
      );
    }

    setBusy(false);
  }

  if(loading){
    return <AdminLoading/>;
  }

  return (
    <div className="admin-form-page">

      <AdminIntro
        label="LOYALTY"
        title="Loyalty settings"
        description="Control how customers earn and redeem Sushi Points."
      />

      <form
        className="admin-panel admin-form"
        onSubmit={save}
      >

        <div className="admin-form-section">

          <h3>
            Points earning
          </h3>

          <div className="admin-form-grid">

            <AdminInput
              label="Amount spent"
              type="number"
              value={
                form.points_per_amount
              }
              onChange={v=>
                update(
                  'points_per_amount',
                  v
                )
              }
              help="Example: 100 means every ₱100 spent."
            />

            <AdminInput
              label="Points earned"
              type="number"
              value={
                form.points_earned
              }
              onChange={v=>
                update(
                  'points_earned',
                  v
                )
              }
              help="Example: 1 means ₱100 = 1 Sushi Point."
            />

          </div>

        </div>

        <div className="admin-form-section">

          <h3>
            Stamps
          </h3>

          <label className="admin-toggle-row">
            <input
              type="checkbox"
              checked={
                Boolean(
                  form.stamps_enabled
                )
              }
              onChange={e=>
                update(
                  'stamps_enabled',
                  e.target.checked
                )
              }
            />

            <span>
              Enable stamp rewards
            </span>
          </label>

          <AdminInput
            label="Stamps required"
            type="number"
            value={
              form.stamps_required
            }
            onChange={v=>
              update(
                'stamps_required',
                v
              )
            }
          />

        </div>

        <div className="admin-form-section">

          <h3>
            Redemption
          </h3>

          <label className="admin-toggle-row">
            <input
              type="checkbox"
              checked={
                Boolean(
                  form.redemption_enabled
                )
              }
              onChange={e=>
                update(
                  'redemption_enabled',
                  e.target.checked
                )
              }
            />

            <span>
              Allow customers to generate redemption codes
            </span>
          </label>

          <AdminInput
            label="Minimum redemption points"
            type="number"
            value={
              form.minimum_redemption_points
            }
            onChange={v=>
              update(
                'minimum_redemption_points',
                v
              )
            }
          />

        </div>

        {msg&&(
          <div className="notice">
            {msg}
          </div>
        )}

        <AdminSaveButton
          busy={busy}
        />

      </form>

    </div>
  );
}

/* =====================================================
   CUSTOMER MANAGEMENT
===================================================== */

function CustomerManagement() {
  const [
    customers,
    setCustomers
  ]=useState([]);

  const [
    search,
    setSearch
  ]=useState('');

  const [
    selected,
    setSelected
  ]=useState(null);

  const [
    busy,
    setBusy
  ]=useState(false);

  const [
    msg,
    setMsg
  ]=useState('');

  useEffect(()=>{
    load();
  },[]);

  async function load(){
    const {
      data,
      error
    }=await supabase
      .from('customers')
      .select('*')
      .order('created_at',{
        ascending:false
      });

    if(error){
      setMsg(error.message);
    }else{
      setCustomers(
        data||[]
      );
    }
  }

  async function saveCustomer(e){
    e.preventDefault();

    if(!selected)return;

    setBusy(true);
    setMsg('');

    const {
      error
    }=await supabase
      .from('customers')
      .update({
        full_name:
          selected.full_name,
        phone:
          selected.phone||
          null,
        birthday:
          selected.birthday||
          null,
        notes:
          selected.notes||
          null,
        points:
          Number(
            selected.points||
            0
          ),
        stamps:
          Number(
            selected.stamps||
            0
          )
      })
      .eq(
        'id',
        selected.id
      );

    if(error){
      setMsg(error.message);
    }else{
      await load();

      setMsg(
        'Customer updated.'
      );
    }

    setBusy(false);
  }

  const filtered=customers.filter(
    customer=>
      `${customer.full_name||''} ${
        customer.email||''
      } ${
        customer.phone||''
      } ${
        customer.customer_code||''
      }`
        .toLowerCase()
        .includes(
          search.toLowerCase()
        )
  );

  return (
    <div className="admin-form-page">

      <AdminIntro
        label="CUSTOMERS"
        title="Customer management"
        description="View loyalty members and update their account information."
      />

      <div className="admin-panel">

        <div className="admin-toolbar">

          <div className="admin-search">
            <Search size={17}/>

            <input
              value={search}
              onChange={e=>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search customers..."
            />
          </div>

          <span className="admin-count">
            {filtered.length} customers
          </span>

        </div>

        <div className="admin-table-wrap">

          <table className="admin-table">

            <thead>
              <tr>
                <th>
                  Customer
                </th>

                <th>
                  Contact
                </th>

                <th>
                  Points
                </th>

                <th>
                  Stamps
                </th>

                <th>
                  Joined
                </th>

                <th>
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>

              {filtered.map(
                customer=>(
                  <tr
                    key={
                      customer.id
                    }
                  >

                    <td>
                      <strong>
                        {
                          customer.full_name ||
                          'Unnamed'
                        }
                      </strong>

                      <small>
                        {
                          customer.customer_code ||
                          customer.id
                        }
                      </small>
                    </td>

                    <td>
                      <small>
                        {
                          customer.email ||
                          '—'
                        }
                      </small>

                      <small>
                        {
                          customer.phone ||
                          '—'
                        }
                      </small>
                    </td>

                    <td>
                      <strong>
                        {Number(
                          customer.points||
                          0
                        ).toFixed(2)}
                      </strong>
                    </td>

                    <td>
                      {
                        customer.stamps||
                        0
                      }
                    </td>

                    <td>
                      {
                        formatDate(
                          customer.created_at
                        )
                      }
                    </td>

                    <td>
                      <button
                        className="admin-icon-button"
                        onClick={()=>
                          setSelected(
                            {
                              ...customer
                            }
                          )
                        }
                      >
                        <Pencil size={16}/>
                      </button>
                    </td>

                  </tr>
                )
              )}

            </tbody>

          </table>

        </div>

      </div>

      {selected&&(
        <div className="modal-overlay">

          <div className="admin-modal">

            <button
              className="modal-close"
              onClick={()=>
                setSelected(
                  null
                )
              }
            >
              <X size={19}/>
            </button>

            <span className="section-label">
              CUSTOMER
            </span>

            <h2>
              Edit customer
            </h2>

            <form
              className="admin-form"
              onSubmit={
                saveCustomer
              }
            >

              <AdminInput
                label="Full name"
                value={
                  selected.full_name||
                  ''
                }
                onChange={v=>
                  setSelected(
                    {
                      ...selected,
                      full_name:v
                    }
                  )
                }
              />

              <AdminInput
                label="Phone"
                value={
                  selected.phone||
                  ''
                }
                onChange={v=>
                  setSelected(
                    {
                      ...selected,
                      phone:v
                    }
                  )
                }
              />

              <AdminInput
                label="Birthday"
                type="date"
                value={
                  selected.birthday||
                  ''
                }
                onChange={v=>
                  setSelected(
                    {
                      ...selected,
                      birthday:v
                    }
                  )
                }
              />

              <div className="admin-form-grid">

                <AdminInput
                  label="Sushi Points"
                  type="number"
                  value={
                    selected.points||
                    0
                  }
                  onChange={v=>
                    setSelected(
                      {
                        ...selected,
                        points:v
                      }
                    )
                  }
                />

                <AdminInput
                  label="Stamps"
                  type="number"
                  value={
                    selected.stamps||
                    0
                  }
                  onChange={v=>
                    setSelected(
                      {
                        ...selected,
                        stamps:v
                      }
                    )
                  }
                />

              </div>

              <div className="field">
                <label>
                  Notes
                </label>

                <textarea
                  value={
                    selected.notes||
                    ''
                  }
                  onChange={e=>
                    setSelected(
                      {
                        ...selected,
                        notes:e.target.value
                      }
                    )
                  }
                />
              </div>

              {msg&&(
                <div className="notice">
                  {msg}
                </div>
              )}

              <AdminSaveButton
                busy={busy}
                text="Save customer"
              />

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

/* =====================================================
   TRANSACTIONS
===================================================== */

function TransactionManagement() {
  const [
    transactions,
    setTransactions
  ]=useState([]);

  const [
    loading,
    setLoading
  ]=useState(true);

  const [
    search,
    setSearch
  ]=useState('');

  useEffect(()=>{
    load();
  },[]);

  async function load(){
    setLoading(true);

    const {
      data,
      error
    }=await supabase
      .from('transactions')
      .select(`
        *,
        customers (
          full_name,
          email,
          customer_code
        )
      `)
      .order('created_at',{
        ascending:false
      })
      .limit(300);

    if(error){
      console.error(
        error
      );
    }else{
      setTransactions(
        data||[]
      );
    }

    setLoading(false);
  }

  const filtered=
    transactions.filter(
      tx=>
        `${tx.transaction_type||''} ${
          tx.customers?.full_name||''
        } ${
          tx.customers?.customer_code||''
        }`
          .toLowerCase()
          .includes(
            search.toLowerCase()
          )
    );

  return (
    <div className="admin-form-page">

      <AdminIntro
        label="ACTIVITY"
        title="Transactions"
        description="Review customer purchases and Sushi Point activity."
      />

      <div className="admin-panel">

        <div className="admin-toolbar">

          <div className="admin-search">
            <Search size={17}/>

            <input
              value={search}
              onChange={e=>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search transactions..."
            />
          </div>

          <button
            className="admin-icon-button"
            onClick={
              load
            }
            title="Refresh"
          >
            <RefreshCw size={16}/>
          </button>

        </div>

        {loading?(
          <AdminLoading/>
        ):(
          <div className="admin-table-wrap">

            <table className="admin-table">

              <thead>
                <tr>
                  <th>
                    Date
                  </th>

                  <th>
                    Customer
                  </th>

                  <th>
                    Type
                  </th>

                  <th>
                    Points
                  </th>
                </tr>
              </thead>

              <tbody>

                {filtered.map(
                  tx=>(
                    <tr
                      key={
                        tx.id
                      }
                    >

                      <td>
                        {
                          formatDateTime(
                            tx.created_at
                          )
                        }
                      </td>

                      <td>
                        <strong>
                          {
                            tx.customers?.full_name ||
                            'Unknown'
                          }
                        </strong>

                        <small>
                          {
                            tx.customers?.customer_code ||
                            ''
                          }
                        </small>
                      </td>

                      <td>
                        <span className="status-pill active">
                          {
                            tx.transaction_type ||
                            'activity'
                          }
                        </span>
                      </td>

                      <td>
                        <strong>
                          {Number(
                            tx.points_earned||
                            0
                          )>0
                            ?'+'
                            :''}
                          {Number(
                            tx.points_earned||
                            0
                          ).toFixed(2)}
                        </strong>
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}

/* =====================================================
   BIRTHDAY
===================================================== */

function BirthdayManagement() {
  const empty={
    id:null,
    name:'',
    reward_text:'',
    active:true
  };

  const [
    rewards,
    setRewards
  ]=useState([]);

  const [
    form,
    setForm
  ]=useState(empty);

  const [
    editing,
    setEditing
  ]=useState(false);

  const [
    busy,
    setBusy
  ]=useState(false);

  const [
    msg,
    setMsg
  ]=useState('');

  useEffect(()=>{
    load();
  },[]);

  async function load(){
    const {
      data,
      error
    }=await supabase
      .from('birthday_rewards')
      .select('*')
      .order('id',{
        ascending:true
      });

    if(error){
      setMsg(error.message);
    }else{
      setRewards(
        data||[]
      );
    }
  }

  function update(key,value){
    setForm(current=>({
      ...current,
      [key]:value
    }));
  }

  async function save(e){
    e.preventDefault();

    setBusy(true);
    setMsg('');

    const payload={
      name:
        form.name.trim(),
      reward_text:
        form.reward_text.trim(),
      active:
        Boolean(form.active)
    };

    let error;

    if(form.id){
      ({
        error
      }=await supabase
        .from('birthday_rewards')
        .update(payload)
        .eq('id',form.id));
    }else{
      ({
        error
      }=await supabase
        .from('birthday_rewards')
        .insert(payload));
    }

    if(error){
      setMsg(error.message);
    }else{
      setEditing(false);
      setForm(empty);
      await load();

      setMsg(
        'Birthday reward saved.'
      );
    }

    setBusy(false);
  }

  async function toggle(item){
    const {
      error
    }=await supabase
      .from('birthday_rewards')
      .update({
        active:!item.active
      })
      .eq('id',item.id);

    if(error){
      setMsg(error.message);
    }else{
      await load();
    }
  }

  async function remove(item){
    if(!window.confirm(
      `Delete "${item.name}"?`
    ))return;

    const {
      error
    }=await supabase
      .from('birthday_rewards')
      .delete()
      .eq('id',item.id);

    if(error){
      setMsg(error.message);
    }else{
      await load();
    }
  }

  return (
    <div className="admin-form-page">

      <AdminIntro
        label="BIRTHDAY"
        title="Birthday rewards"
        description="Create the special reward customers receive on their birthday."
        action={
          <button
            className="primary-button"
            onClick={()=>{
              setForm(empty);
              setEditing(true);
            }}
          >
            <Plus size={17}/>
            Add reward
          </button>
        }
      />

      {editing&&(
        <form
          className="admin-panel admin-form"
          onSubmit={
            save
          }
        >

          <AdminInput
            label="Reward name"
            value={
              form.name
            }
            onChange={v=>
              update(
                'name',
                v
              )
            }
          />

          <AdminInput
            label="Reward text"
            value={
              form.reward_text
            }
            onChange={v=>
              update(
                'reward_text',
                v
              )
            }
            wide
            placeholder="Enjoy a free sushi roll on us!"
          />

          <label className="admin-toggle-row">
            <input
              type="checkbox"
              checked={
                Boolean(
                  form.active
                )
              }
              onChange={e=>
                update(
                  'active',
                  e.target.checked
                )
              }
            />

            <span>
              Active
            </span>
          </label>

          {msg&&(
            <div className="notice">
              {msg}
            </div>
          )}

          <div className="admin-form-actions">

            <button
              type="button"
              className="secondary-button"
              onClick={()=>{
                setEditing(false);
                setForm(empty);
              }}
            >
              Cancel
            </button>

            <AdminSaveButton
              busy={busy}
              text="Save reward"
            />

          </div>

        </form>
      )}

      <div className="admin-panel">

        <div className="admin-list">

          {rewards.map(
            reward=>(
              <div
                className="admin-list-row"
                key={
                  reward.id
                }
              >

                <div className="admin-list-icon">
                  <Cake size={19}/>
                </div>

                <div className="admin-list-main">

                  <strong>
                    {
                      reward.name
                    }
                  </strong>

                  <small>
                    {
                      reward.reward_text
                    }
                  </small>

                </div>

                <button
                  className={`status-pill ${
                    reward.active
                      ?'active'
                      :'inactive'
                  }`}
                  onClick={()=>
                    toggle(
                      reward
                    )
                  }
                >
                  {
                    reward.active
                      ?'Active'
                      :'Inactive'
                  }
                </button>

                <button
                  className="admin-icon-button"
                  onClick={()=>{
                    setForm({
                      ...empty,
                      ...reward
                    });

                    setEditing(
                      true
                    );
                  }}
                >
                  <Pencil size={16}/>
                </button>

                <button
                  className="admin-icon-button danger"
                  onClick={()=>
                    remove(
                      reward
                    )
                  }
                >
                  <Trash2 size={16}/>
                </button>

              </div>
            )
          )}

          {rewards.length===0&&(
            <div className="admin-empty">
              No birthday rewards yet.
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

/* =====================================================
   STAFF / ADMIN SETTINGS
===================================================== */

function StaffSettings() {
  const [
    staff,
    setStaff
  ]=useState([]);

  const [
    search,
    setSearch
  ]=useState('');

  const [
    msg,
    setMsg
  ]=useState('');

  useEffect(()=>{
    load();
  },[]);

  async function load(){
    /*
      This intentionally reads customers/auth-independent
      staff records only if you have an admin_staff table.

      If the table does not exist yet, the page still loads.
    */

    const {
      data,
      error
    }=await supabase
      .from('admin_staff')
      .select('*')
      .order('created_at',{
        ascending:false
      });

    if(error){
      console.info(
        'admin_staff table not available yet:',
        error.message
      );

      setStaff([]);
      return;
    }

    setStaff(
      data||[]
    );
  }

  const filtered=staff.filter(
    item=>
      `${item.full_name||''} ${
        item.email||''
      } ${
        item.role||''
      }`
        .toLowerCase()
        .includes(
          search.toLowerCase()
        )
  );

  return (
    <div className="admin-form-page">

      <AdminIntro
        label="ACCESS"
        title="Admin / staff settings"
        description="Manage the people who can operate your loyalty system."
      />

      <div className="admin-panel">

        <div className="admin-info-box">

          <Shield size={21}/>

          <div>
            <strong>
              Secure access
            </strong>

            <p>
              Staff accounts should be created in Supabase Authentication. The optional <code>admin_staff</code> table can be used later to assign roles such as owner, manager or staff.
            </p>
          </div>

        </div>

        <div className="admin-toolbar">

          <div className="admin-search">
            <Search size={17}/>

            <input
              value={search}
              onChange={e=>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search staff..."
            />

          </div>

        </div>

        {filtered.length>0?(
          <div className="admin-list">

            {filtered.map(
              item=>(
                <div
                  className="admin-list-row"
                  key={
                    item.id
                  }
                >

                  <div className="admin-list-icon">
                    <User size={18}/>
                  </div>

                  <div className="admin-list-main">
                    <strong>
                      {
                        item.full_name
                      }
                    </strong>

                    <small>
                      {
                        item.email
                      }
                    </small>
                  </div>

                  <span className="status-pill active">
                    {
                      item.role||
                      'staff'
                    }
                  </span>

                </div>
              )
            )}

          </div>
        ):(
          <div className="admin-empty">

            <Shield size={25}/>

            <strong>
              Staff management is ready
            </strong>

            <p>
              Create your admin/staff users in Supabase Authentication. Once an <code>admin_staff</code> table exists, it will appear here automatically.
            </p>

          </div>
        )}

        {msg&&(
          <div className="notice">
            {msg}
          </div>
        )}

      </div>

    </div>
  );
}

/* =====================================================
   HOMEPAGE SETTINGS
===================================================== */

function HomepageSettings() {
  const defaults={
    hero_title:'Good sushi. Better rewards.',
    hero_description:'Enjoy your favorites, earn Sushi Points, and make every order count.',
    hero_label:'AT HOME SUSHI',
    featured_title:'Explore Our Menu',
    featured_description:'Find your favorite roll, nigiri, sashimi or platter.',
    rewards_title:'Rewards',
    rewards_description:'A little something for every sushi lover.',
    hero_image_url:'',
    featured_menu_ids:''
  };

  const [
    form,
    setForm
  ]=useState(defaults);

  const [
    menu,
    setMenu
  ]=useState([]);

  const [
    loading,
    setLoading
  ]=useState(true);

  const [
    busy,
    setBusy
  ]=useState(false);

  const [
    msg,
    setMsg
  ]=useState('');

  useEffect(()=>{
    load();
  },[]);

  async function load(){

    const [
      settingsResult,
      menuResult
    ]=await Promise.all([
      supabase
        .from('homepage_settings')
        .select('*')
        .eq('id',1)
        .maybeSingle(),

      supabase
        .from('menu_items')
        .select('id,name,active')
        .order('sort_order',{
          ascending:true
        })
    ]);

    if(
      !settingsResult.error &&
      settingsResult.data
    ){
      setForm({
        ...defaults,
        ...settingsResult.data
      });
    }

    setMenu(
      menuResult.data||
      []
    );

    setLoading(false);
  }

  function update(key,value){
    setForm(current=>({
      ...current,
      [key]:value
    }));
  }

  async function save(e){
    e.preventDefault();

    setBusy(true);
    setMsg('');

    const {
      error
    }=await supabase
      .from('homepage_settings')
      .upsert({
        id:1,
        hero_title:
          form.hero_title,
        hero_description:
          form.hero_description,
        hero_label:
          form.hero_label,
        featured_title:
          form.featured_title,
        featured_description:
          form.featured_description,
        rewards_title:
          form.rewards_title,
        rewards_description:
          form.rewards_description,
        hero_image_url:
          form.hero_image_url,
        featured_menu_ids:
          form.featured_menu_ids
      });

    if(error){
      setMsg(error.message);
    }else{
      setMsg(
        'Homepage content saved.'
      );
    }

    setBusy(false);
  }

  if(loading){
    return <AdminLoading/>;
  }

  const selectedIds=
    String(
      form.featured_menu_ids||
      ''
    )
      .split(',')
      .map(v=>v.trim())
      .filter(Boolean);

  function toggleFeatured(id){
    const exists=
      selectedIds.includes(
        String(id)
      );

    let next;

    if(exists){
      next=
        selectedIds.filter(
          value=>
            value!==
            String(id)
        );
    }else{
      next=[
        ...selectedIds,
        String(id)
      ];
    }

    update(
      'featured_menu_ids',
      next.join(',')
    );
  }

  return (
    <div className="admin-form-page">

      <AdminIntro
        label="HOMEPAGE"
        title="Homepage content"
        description="Change the messaging and featured content customers see when they open the loyalty club."
      />

      <form
        className="admin-panel admin-form"
        onSubmit={save}
      >

        <div className="admin-form-section">

          <h3>
            Hero section
          </h3>

          <div className="admin-form-grid">

            <AdminInput
              label="Hero label"
              value={
                form.hero_label
              }
              onChange={v=>
                update(
                  'hero_label',
                  v
                )
              }
            />

            <AdminInput
              label="Hero title"
              value={
                form.hero_title
              }
              onChange={v=>
                update(
                  'hero_title',
                  v
                )
              }
            />

            <AdminInput
              label="Hero description"
              value={
                form.hero_description
              }
              onChange={v=>
                update(
                  'hero_description',
                  v
                )
              }
              wide
            />

            <AdminInput
              label="Hero image URL"
              value={
                form.hero_image_url
              }
              onChange={v=>
                update(
                  'hero_image_url',
                  v
                )
              }
              wide
              placeholder="https://..."
            />

          </div>

        </div>

        <div className="admin-form-section">

          <h3>
            Menu section
          </h3>

          <div className="admin-form-grid">

            <AdminInput
              label="Section title"
              value={
                form.featured_title
              }
              onChange={v=>
                update(
                  'featured_title',
                  v
                )
              }
            />

            <AdminInput
              label="Section description"
              value={
                form.featured_description
              }
              onChange={v=>
                update(
                  'featured_description',
                  v
                )
              }
            />

          </div>

          <p className="admin-help">
            Choose menu items to feature on the homepage.
          </p>

          <div className="featured-menu-selector">

            {menu.map(
              item=>(
                <button
                  type="button"
                  key={
                    item.id
                  }
                  className={
                    selectedIds.includes(
                      String(
                        item.id
                      )
                    )
                      ?'selected'
                      :''
                  }
                  onClick={()=>
                    toggleFeatured(
                      item.id
                    )
                  }
                >
                  <span>
                    {selectedIds.includes(
                      String(
                        item.id
                      )
                    )
                      ?'✓'
                      :'+'}
                  </span>

                  {
                    item.name
                  }
                </button>
              )
            )}

          </div>

        </div>

        <div className="admin-form-section">

          <h3>
            Rewards section
          </h3>

          <div className="admin-form-grid">

            <AdminInput
              label="Rewards title"
              value={
                form.rewards_title
              }
              onChange={v=>
                update(
                  'rewards_title',
                  v
                )
              }
            />

            <AdminInput
              label="Rewards description"
              value={
                form.rewards_description
              }
              onChange={v=>
                update(
                  'rewards_description',
                  v
                )
              }
            />

          </div>

        </div>

        {msg&&(
          <div className="notice">
            {msg}
          </div>
        )}

        <AdminSaveButton
          busy={busy}
          text="Save homepage"
        />

      </form>

    </div>
  );
}

/* =====================================================
   GENERAL SETTINGS
===================================================== */

function GeneralSettings() {
  const defaults={
    app_name:'At Home Sushi Loyalty Club',
    currency:'PHP',
    timezone:'Asia/Manila',
    maintenance_mode:false,
    customer_registration:true,
    customer_redemption:true,
    show_menu:true,
    show_rewards:true,
    show_history:true
  };

  const [
    form,
    setForm
  ]=useState(defaults);

  const [
    loading,
    setLoading
  ]=useState(true);

  const [
    busy,
    setBusy
  ]=useState(false);

  const [
    msg,
    setMsg
  ]=useState('');

  useEffect(()=>{
    load();
  },[]);

  async function load(){
    const {
      data,
      error
    }=await supabase
      .from('general_settings')
      .select('*')
      .eq('id',1)
      .maybeSingle();

    if(!error&&data){
      setForm({
        ...defaults,
        ...data
      });
    }

    setLoading(false);
  }

  function update(key,value){
    setForm(current=>({
      ...current,
      [key]:value
    }));
  }

  async function save(e){
    e.preventDefault();

    setBusy(true);
    setMsg('');

    const {
      error
    }=await supabase
      .from('general_settings')
      .upsert({
        id:1,
        ...form
      });

    if(error){
      setMsg(error.message);
    }else{
      setMsg(
        'General settings saved.'
      );
    }

    setBusy(false);
  }

  if(loading){
    return <AdminLoading/>;
  }

  return (
    <div className="admin-form-page">

      <AdminIntro
        label="SYSTEM"
        title="General app settings"
        description="Control the basic behavior of the loyalty application."
      />

      <form
        className="admin-panel admin-form"
        onSubmit={save}
      >

        <div className="admin-form-grid">

          <AdminInput
            label="App name"
            value={
              form.app_name
            }
            onChange={v=>
              update(
                'app_name',
                v
              )
            }
          />

          <AdminInput
            label="Currency"
            value={
              form.currency
            }
            onChange={v=>
              update(
                'currency',
                v
              )
            }
          />

          <AdminInput
            label="Timezone"
            value={
              form.timezone
            }
            onChange={v=>
              update(
                'timezone',
                v
              )
            }
          />

        </div>

        <div className="admin-form-section">

          <h3>
            Customer experience
          </h3>

          <AdminToggle
            label="Allow customer registration"
            checked={
              form.customer_registration
            }
            onChange={v=>
              update(
                'customer_registration',
                v
              )
            }
          />

          <AdminToggle
            label="Allow customer redemptions"
            checked={
              form.customer_redemption
            }
            onChange={v=>
              update(
                'customer_redemption',
                v
              )
            }
          />

          <AdminToggle
            label="Show menu"
            checked={
              form.show_menu
            }
            onChange={v=>
              update(
                'show_menu',
                v
              )
            }
          />

          <AdminToggle
            label="Show rewards"
            checked={
              form.show_rewards
            }
            onChange={v=>
              update(
                'show_rewards',
                v
              )
            }
          />

          <AdminToggle
            label="Show transaction history"
            checked={
              form.show_history
            }
            onChange={v=>
              update(
                'show_history',
                v
              )
            }
          />

        </div>

        <div className="admin-form-section">

          <h3>
            Maintenance
          </h3>

          <AdminToggle
            label="Maintenance mode"
            checked={
              form.maintenance_mode
            }
            onChange={v=>
              update(
                'maintenance_mode',
                v
              )
            }
          />

          <p className="admin-help">
            Turn this on only when you want to temporarily disable normal customer access.
          </p>

        </div>

        {msg&&(
          <div className="notice">
            {msg}
          </div>
        )}

        <AdminSaveButton
          busy={busy}
        />

      </form>

    </div>
  );
}

/* =====================================================
   ADMIN COMPONENT HELPERS
===================================================== */

function AdminIntro({
  label,
  title,
  description,
  action
}) {
  return (
    <div className="admin-page-intro">

      <div>
        <span className="section-label">
          {label}
        </span>

        <h2>
          {title}
        </h2>

        <p>
          {description}
        </p>
      </div>

      {action&&(
        <div className="admin-intro-action">
          {action}
        </div>
      )}

    </div>
  );
}

function AdminInput({
  label,
  value,
  onChange,
  type='text',
  placeholder='',
  wide=false,
  help=''
}) {
  return (
    <div
      className={
        `field ${
          wide
            ?'admin-wide'
            :''
        }`
      }
    >

      <label>
        {label}
      </label>

      <input
        type={type}
        value={value??''}
        onChange={e=>
          onChange(
            e.target.value
          )
        }
        placeholder={
          placeholder
        }
      />

      {help&&(
        <small className="admin-field-help">
          {help}
        </small>
      )}

    </div>
  );
}

function AdminToggle({
  label,
  checked,
  onChange
}) {
  return (
    <label className="admin-toggle-row">

      <input
        type="checkbox"
        checked={
          Boolean(checked)
        }
        onChange={e=>
          onChange(
            e.target.checked
          )
        }
      />

      <span>
        {label}
      </span>

    </label>
  );
}

function AdminSaveButton({
  busy,
  text='Save changes'
}) {
  return (
    <button
      className="primary-button"
      type="submit"
      disabled={busy}
    >
      <Save size={17}/>

      {busy
        ?'Saving...'
        :text}
    </button>
  );
}

function AdminLoading() {
  return (
    <div className="admin-loading">
      <div className="loading-mark">
        🍣
      </div>

      <strong>
        Loading...
      </strong>
    </div>
  );
}

/* =====================================================
   ROUTING
===================================================== */

const path =
  window.location.pathname;

const rootElement =
  document.getElementById(
    'root'
  );

if(!rootElement){
  throw new Error(
    'Root element #root was not found.'
  );
}

/*
  /admin
  /staff
  everything else = customer app
*/

function AdminRoute() {
  const [
    session,
    setSession
  ]=useState(null);

  const [
    checking,
    setChecking
  ]=useState(true);

  useEffect(()=>{
    let mounted=true;

    async function check(){
      const {
        data
      }=await supabase.auth.getSession();

      if(!mounted)return;

      setSession(
        data.session
      );

      setChecking(false);
    }

    check();

    const {
      data:{
        subscription
      }
    }=
      supabase.auth.onAuthStateChange(
        (_event,s)=>{
          if(mounted){
            setSession(s);
          }
        }
      );

    return ()=>{
      mounted=false;
      subscription.unsubscribe();
    };
  },[]);

  async function logout(){
    await supabase.auth.signOut();

    setSession(null);
  }

  if(checking){
    return (
      <LoadingScreen
        text="Checking admin access"
      />
    );
  }

  if(!session){
    return (
      <AdminLogin
        onLogin={
          setSession
        }
      />
    );
  }

  return (
    <AdminApp
      session={session}
      onLogout={logout}
    />
  );
}

createRoot(
  rootElement
).render(
  path === '/staff'
    ? <Staff/>
    : path === '/admin'
    ? <AdminRoute/>
    : <App/>
);
