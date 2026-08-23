import React, { useEffect, useState } from 'react';
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
  Store,
  Utensils,
  Award,
  Users,
  BarChart3,
  Image as ImageIcon,
  Home as HomeIcon,
  SlidersHorizontal,
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ArrowLeft,
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
   PASSWORD FIELD
===================================================== */

function PasswordField({
  value,
  onChange,
  placeholder
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
          placeholder={placeholder || 'Your password'}
          required
          minLength={8}
        />

        <button
          type="button"
          className="password-toggle"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
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
      const { data, error } =
        await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        console.error('Session error:', error);
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
    } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        if (!mounted) return;

        setSession(currentSession);

        if (currentSession) {
          await loadProfile(currentSession.user);
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

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Customer profile error:', error);
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
    return <LoadingScreen text="Loading your loyalty club" />;
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
   LOADING
===================================================== */

function LoadingScreen({ text }) {
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
    const saved =
      localStorage.getItem('savedLoginEmail');

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

      const { error } =
        await supabase.auth.signInWithPassword({
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

    const { data, error } =
      await supabase.auth.signUp({
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
      console.error('Signup error:', error);
      setMsg(error.message);
      setBusy(false);
      return;
    }

    if (data?.session && data?.user) {
      const user = data.user;

      const { error: profileError } =
        await supabase
          .from('customers')
          .insert({
            id: user.id,
            full_name: name.trim(),
            phone: phone.trim() || null,
            email:
              user.email || email.trim(),
            birthday: birthday || null,
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

          <h1>AT HOME SUSHI</h1>
          <span>LOYALTY CLUB</span>
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

          <form onSubmit={submit}>

            {mode === 'signup' && (
              <>
                <div className="field">
                  <label>Full name</label>

                  <input
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    placeholder="Your name"
                    required
                  />
                </div>

                <div className="field">
                  <label>Phone number</label>

                  <input
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value)
                    }
                    placeholder="09xxxxxxxxx"
                  />
                </div>

                <div className="field">
                  <label>Birthday</label>

                  <input
                    type="date"
                    value={birthday}
                    onChange={(e) =>
                      setBirthday(e.target.value)
                    }
                  />
                </div>
              </>
            )}

            <div className="field">
              <label>Email</label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="you@email.com"
                required
              />
            </div>

            <PasswordField
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Your password"
            />

            {mode === 'login' && (
              <label className="remember-row">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) =>
                    setRemember(
                      e.target.checked
                    )
                  }
                />

                <span>Remember me</span>
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

          {mode === 'login' && (
            <div className="auth-switch">
              New here?

              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setMsg('');
                }}
              >
                Join the club
              </button>
            </div>
          )}

          {mode === 'signup' && (
            <div className="auth-switch">
              Already a member?

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setMsg('');
                }}
              >
                Log in
              </button>
            </div>
          )}

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

  const [rewards, setRewards] =
    useState([]);

  const [transactions, setTransactions] =
    useState([]);

  const [birthdayReward, setBirthdayReward] =
    useState(null);

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
      data: rewardsData
    } = await supabase
      .from('rewards')
      .select('*')
      .eq('active', true)
      .order('points_required');

    setRewards(rewardsData || []);

    const {
      data: txData
    } = await supabase
      .from('transactions')
      .select('*')
      .eq(
        'customer_id',
        session.user.id
      )
      .order('created_at', {
        ascending: false
      })
      .limit(30);

    setTransactions(txData || []);
  }

  async function checkBirthdayReward() {
    if (!profile?.birthday) return;

    const today = new Date();
    const birthday = new Date(
      profile.birthday
    );

    const birthdayToday =
      today.getMonth() ===
        birthday.getMonth() &&
      today.getDate() ===
        birthday.getDate();

    if (!birthdayToday) return;

    const year =
      today.getFullYear();

    const { data: claimed } =
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

    const { data: reward } =
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
      setBirthdayReward(reward);
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
                {birthdayReward.reward_text}
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
          <Settings
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
          <History size={20} />
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

  const [activeCategory, setActiveCategory] =
    useState('all');

  const [orderOpen, setOrderOpen] =
    useState(false);

  const [selectedMenuItem, setSelectedMenuItem] =
    useState(null);

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
    { id: 'all', label: 'All' },
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
            Enjoy your favorites,
            earn Sushi Points,
            and make every order
            count.
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
              <ChevronRight
                size={17}
              />
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
          Every order brings you
          closer to something
          delicious.
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
            <ChevronRight
              size={20}
            />
          </button>

        </div>

        <div className="earn-steps">

          <div>
            <b>01</b>

            <span>
              <strong>
                ORDER
              </strong>

              Enjoy your favorite
              sushi.
            </span>
          </div>

          <div>
            <b>02</b>

            <span>
              <strong>
                EARN
              </strong>

              ₱100 spent = 1
              Sushi Point.
            </span>
          </div>

          <div>
            <b>03</b>

            <span>
              <strong>
                REDEEM
              </strong>

              Turn points into
              rewards.
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
          Find your favorite roll,
          nigiri, sashimi or platter.
        </p>

        <div className="menu-categories">

          {categories.map(
            (category) => (
              <button
                key={category.id}
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
                {category.label}
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
          filteredMenu.length === 0 && (
            <div className="empty-card large">
              <div className="loading-mark">
                🍣
              </div>

              <strong>
                No menu items available.
              </strong>

              <p>
                Check back soon for
                our latest menu.
              </p>
            </div>
          )}

        {!menuLoading &&
          filteredMenu.length > 0 && (
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
                          onError={(e) => {
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
                            AT HOME
                            SUSHI
                          </small>
                        </div>
                      )}

                    </div>

                    <div className="menu-item-content">

                      <div className="menu-item-top">

                        <h3>
                          {item.name}
                        </h3>

                        {item.price !==
                          null &&
                          item.price !==
                            undefined && (
                            <strong>
                              ₱
                              {Number(
                                item.price
                              ).toFixed(
                                0
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
          A little something for
          every sushi lover.
        </p>

        <div className="home-rewards">

          {rewards
            .slice(0, 3)
            .map(
              (reward, i) => (
                <div
                  className="home-reward"
                  key={reward.id}
                >

                  <span>
                    0{i + 1}
                  </span>

                  <div>
                    <strong>
                      {reward.name}
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

          {rewards.length === 0 && (
            <div className="empty-card">
              Rewards will appear
              here once available.
            </div>
          )}

        </div>

        <button
          className="primary-button"
          onClick={onGoRewards}
        >
          View all rewards
          <ChevronRight
            size={17}
          />
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
                How would you
                like to order?
              </h2>

              <p>
                Choose your preferred
                way to order.
              </p>

              <a
                className="order-choice"
                href="https://www.ordermo.ph/restaurants/at-home-sushi/M8y6MG8S?n=QXQgSG9tZSBTdXNoaQ==&p=cG5n&c=anBn"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="choice-icon">
                  <ShoppingBag
                    size={19}
                  />
                </span>

                <span>
                  <strong>
                    Order Online
                  </strong>

                  <small>
                    OrderMo
                  </small>
                </span>

                <ChevronRight
                  size={18}
                />
              </a>

              <a
                className="order-choice"
                href="https://www.facebook.com/athomesushibustos"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="choice-icon">
                  <MessageCircle
                    size={19}
                  />
                </span>

                <span>
                  <strong>
                    Order via Facebook
                  </strong>

                  <small>
                    Message At Home
                    Sushi
                  </small>
                </span>

                <ChevronRight
                  size={18}
                />
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
            {profile.full_name}
          </strong>

          <small>
            {profile.customer_code}
          </small>

        </div>

        <div className="digital-balances">

          <div>
            <span>
              POINTS
            </span>

            <strong>
              {Number(
                profile.points || 0
              ).toFixed(0)}
            </strong>
          </div>

          <div>
            <span>
              STAMPS
            </span>

            <strong>
              {profile.stamps || 0}
            </strong>
          </div>

        </div>

        <p className="digital-note">
          Show this QR code to
          staff at checkout.
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
  const [selected, setSelected] =
    useState(null);

  const [code, setCode] =
    useState('');

  const [busy, setBusy] =
    useState(false);

  const [msg, setMsg] =
    useState('');

  const points =
    Number(profile.points || 0);

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
        .substring(2, 7)
        .toUpperCase();

    const {
      data,
      error
    } = await supabase
      .from('point_redemptions')
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
      console.error(error);
      setMsg(error.message);
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

      setMsg('Code copied!');
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

          <CheckCircle size={46} />

          <span className="section-label">
            REDEMPTION CODE
          </span>

          <h1>
            Show this to staff
          </h1>

          <p>
            Staff will confirm your
            redemption before your
            points are deducted.
          </p>

          <div className="redemption-code">
            {code}
          </div>

          <button
            className="primary-button"
            onClick={copyCode}
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

        {rewards.map((reward) => {

          const required =
            Number(
              reward.points_required
            );

          const available =
            points >= required;

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
              disabled={!available}
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
                  {reward.name}
                </strong>

                <small>
                  {reward.description ||
                    'Use your Sushi Points for this reward.'}
                </small>

                <b>
                  {required} points
                </b>

              </span>

              <ChevronRight
                size={18}
              />

            </button>
          );
        })}

        {rewards.length === 0 && (
          <div className="empty-card large">
            <Gift size={25} />

            <strong>
              No rewards available yet
            </strong>

            <p>
              Check back soon for
              rewards.
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
            {selected.name}?
          </h2>

          <p>
            This will create a
            redemption code for{' '}
            <strong>
              {
                selected.points_required
              }{' '}
              points.
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

      {transactions.length === 0 ? (
        <div className="empty-card large">

          <History size={25} />

          <strong>
            No transactions yet
          </strong>

          <p>
            Your activity will
            appear here.
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
                    {new Date(
                      tx.created_at
                    ).toLocaleString()}
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

function Settings({
  session,
  profile,
  reloadProfile,
  onLogout
}) {
  const [name, setName] =
    useState(
      profile.full_name || ''
    );

  const [phone, setPhone] =
    useState(
      profile.phone || ''
    );

  const [birthday, setBirthday] =
    useState(
      profile.birthday || ''
    );

  const [newPassword, setNewPassword] =
    useState('');

  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [profileBusy, setProfileBusy] =
    useState(false);

  const [passwordBusy, setPasswordBusy] =
    useState(false);

  const [profileMessage, setProfileMessage] =
    useState('');

  const [passwordMessage, setPasswordMessage] =
    useState('');

  useEffect(() => {
    setName(
      profile.full_name || ''
    );

    setPhone(
      profile.phone || ''
    );

    setBirthday(
      profile.birthday || ''
    );
  }, [profile]);

  async function saveProfile(e) {
    e.preventDefault();

    if (!name.trim()) {
      setProfileMessage(
        'Please enter your full name.'
      );
      return;
    }

    setProfileBusy(true);
    setProfileMessage('');

    const updates = {
      full_name: name.trim(),
      phone:
        phone.trim() || null,
      birthday:
        birthday || null
    };

    const { error } =
      await supabase
        .from('customers')
        .update(updates)
        .eq(
          'id',
          session.user.id
        );

    if (error) {
      setProfileMessage(
        error.message
      );

      setProfileBusy(false);
      return;
    }

    await supabase.auth.updateUser({
      data: updates
    });

    await reloadProfile();

    setProfileMessage(
      'Your profile has been updated.'
    );

    setProfileBusy(false);
  }

  async function changePassword(e) {
    e.preventDefault();

    if (newPassword.length < 8) {
      setPasswordMessage(
        'Your new password must be at least 8 characters.'
      );
      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      setPasswordMessage(
        'Your new passwords do not match.'
      );
      return;
    }

    setPasswordBusy(true);
    setPasswordMessage('');

    const { error } =
      await supabase.auth.updateUser({
        password:
          newPassword
      });

    if (error) {
      setPasswordMessage(
        error.message
      );
    } else {
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
          Manage your loyalty
          club account.
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
              Keep your details up
              to date.
            </p>
          </div>

        </div>

        <form onSubmit={saveProfile}>

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

          {profileMessage && (
            <div className="notice">
              {profileMessage}
            </div>
          )}

          <button
            className="primary-button"
            type="submit"
            disabled={profileBusy}
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
              Use at least 8
              characters.
            </p>
          </div>

        </div>

        <form onSubmit={changePassword}>

          <div className="field">

            <label>
              New password
            </label>

            <input
              type="password"
              value={newPassword}
              onChange={(e) =>
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
              onChange={(e) =>
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
            disabled={passwordBusy}
          >
            {passwordBusy
              ? 'Updating...'
              : 'Update password'}
          </button>

        </form>

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
  const [staffSession, setStaffSession] =
    useState(null);

  const [checking, setChecking] =
    useState(true);

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [remember, setRemember] =
    useState(
      localStorage.getItem(
        'staffRemember'
      ) === 'true'
    );

  const [customerCode, setCustomerCode] =
    useState('');

  const [customer, setCustomer] =
    useState(null);

  const [amount, setAmount] =
    useState('');

  const [notes, setNotes] =
    useState('');

  const [msg, setMsg] =
    useState('');

  const [busy, setBusy] =
    useState(false);

  useEffect(() => {
    checkStaffSession();
  }, []);

  async function checkStaffSession() {
    const { data } =
      await supabase.auth.getSession();

    if (data.session) {
      const { data: staff } =
        await supabase
          .from('staff_users')
          .select('*')
          .eq(
            'id',
            data.session.user.id
          )
          .eq('active', true)
          .maybeSingle();

      if (staff) {
        setStaffSession(
          data.session
        );
      } else {
        setStaffSession(null);
      }
    }

    setChecking(false);
  }

  async function staffLogin(e) {
    e.preventDefault();

    setBusy(true);
    setMsg('');

    const {
      data,
      error
    } =
      await supabase.auth.signInWithPassword({
        email:
          email.trim(),
        password
      });

    if (error) {
      setMsg(
        error.message
      );

      setBusy(false);
      return;
    }

    const { data: staff } =
      await supabase
        .from('staff_users')
        .select('*')
        .eq(
          'id',
          data.user.id
        )
        .eq(
          'active',
          true
        )
        .maybeSingle();

    if (!staff) {
      await supabase.auth.signOut();

      setMsg(
        'This account does not have staff access.'
      );

      setBusy(false);
      return;
    }

    if (remember) {
      localStorage.setItem(
        'staffRemember',
        'true'
      );
    } else {
      localStorage.removeItem(
        'staffRemember'
      );
    }

    setStaffSession(
      data.session
    );

    setBusy(false);
  }

  async function staffLogout() {
    await supabase.auth.signOut();
    setStaffSession(null);
  }

  async function findCustomer() {
    const code =
      customerCode.trim();

    setMsg('');
    setCustomer(null);

    if (!code) {
      setMsg(
        'Please enter the customer QR code.'
      );
      return;
    }

    setBusy(true);

    const {
      data,
      error
    } = await supabase
      .from('customers')
      .select('*')
      .eq(
        'customer_code',
        code
      )
      .maybeSingle();

    setBusy(false);

    if (error) {
      setMsg(
        error.message
      );
      return;
    }

    if (!data) {
      setMsg(
        'Customer not found.'
      );
      return;
    }

    setCustomer(data);
    setNotes(
      data.notes || ''
    );

    setMsg(
      `Customer found: ${data.full_name}`
    );
  }

  async function addPoints() {
    if (!customer) {
      setMsg(
        'Find a customer first.'
      );
      return;
    }

    const purchase =
      parseFloat(amount);

    if (
      !Number.isFinite(
        purchase
      ) ||
      purchase <= 0
    ) {
      setMsg(
        'Enter a valid purchase amount.'
      );
      return;
    }

    const points =
      purchase / 100;

    const newPoints =
      Number(
        customer.points || 0
      ) + points;

    setBusy(true);
    setMsg('');

    const {
      error: updateError
    } = await supabase
      .from('customers')
      .update({
        points: newPoints
      })
      .eq(
        'id',
        customer.id
      );

    if (updateError) {
      setMsg(
        updateError.message
      );
      setBusy(false);
      return;
    }

    const {
      error: transactionError
    } = await supabase
      .from('transactions')
      .insert({
        customer_id:
          customer.id,
        transaction_type:
          'purchase',
        points_earned:
          points
      });

    if (transactionError) {
      setMsg(
        transactionError.message
      );
      setBusy(false);
      return;
    }

    setCustomer({
      ...customer,
      points:
        newPoints
    });

    setAmount('');

    setMsg(
      `Success! ${points.toFixed(
        2
      )} Sushi Points added.`
    );

    setBusy(false);
  }

  async function saveNotes() {
    if (!customer) {
      setMsg(
        'Find a customer first.'
      );
      return;
    }

    setBusy(true);
    setMsg('');

    const { error } =
      await supabase
        .from('customers')
        .update({
          notes
        })
        .eq(
          'id',
          customer.id
        );

    if (error) {
      setMsg(
        error.message
      );
    } else {
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

  async function claimBirthdayReward() {
    if (!customer) {
      setMsg(
        'Find a customer first.'
      );
      return;
    }

    if (!customer.birthday) {
      setMsg(
        'This customer has no birthday saved.'
      );
      return;
    }

    const today =
      new Date();

    const birthday =
      new Date(
        customer.birthday
      );

    const isBirthday =
      today.getMonth() ===
        birthday.getMonth() &&
      today.getDate() ===
        birthday.getDate();

    if (!isBirthday) {
      setMsg(
        'Today is not this customer’s birthday.'
      );
      return;
    }

    const year =
      today.getFullYear();

    setBusy(true);
    setMsg('');

    const {
      data: claimed,
      error: checkError
    } = await supabase
      .from('birthday_claims')
      .select('id')
      .eq(
        'customer_id',
        customer.id
      )
      .eq(
        'birthday_year',
        year
      )
      .maybeSingle();

    if (checkError) {
      setMsg(
        checkError.message
      );
      setBusy(false);
      return;
    }

    if (claimed) {
      setMsg(
        'Birthday reward already claimed this year.'
      );
      setBusy(false);
      return;
    }

    const {
      data: reward,
      error: rewardError
    } = await supabase
      .from(
        'birthday_rewards'
      )
      .select('*')
      .eq(
        'active',
        true
      )
      .order('id', {
        ascending: true
      })
      .limit(1)
      .maybeSingle();

    if (rewardError) {
      setMsg(
        rewardError.message
      );
      setBusy(false);
      return;
    }

    if (!reward) {
      setMsg(
        'No active birthday reward found.'
      );
      setBusy(false);
      return;
    }

    const {
      error: claimError
    } = await supabase
      .from(
        'birthday_claims'
      )
      .insert({
        customer_id:
          customer.id,
        birthday_year:
          year
      });

    if (claimError) {
      setMsg(
        claimError.message
      );
      setBusy(false);
      return;
    }

    setMsg(
      `Birthday reward claimed: ${reward.reward_text}`
    );

    setBusy(false);
  }

  if (checking) {
    return (
      <LoadingScreen
        text="Checking staff access"
      />
    );
  }

  if (!staffSession) {
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
                Manage customer
                points and rewards.
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
                  onChange={(e) =>
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
                onChange={(e) =>
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
                <LogIn size={17} />

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
          onClick={staffLogout}
        >
          <LogOut size={18} />
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
            Scan or enter a customer's
            loyalty code.
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
              value={customerCode}
              onChange={(e) =>
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
            <ScanLine size={18} />

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
              {customer.full_name}
            </h2>

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

                <span>
                  POINTS
                </span>

                <strong>
                  {Number(
                    customer.points ||
                      0
                  ).toFixed(2)}
                </strong>

              </div>

              <div>

                <Ticket size={18} />

                <span>
                  STAMPS
                </span>

                <strong>
                  {customer.stamps ||
                    0}
                </strong>

              </div>

            </div>

            {customer.birthday && (
              <p className="staff-muted birthday-line">

                <Cake size={15} />

                Birthday:{' '}

                {new Date(
                  customer.birthday
                ).toLocaleDateString()}

              </p>
            )}

            <div className="staff-divider" />

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
                onChange={(e) =>
                  setAmount(
                    e.target.value
                  )
                }
                placeholder="₱0.00"
              />

            </div>

            {amount &&
              Number(amount) >
                0 && (
                <p className="points-preview">
                  Points to add:{' '}
                  <strong>
                    {(
                      Number(
                        amount
                      ) / 100
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
              <PlusCircle size={18} />

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
              <Cake size={17} />
              Claim Birthday Reward
            </button>

            <div className="staff-divider" />

            <div className="section-label">
              CUSTOMER NOTES
            </div>

            <div className="field">

              <label>
                <FileText size={14} />
                Notes
              </label>

              <textarea
                value={notes}
                onChange={(e) =>
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
  onLoggedIn
}) {
  const [email, setEmail] =
    useState(
      localStorage.getItem(
        'adminLoginEmail'
      ) || ''
    );

  const [password, setPassword] =
    useState('');

  const [remember, setRemember] =
    useState(
      localStorage.getItem(
        'adminRemember'
      ) === 'true'
    );

  const [busy, setBusy] =
    useState(false);

  const [msg, setMsg] =
    useState('');

  async function login(e) {
    e.preventDefault();

    setBusy(true);
    setMsg('');

    const {
      data,
      error
    } =
      await supabase.auth.signInWithPassword({
        email:
          email.trim(),
        password
      });

    if (error) {
      setMsg(
        error.message
      );
      setBusy(false);
      return;
    }

    const {
      data: staff,
      error: staffError
    } = await supabase
      .from('staff_users')
      .select('*')
      .eq(
        'id',
        data.user.id
      )
      .eq(
        'role',
        'admin'
      )
      .eq(
        'active',
        true
      )
      .maybeSingle();

    if (staffError) {
      await supabase.auth.signOut();

      setMsg(
        staffError.message
      );

      setBusy(false);
      return;
    }

    if (!staff) {
      await supabase.auth.signOut();

      setMsg(
        'This account does not have Admin access.'
      );

      setBusy(false);
      return;
    }

    if (remember) {
      localStorage.setItem(
        'adminRemember',
        'true'
      );

      localStorage.setItem(
        'adminLoginEmail',
        email.trim()
      );
    } else {
      localStorage.removeItem(
        'adminRemember'
      );

      localStorage.removeItem(
        'adminLoginEmail'
      );
    }

    setPassword('');
    onLoggedIn(
      data.session,
      staff
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
            ADMIN PORTAL
          </span>

        </div>

        <div className="auth-card">

          <div className="auth-heading">

            <h2>
              Admin Login
            </h2>

            <p>
              Manage your At Home
              Sushi loyalty club.
            </p>

          </div>

          <form
            onSubmit={login}
          >

            <div className="field">

              <label>
                Admin email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
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
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              placeholder="Admin password"
            />

            <label className="remember-row">

              <input
                type="checkbox"
                checked={remember}
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
              <Lock size={17} />

              {busy
                ? 'Checking access...'
                : 'Enter Admin'}
            </button>

          </form>

          <div className="auth-footer">
            Authorized staff only.
          </div>

        </div>

      </div>

    </div>
  );
}

/* =====================================================
   ADMIN
===================================================== */

function Admin() {
  const [session, setSession] =
    useState(null);

  const [admin, setAdmin] =
    useState(null);

  const [checking, setChecking] =
    useState(true);

  useEffect(() => {
    checkAdmin();

    const {
      data: {
        subscription
      }
    } =
      supabase.auth.onAuthStateChange(
        async (_event, currentSession) => {
          if (!currentSession) {
            setSession(null);
            setAdmin(null);
            return;
          }

          await verifyAdmin(
            currentSession
          );
        }
      );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function verifyAdmin(
    currentSession
  ) {
    const {
      data,
      error
    } = await supabase
      .from('staff_users')
      .select('*')
      .eq(
        'id',
        currentSession.user.id
      )
      .eq(
        'role',
        'admin'
      )
      .eq(
        'active',
        true
      )
      .maybeSingle();

    if (
      error ||
      !data
    ) {
      setSession(null);
      setAdmin(null);
      setChecking(false);
      return;
    }

    setSession(
      currentSession
    );

    setAdmin(data);
    setChecking(false);
  }

  async function checkAdmin() {
    setChecking(true);

    const {
      data
    } =
      await supabase.auth.getSession();

    if (!data.session) {
      setSession(null);
      setAdmin(null);
      setChecking(false);
      return;
    }

    await verifyAdmin(
      data.session
    );
  }

  async function logout() {
    await supabase.auth.signOut();
    setSession(null);
    setAdmin(null);
  }

  if (checking) {
    return (
      <LoadingScreen
        text="Checking admin access"
      />
    );
  }

  if (!session || !admin) {
    return (
      <AdminLogin
        onLoggedIn={(
          newSession,
          newAdmin
        ) => {
          setSession(
            newSession
          );
          setAdmin(
            newAdmin
          );
        }}
      />
    );
  }

  return (
    <AdminDashboard
      session={session}
      admin={admin}
      onLogout={logout}
    />
  );
}

/* =====================================================
   ADMIN DASHBOARD
===================================================== */

function AdminDashboard({
  session,
  admin,
  onLogout
}) {
  const [section, setSection] =
    useState('dashboard');

  const [mobileMenu, setMobileMenu] =
    useState(false);

  const menu = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3
    },
    {
      id: 'business',
      label: 'Business',
      icon: Store
    },
    {
      id: 'menu',
      label: 'Menu Management',
      icon: Utensils
    },
    {
      id: 'rewards',
      label: 'Rewards',
      icon: Gift
    },
    {
      id: 'loyalty',
      label: 'Loyalty Settings',
      icon: Star
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: Users
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: History
    },
    {
      id: 'birthday',
      label: 'Birthday Rewards',
      icon: Cake
    },
    {
      id: 'staff',
      label: 'Staff & Admin',
      icon: Shield
    },
    {
      id: 'homepage',
      label: 'Homepage',
      icon: HomeIcon
    },
    {
      id: 'images',
      label: 'Images',
      icon: ImageIcon
    },
    {
      id: 'general',
      label: 'General Settings',
      icon: SlidersHorizontal
    }
  ];

  const current =
    menu.find(
      (item) =>
        item.id === section
    ) || menu[0];

  function selectSection(id) {
    setSection(id);
    setMobileMenu(false);
  }

  return (
    <div className="admin-shell">

      <aside
        className={`admin-sidebar ${
          mobileMenu
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

          {menu.map(
            (item) => {
              const Icon =
                item.icon;

              return (
                <button
                  key={item.id}
                  className={
                    section ===
                    item.id
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    selectSection(
                      item.id
                    )
                  }
                >
                  <Icon
                    size={18}
                  />

                  <span>
                    {item.label}
                  </span>
                </button>
              );
            }
          )}

        </nav>

        <div className="admin-sidebar-bottom">

          <div className="admin-user">

            <div className="admin-user-icon">
              <User
                size={17}
              />
            </div>

            <div>
              <strong>
                {admin.full_name ||
                  'Admin'}
              </strong>

              <span>
                {admin.email ||
                  session.user.email}
              </span>
            </div>

          </div>

          <button
            className="admin-logout"
            onClick={onLogout}
          >
            <LogOut
              size={17}
            />
            Log out
          </button>

        </div>

      </aside>

      {mobileMenu && (
        <div
          className="admin-sidebar-overlay"
          onClick={() =>
            setMobileMenu(false)
          }
        />
      )}

      <div className="admin-content">

        <header className="admin-header">

          <button
            className="admin-mobile-button"
            onClick={() =>
              setMobileMenu(
                (v) => !v
              )
            }
          >
            <SettingsIcon
              size={20}
            />
          </button>

          <div>

            <span className="admin-breadcrumb">
              ADMIN /{' '}
              {current.label.toUpperCase()}
            </span>

            <h1>
              {current.label}
            </h1>

          </div>

          <div className="admin-header-user">

            <span>
              Admin
            </span>

            <div>
              <User
                size={17}
              />
            </div>

          </div>

        </header>

        <main className="admin-main">

          {section ===
            'dashboard' && (
            <AdminOverview
              setSection={
                setSection
              }
            />
          )}

          {section ===
            'business' && (
            <AdminBusiness />
          )}

          {section ===
            'menu' && (
            <AdminMenu />
          )}

          {section ===
            'rewards' && (
            <AdminRewards />
          )}

          {section ===
            'loyalty' && (
            <AdminLoyalty />
          )}

          {section ===
            'customers' && (
            <AdminCustomers />
          )}

          {section ===
            'transactions' && (
            <AdminTransactions />
          )}

          {section ===
            'birthday' && (
            <AdminBirthday />
          )}

          {section ===
            'staff' && (
            <AdminStaff />
          )}

          {section ===
            'homepage' && (
            <AdminHomepage />
          )}

          {section ===
            'images' && (
            <AdminImages />
          )}

          {section ===
            'general' && (
            <AdminGeneral />
          )}

        </main>

      </div>

    </div>
  );
}

/* =====================================================
   ADMIN OVERVIEW
===================================================== */

function AdminOverview({
  setSection
}) {
  const [stats, setStats] =
    useState({
      customers: 0,
      menu: 0,
      rewards: 0,
      transactions: 0
    });

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);

    const [
      customers,
      menu,
      rewards,
      transactions
    ] = await Promise.all([
      supabase
        .from('customers')
        .select(
          'id',
          {
            count:
              'exact',
            head: true
          }
        ),

      supabase
        .from('menu_items')
        .select(
          'id',
          {
            count:
              'exact',
            head: true
          }
        ),

      supabase
        .from('rewards')
        .select(
          'id',
          {
            count:
              'exact',
            head: true
          }
        ),

      supabase
        .from('transactions')
        .select(
          'id',
          {
            count:
              'exact',
            head: true
          }
        )
    ]);

    setStats({
      customers:
        customers.count ||
        0,

      menu:
        menu.count ||
        0,

      rewards:
        rewards.count ||
        0,

      transactions:
        transactions.count ||
        0
    });

    setLoading(false);
  }

  const cards = [
    {
      id: 'customers',
      label: 'Customers',
      value:
        stats.customers,
      icon: Users
    },
    {
      id: 'menu',
      label: 'Menu Items',
      value:
        stats.menu,
      icon: Utensils
    },
    {
      id: 'rewards',
      label: 'Rewards',
      value:
        stats.rewards,
      icon: Gift
    },
    {
      id: 'transactions',
      label: 'Transactions',
      value:
        stats.transactions,
      icon: History
    }
  ];

  return (
    <div className="admin-page">

      <div className="admin-page-heading">

        <span>
          OVERVIEW
        </span>

        <h2>
          Welcome to your Admin
          Dashboard
        </h2>

        <p>
          Manage At Home Sushi
          from one place.
        </p>

      </div>

      <div className="admin-stat-grid">

        {cards.map(
          (card) => {
            const Icon =
              card.icon;

            return (
              <button
                key={card.id}
                className="admin-stat-card"
                onClick={() =>
                  setSection(
                    card.id
                  )
                }
              >

                <div className="admin-stat-icon">
                  <Icon
                    size={20}
                  />
                </div>

                <span>
                  {card.label}
                </span>

                <strong>
                  {loading
                    ? '—'
                    : card.value}
                </strong>

              </button>
            );
          }
        )}

      </div>

      <div className="admin-section-grid">

        <button
          className="admin-action-card"
          onClick={() =>
            setSection('menu')
          }
        >
          <Utensils
            size={22}
          />

          <div>
            <strong>
              Manage Menu
            </strong>

            <span>
              Add, edit and
              manage sushi items.
            </span>
          </div>

          <ChevronRight
            size={18}
          />
        </button>

        <button
          className="admin-action-card"
          onClick={() =>
            setSection('rewards')
          }
        >
          <Gift size={22} />

          <div>
            <strong>
              Manage Rewards
            </strong>

            <span>
              Create and update
              customer rewards.
            </span>
          </div>

          <ChevronRight
            size={18}
          />
        </button>

        <button
          className="admin-action-card"
          onClick={() =>
            setSection('homepage')
          }
        >
          <HomeIcon
            size={22}
          />

          <div>
            <strong>
              Edit Homepage
            </strong>

            <span>
              Change your
              homepage content.
            </span>
          </div>

          <ChevronRight
            size={18}
          />
        </button>

        <button
          className="admin-action-card"
          onClick={() =>
            setSection('business')
          }
        >
          <Store size={22} />

          <div>
            <strong>
              Business Information
            </strong>

            <span>
              Update contact
              details and hours.
            </span>
          </div>

          <ChevronRight
            size={18}
          />
        </button>

      </div>

    </div>
  );
}

/* =====================================================
   ADMIN BUSINESS
===================================================== */

function AdminBusiness() {
  const [form, setForm] =
    useState({
      business_name:
        'At Home Sushi',
      location:
        'Bustos, Bulacan',
      contact_number:
        '',
      facebook_url:
        '',
      instagram_url:
        '',
      opening_hours:
        ''
    });

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const {
      data,
      error
    } = await supabase
      .from(
        'business_settings'
      )
      .select('*')
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setForm({
        business_name:
          data.business_name ||
          '',
        location:
          data.location ||
          '',
        contact_number:
          data.contact_number ||
          '',
        facebook_url:
          data.facebook_url ||
          '',
        instagram_url:
          data.instagram_url ||
          '',
        opening_hours:
          data.opening_hours ||
          ''
      });
    }

    setLoading(false);
  }

  function update(field, value) {
    setForm((old) => ({
      ...old,
      [field]: value
    }));
  }

  async function save(e) {
    e.preventDefault();

    setSaving(true);
    setMessage('');

    const {
      data: existing
    } = await supabase
      .from(
        'business_settings'
      )
      .select('id')
      .limit(1)
      .maybeSingle();

    let error;

    if (existing) {
      ({
        error
      } = await supabase
        .from(
          'business_settings'
        )
        .update(form)
        .eq(
          'id',
          existing.id
        ));
    } else {
      ({
        error
      } = await supabase
        .from(
          'business_settings'
        )
        .insert(form));
    }

    setMessage(
      error
        ? error.message
        : 'Business information saved.'
    );

    setSaving(false);
  }

  if (loading) {
    return (
      <AdminLoading />
    );
  }

  return (
    <div className="admin-page">

      <AdminPageIntro
        eyebrow="BUSINESS"
        title="Business Information"
        description="Keep your restaurant information up to date."
      />

      <form
        className="admin-form-card"
        onSubmit={save}
      >

        <div className="admin-form-grid">

          <AdminInput
            label="Business name"
            value={
              form.business_name
            }
            onChange={(v) =>
              update(
                'business_name',
                v
              )
            }
          />

          <AdminInput
            label="Location"
            value={
              form.location
            }
            onChange={(v) =>
              update(
                'location',
                v
              )
            }
          />

          <AdminInput
            label="Contact number"
            value={
              form.contact_number
            }
            onChange={(v) =>
              update(
                'contact_number',
                v
              )
            }
          />

          <AdminInput
            label="Facebook"
            value={
              form.facebook_url
            }
            onChange={(v) =>
              update(
                'facebook_url',
                v
              )
            }
          />

          <AdminInput
            label="Instagram"
            value={
              form.instagram_url
            }
            onChange={(v) =>
              update(
                'instagram_url',
                v
              )
            }
          />

          <AdminInput
            label="Opening hours"
            value={
              form.opening_hours
            }
            onChange={(v) =>
              update(
                'opening_hours',
                v
              )
            }
          />

        </div>

        {message && (
          <div className="notice">
            {message}
          </div>
        )}

        <button
          className="primary-button"
          type="submit"
          disabled={saving}
        >
          <Save size={16} />

          {saving
            ? 'Saving...'
            : 'Save business information'}
        </button>

      </form>

    </div>
  );
}

/* =====================================================
   ADMIN MENU
===================================================== */

function AdminMenu() {
  const [items, setItems] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [editing, setEditing] =
    useState(null);

  const [showForm, setShowForm] =
    useState(false);

  const [message, setMessage] =
    useState('');

  async function load() {
    setLoading(true);

    const {
      data,
      error
    } = await supabase
      .from('menu_items')
      .select('*')
      .order('sort_order', {
        ascending: true
      })
      .order('id', {
        ascending: true
      });

    if (error) {
      setMessage(
        error.message
      );
    } else {
      setItems(
        data || []
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function deleteItem(id) {
    if (
      !window.confirm(
        'Delete this menu item?'
      )
    ) {
      return;
    }

    const {
      error
    } = await supabase
      .from('menu_items')
      .delete()
      .eq(
        'id',
        id
      );

    if (error) {
      setMessage(
        error.message
      );
      return;
    }

    setMessage(
      'Menu item deleted.'
    );

    load();
  }

  async function toggleItem(item) {
    const {
      error
    } = await supabase
      .from('menu_items')
      .update({
        active:
          !item.active
      })
      .eq(
        'id',
        item.id
      );

    if (error) {
      setMessage(
        error.message
      );
      return;
    }

    load();
  }

  return (
    <div className="admin-page">

      <div className="admin-page-heading-row">

        <AdminPageIntro
          eyebrow="MENU"
          title="Menu Management"
          description="Add, edit and control the sushi shown to customers."
        />

        <button
          className="primary-button"
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          <Plus size={17} />
          Add sushi
        </button>

      </div>

      {message && (
        <div className="notice">
          {message}
        </div>
      )}

      {showForm && (
        <MenuForm
          item={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={() => {
            setShowForm(false);
            setEditing(null);
            load();
          }}
        />
      )}

      {loading ? (
        <AdminLoading />
      ) : (
        <div className="admin-table-card">

          <div className="admin-table-header">

            <strong>
              Menu items
            </strong>

            <button
              className="icon-button"
              onClick={load}
            >
              <RefreshCw
                size={17}
              />
            </button>

          </div>

          {items.length === 0 ? (
            <AdminEmpty
              icon={
                <Utensils
                  size={24}
                />
              }
              title="No menu items yet"
              text="Add your first sushi item."
            />
          ) : (
            <div className="admin-menu-list">

              {items.map(
                (item) => (
                  <div
                    className="admin-menu-row"
                    key={item.id}
                  >

                    <div className="admin-menu-photo">

                      {item.image_url ? (
                        <img
                          src={
                            item.image_url
                          }
                          alt={
                            item.name
                          }
                        />
                      ) : (
                        <span>
                          🍣
                        </span>
                      )}

                    </div>

                    <div className="admin-menu-info">

                      <strong>
                        {item.name}
                      </strong>

                      <span>
                        {
                          item.category ||
                          'Uncategorized'
                        }
                      </span>

                      <small>
                        ₱
                        {Number(
                          item.price ||
                            0
                        ).toFixed(
                          2
                        )}
                      </small>

                    </div>

                    <span
                      className={
                        item.active
                          ? 'status-badge active'
                          : 'status-badge'
                      }
                    >
                      {item.active
                        ? 'Available'
                        : 'Hidden'}
                    </span>

                    <div className="admin-row-actions">

                      <button
                        className="icon-button"
                        title="Toggle availability"
                        onClick={() =>
                          toggleItem(
                            item
                          )
                        }
                      >
                        {item.active ? (
                          <ToggleRight
                            size={19}
                          />
                        ) : (
                          <ToggleLeft
                            size={19}
                          />
                        )}
                      </button>

                      <button
                        className="icon-button"
                        onClick={() => {
                          setEditing(
                            item
                          );
                          setShowForm(
                            true
                          );
                        }}
                      >
                        <Pencil
                          size={17}
                        />
                      </button>

                      <button
                        className="icon-button danger"
                        onClick={() =>
                          deleteItem(
                            item.id
                          )
                        }
                      >
                        <Trash2
                          size={17}
                        />
                      </button>

                    </div>

                  </div>
                )
              )}

            </div>
          )}

        </div>
      )}

    </div>
  );
}

/* =====================================================
   MENU FORM
===================================================== */

function MenuForm({
  item,
  onClose,
  onSaved
}) {
  const [form, setForm] =
    useState({
      name:
        item?.name || '',
      category:
        item?.category || 'classic',
      description:
        item?.description ||
        '',
      ingredients:
        item?.ingredients ||
        '',
      price:
        item?.price ?? '',
      image_url:
        item?.image_url ||
        '',
      active:
        item?.active ??
        true,
      sort_order:
        item?.sort_order ??
        0
    });

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState('');

  function update(field, value) {
    setForm((old) => ({
      ...old,
      [field]: value
    }));
  }

  async function save(e) {
    e.preventDefault();

    if (!form.name.trim()) {
      setMessage(
        'Please enter the sushi name.'
      );
      return;
    }

    setSaving(true);
    setMessage('');

    const payload = {
      name:
        form.name.trim(),
      category:
        form.category,
      description:
        form.description.trim() ||
        null,
      ingredients:
        form.ingredients.trim() ||
        null,
      price:
        Number(form.price) ||
        0,
      image_url:
        form.image_url.trim() ||
        null,
      active:
        form.active,
      sort_order:
        Number(
          form.sort_order
        ) || 0
    };

    let error;

    if (item?.id) {
      ({
        error
      } = await supabase
        .from('menu_items')
        .update(
          payload
        )
        .eq(
          'id',
          item.id
        ));
    } else {
      ({
        error
      } = await supabase
        .from('menu_items')
        .insert(
          payload
        ));
    }

    if (error) {
      setMessage(
        error.message
      );
      setSaving(false);
      return;
    }

    onSaved();
  }

  return (
    <div className="admin-form-card">

      <div className="admin-form-title-row">

        <div>
          <span>
            MENU ITEM
          </span>

          <h3>
            {item
              ? 'Edit sushi'
              : 'Add sushi'}
          </h3>
        </div>

        <button
          className="icon-button"
          onClick={onClose}
        >
          <X size={18} />
        </button>

      </div>

      <form onSubmit={save}>

        <div className="admin-form-grid">

          <AdminInput
            label="Sushi name"
            value={form.name}
            onChange={(v) =>
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
              onChange={(e) =>
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
            value={form.price}
            onChange={(v) =>
              update(
                'price',
                v
              )
            }
          />

          <AdminInput
            label="Image URL"
            value={
              form.image_url
            }
            onChange={(v) =>
              update(
                'image_url',
                v
              )
            }
            placeholder="https://..."
          />

          <div className="field full">
            <label>
              Description
            </label>

            <textarea
              value={
                form.description
              }
              onChange={(e) =>
                update(
                  'description',
                  e.target.value
                )
              }
              placeholder="Describe this sushi..."
            />
          </div>

          <div className="field full">
            <label>
              Ingredients
            </label>

            <textarea
              value={
                form.ingredients
              }
              onChange={(e) =>
                update(
                  'ingredients',
                  e.target.value
                )
              }
              placeholder="Rice, nori, salmon..."
            />
          </div>

          <AdminInput
            label="Sort order"
            type="number"
            value={
              form.sort_order
            }
            onChange={(v) =>
              update(
                'sort_order',
                v
              )
            }
          />

          <label className="admin-checkbox">

            <input
              type="checkbox"
              checked={
                form.active
              }
              onChange={(e) =>
                update(
                  'active',
                  e.target.checked
                )
              }
            />

            <span>
              Available on
              customer menu
            </span>

          </label>

        </div>

        {message && (
          <div className="notice">
            {message}
          </div>
        )}

        <div className="admin-form-actions">

          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="primary-button"
            disabled={saving}
          >
            <Save size={16} />

            {saving
              ? 'Saving...'
              : 'Save sushi'}
          </button>

        </div>

      </form>

    </div>
  );
}

/* =====================================================
   ADMIN REWARDS
===================================================== */

function AdminRewards() {
  const [rewards, setRewards] =
    useState([]);

  const [editing, setEditing] =
    useState(null);

  const [showForm, setShowForm] =
    useState(false);

  const [message, setMessage] =
    useState('');

  async function load() {
    const {
      data,
      error
    } = await supabase
      .from('rewards')
      .select('*')
      .order(
        'points_required'
      );

    if (error) {
      setMessage(
        error.message
      );
    } else {
      setRewards(
        data || []
      );
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggle(reward) {
    const {
      error
    } = await supabase
      .from('rewards')
      .update({
        active:
          !reward.active
      })
      .eq(
        'id',
        reward.id
      );

    if (error) {
      setMessage(
        error.message
      );
      return;
    }

    load();
  }

  async function remove(id) {
    if (
      !window.confirm(
        'Delete this reward?'
      )
    ) {
      return;
    }

    const {
      error
    } = await supabase
      .from('rewards')
      .delete()
      .eq(
        'id',
        id
      );

    if (error) {
      setMessage(
        error.message
      );
      return;
    }

    load();
  }

  return (
    <div className="admin-page">

      <div className="admin-page-heading-row">

        <AdminPageIntro
          eyebrow="REWARDS"
          title="Rewards Management"
          description="Control what customers can redeem with Sushi Points."
        />

        <button
          className="primary-button"
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          <Plus size={17} />
          Add reward
        </button>

      </div>

      {message && (
        <div className="notice">
          {message}
        </div>
      )}

      {showForm && (
        <RewardForm
          reward={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={() => {
            setShowForm(false);
            setEditing(null);
            load();
          }}
        />
      )}

      <div className="admin-table-card">

        {rewards.length === 0 ? (
          <AdminEmpty
            icon={
              <Gift size={24} />
            }
            title="No rewards yet"
            text="Create your first loyalty reward."
          />
        ) : (
          <div className="admin-menu-list">

            {rewards.map(
              (reward) => (
                <div
                  className="admin-menu-row"
                  key={reward.id}
                >

                  <div className="admin-menu-photo reward-photo">
                    <Gift
                      size={20}
                    />
                  </div>

                  <div className="admin-menu-info">

                    <strong>
                      {
                        reward.name
                      }
                    </strong>

                    <span>
                      {
                        reward.description ||
                        'No description'
                      }
                    </span>

                    <small>
                      {
                        reward.points_required
                      }{' '}
                      Sushi Points
                    </small>

                  </div>

                  <span
                    className={
                      reward.active
                        ? 'status-badge active'
                        : 'status-badge'
                    }
                  >
                    {reward.active
                      ? 'Active'
                      : 'Inactive'}
                  </span>

                  <div className="admin-row-actions">

                    <button
                      className="icon-button"
                      onClick={() =>
                        toggle(
                          reward
                        )
                      }
                    >
                      {reward.active ? (
                        <ToggleRight
                          size={
                            19
                          }
                        />
                      ) : (
                        <ToggleLeft
                          size={
                            19
                          }
                        />
                      )}
                    </button>

                    <button
                      className="icon-button"
                      onClick={() => {
                        setEditing(
                          reward
                        );
                        setShowForm(
                          true
                        );
                      }}
                    >
                      <Pencil
                        size={17}
                      />
                    </button>

                    <button
                      className="icon-button danger"
                      onClick={() =>
                        remove(
                          reward.id
                        )
                      }
                    >
                      <Trash2
                        size={17}
                      />
                    </button>

                  </div>

                </div>
              )
            )}

          </div>
        )}

      </div>

    </div>
  );
}

/* =====================================================
   REWARD FORM
===================================================== */

function RewardForm({
  reward,
  onClose,
  onSaved
}) {
  const [name, setName] =
    useState(
      reward?.name || ''
    );

  const [description, setDescription] =
    useState(
      reward?.description ||
        ''
    );

  const [points, setPoints] =
    useState(
      reward?.points_required ??
        ''
    );

  const [active, setActive] =
    useState(
      reward?.active ??
        true
    );

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState('');

  async function save(e) {
    e.preventDefault();

    if (!name.trim()) {
      setMessage(
        'Enter a reward name.'
      );
      return;
    }

    setSaving(true);
    setMessage('');

    const payload = {
      name:
        name.trim(),
      description:
        description.trim() ||
        null,
      points_required:
        Number(points) ||
        0,
      active
    };

    let error;

    if (reward?.id) {
      ({
        error
      } = await supabase
        .from('rewards')
        .update(
          payload
        )
        .eq(
          'id',
          reward.id
        ));
    } else {
      ({
        error
      } = await supabase
        .from('rewards')
        .insert(
          payload
        ));
    }

    if (error) {
      setMessage(
        error.message
      );
      setSaving(false);
      return;
    }

    onSaved();
  }

  return (
    <div className="admin-form-card">

      <div className="admin-form-title-row">

        <div>
          <span>
            REWARD
          </span>

          <h3>
            {reward
              ? 'Edit reward'
              : 'Add reward'}
          </h3>
        </div>

        <button
          className="icon-button"
          onClick={onClose}
        >
          <X size={18} />
        </button>

      </div>

      <form onSubmit={save}>

        <div className="admin-form-grid">

          <AdminInput
            label="Reward name"
            value={name}
            onChange={
              setName
            }
          />

          <AdminInput
            label="Points required"
            type="number"
            value={points}
            onChange={
              setPoints
            }
          />

          <div className="field full">
            <label>
              Description
            </label>

            <textarea
              value={
                description
              }
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              placeholder="Describe the reward..."
            />
          </div>

          <label className="admin-checkbox">

            <input
              type="checkbox"
              checked={active}
              onChange={(e) =>
                setActive(
                  e.target.checked
                )
              }
            />

            <span>
              Active
            </span>

          </label>

        </div>

        {message && (
          <div className="notice">
            {message}
          </div>
        )}

        <div className="admin-form-actions">

          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="primary-button"
            type="submit"
            disabled={saving}
          >
            <Save size={16} />

            {saving
              ? 'Saving...'
              : 'Save reward'}
          </button>

        </div>

      </form>

    </div>
  );
}

/* =====================================================
   ADMIN LOYALTY
===================================================== */

function AdminLoyalty() {
  const [form, setForm] =
    useState({
      points_per_peso:
        0.01,
      points_per_purchase:
        0,
      stamps_enabled:
        true,
      stamps_required:
        8,
      redemption_enabled:
        true,
      minimum_redemption_points:
        0
    });

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const {
      data,
      error
    } = await supabase
      .from(
        'loyalty_settings'
      )
      .select('*')
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setForm({
        points_per_peso:
          data.points_per_peso,
        points_per_purchase:
          data.points_per_purchase,
        stamps_enabled:
          data.stamps_enabled,
        stamps_required:
          data.stamps_required,
        redemption_enabled:
          data.redemption_enabled,
        minimum_redemption_points:
          data.minimum_redemption_points
      });
    }

    setLoading(false);
  }

  function update(
    field,
    value
  ) {
    setForm((old) => ({
      ...old,
      [field]: value
    }));
  }

  async function save(e) {
    e.preventDefault();

    setSaving(true);
    setMessage('');

    const {
      data: existing
    } = await supabase
      .from(
        'loyalty_settings'
      )
      .select('id')
      .limit(1)
      .maybeSingle();

    let error;

    if (existing) {
      ({
        error
      } = await supabase
        .from(
          'loyalty_settings'
        )
        .update({
          points_per_peso:
            Number(
              form.points_per_peso
            ) || 0,

          points_per_purchase:
            Number(
              form.points_per_purchase
            ) || 0,

          stamps_enabled:
            form.stamps_enabled,

          stamps_required:
            Number(
              form.stamps_required
            ) || 0,

          redemption_enabled:
            form.redemption_enabled,

          minimum_redemption_points:
            Number(
              form.minimum_redemption_points
            ) || 0
        })
        .eq(
          'id',
          existing.id
        ));
    } else {
      ({
        error
      } = await supabase
        .from(
          'loyalty_settings'
        )
        .insert({
          ...form,
          points_per_peso:
            Number(
              form.points_per_peso
            ) || 0
        }));
    }

    setMessage(
      error
        ? error.message
        : 'Loyalty settings saved.'
    );

    setSaving(false);
  }

  if (loading) {
    return (
      <AdminLoading />
    );
  }

  return (
    <div className="admin-page">

      <AdminPageIntro
        eyebrow="LOYALTY"
        title="Loyalty Settings"
        description="Control how customers earn and redeem Sushi Points."
      />

      <form
        className="admin-form-card"
        onSubmit={save}
      >

        <div className="admin-setting-block">

          <div className="admin-setting-heading">

            <Star size={20} />

            <div>
              <h3>
                Points earning
              </h3>

              <p>
                Set how many points
                customers earn from
                purchases.
              </p>
            </div>

          </div>

          <div className="admin-form-grid">

            <AdminInput
              label="Points per ₱1"
              type="number"
              step="0.01"
              value={
                form.points_per_peso
              }
              onChange={(v) =>
                update(
                  'points_per_peso',
                  v
                )
              }
            />

            <AdminInput
              label="Fixed points per purchase"
              type="number"
              step="0.01"
              value={
                form.points_per_purchase
              }
              onChange={(v) =>
                update(
                  'points_per_purchase',
                  v
                )
              }
            />

          </div>

          <div className="admin-help">
            Current customer
            earning in the staff
            panel is ₱100 = 1 point.
            We can connect that
            calculation to this
            setting next.
          </div>

        </div>

        <div className="admin-setting-block">

          <div className="admin-setting-heading">

            <Ticket size={20} />

            <div>
              <h3>
                Stamps
              </h3>

              <p>
                Control your digital
                stamp card.
              </p>
            </div>

          </div>

          <label className="admin-checkbox">

            <input
              type="checkbox"
              checked={
                form.stamps_enabled
              }
              onChange={(e) =>
                update(
                  'stamps_enabled',
                  e.target.checked
                )
              }
            />

            <span>
              Enable stamps
            </span>

          </label>

          <AdminInput
            label="Stamps required"
            type="number"
            value={
              form.stamps_required
            }
            onChange={(v) =>
              update(
                'stamps_required',
                v
              )
            }
          />

        </div>

        <div className="admin-setting-block">

          <div className="admin-setting-heading">

            <Gift size={20} />

            <div>
              <h3>
                Redemption
              </h3>

              <p>
                Control point
                redemptions.
              </p>
            </div>

          </div>

          <label className="admin-checkbox">

            <input
              type="checkbox"
              checked={
                form.redemption_enabled
              }
              onChange={(e) =>
                update(
                  'redemption_enabled',
                  e.target.checked
                )
              }
            />

            <span>
              Enable reward
              redemption
            </span>

          </label>

          <AdminInput
            label="Minimum redemption points"
            type="number"
            value={
              form.minimum_redemption_points
            }
            onChange={(v) =>
              update(
                'minimum_redemption_points',
                v
              )
            }
          />

        </div>

        {message && (
          <div className="notice">
            {message}
          </div>
        )}

        <button
          className="primary-button"
          type="submit"
          disabled={saving}
        >
          <Save size={16} />

          {saving
            ? 'Saving...'
            : 'Save loyalty settings'}
        </button>

      </form>

    </div>
  );
}

/* =====================================================
   ADMIN CUSTOMERS
===================================================== */

function AdminCustomers() {
  const [customers, setCustomers] =
    useState([]);

  const [search, setSearch] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);

    const {
      data
    } = await supabase
      .from('customers')
      .select('*')
      .order(
        'created_at',
        {
          ascending: false
        }
      );

    setCustomers(
      data || []
    );

    setLoading(false);
  }

  const filtered =
    customers.filter(
      (customer) => {
        const q =
          search
            .toLowerCase()
            .trim();

        if (!q) return true;

        return (
          String(
            customer.full_name ||
              ''
          )
            .toLowerCase()
            .includes(q) ||
          String(
            customer.email ||
              ''
          )
            .toLowerCase()
            .includes(q) ||
          String(
            customer.phone ||
              ''
          )
            .toLowerCase()
            .includes(q) ||
          String(
            customer.customer_code ||
              ''
          )
            .toLowerCase()
            .includes(q)
        );
      }
    );

  return (
    <div className="admin-page">

      <AdminPageIntro
        eyebrow="CUSTOMERS"
        title="Customer Management"
        description="View your loyalty club members."
      />

      <div className="admin-toolbar">

        <div className="admin-search">

          <Users size={17} />

          <input
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search customers..."
          />

        </div>

        <button
          className="icon-button"
          onClick={load}
        >
          <RefreshCw
            size={17}
          />
        </button>

      </div>

      <div className="admin-table-card">

        {loading ? (
          <AdminLoading />
        ) : filtered.length ===
          0 ? (
          <AdminEmpty
            icon={
              <Users
                size={24}
              />
            }
            title="No customers found"
            text="Try a different search."
          />
        ) : (
          <div className="admin-customer-list">

            {filtered.map(
              (customer) => (
                <div
                  className="admin-customer-row"
                  key={
                    customer.id
                  }
                >

                  <div className="admin-customer-avatar">
                    {(
                      customer.full_name ||
                      '?'
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="admin-customer-info">

                    <strong>
                      {
                        customer.full_name ||
                        'Unnamed customer'
                      }
                    </strong>

                    <span>
                      {
                        customer.email ||
                        'No email'
                      }
                    </span>

                    <small>
                      Code:{' '}
                      {
                        customer.customer_code ||
                        '—'
                      }
                    </small>

                  </div>

                  <div className="admin-customer-balance">

                    <span>
                      POINTS
                    </span>

                    <strong>
                      {Number(
                        customer.points ||
                          0
                      ).toFixed(0)}
                    </strong>

                  </div>

                  <div className="admin-customer-balance">

                    <span>
                      STAMPS
                    </span>

                    <strong>
                      {
                        customer.stamps ||
                        0
                      }
                    </strong>

                  </div>

                </div>
              )
            )}

          </div>
        )}

      </div>

    </div>
  );
}

/* =====================================================
   ADMIN TRANSACTIONS
===================================================== */

function AdminTransactions() {
  const [transactions, setTransactions] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);

    const {
      data,
      error
    } = await supabase
      .from(
        'transactions'
      )
      .select(`
        *,
        customers (
          full_name,
          email,
          customer_code
        )
      `)
      .order(
        'created_at',
        {
          ascending: false
        }
      )
      .limit(200);

    if (error) {
      console.error(
        error
      );
    }

    setTransactions(
      data || []
    );

    setLoading(false);
  }

  return (
    <div className="admin-page">

      <div className="admin-page-heading-row">

        <AdminPageIntro
          eyebrow="ACTIVITY"
          title="Transactions"
          description="Review customer purchases and Sushi Point activity."
        />

        <button
          className="icon-button"
          onClick={load}
        >
          <RefreshCw
            size={17}
          />
        </button>

      </div>

      <div className="admin-table-card">

        {loading ? (
          <AdminLoading />
        ) : transactions.length ===
          0 ? (
          <AdminEmpty
            icon={
              <History
                size={24}
              />
            }
            title="No transactions yet"
            text="Customer activity will appear here."
          />
        ) : (
          <div className="admin-transaction-list">

            {transactions.map(
              (tx) => (
                <div
                  className="admin-transaction-row"
                  key={tx.id}
                >

                  <div>

                    <strong>
                      {tx.customers
                        ?.full_name ||
                        'Customer'}
                    </strong>

                    <span>
                      {
                        tx.transaction_type
                      }
                    </span>

                    <small>
                      {new Date(
                        tx.created_at
                      ).toLocaleString()}
                    </small>

                  </div>

                  <b>
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

    </div>
  );
}

/* =====================================================
   ADMIN BIRTHDAY
===================================================== */

function AdminBirthday() {
  const [rewards, setRewards] =
    useState([]);

  const [name, setName] =
    useState('');

  const [rewardText, setRewardText] =
    useState('');

  const [active, setActive] =
    useState(true);

  const [message, setMessage] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  async function load() {
    const {
      data,
      error
    } = await supabase
      .from(
        'birthday_rewards'
      )
      .select('*')
      .order('id');

    if (error) {
      setMessage(
        error.message
      );
    }

    setRewards(
      data || []
    );

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addReward(e) {
    e.preventDefault();

    if (!name.trim() ||
        !rewardText.trim()) {
      setMessage(
        'Please enter the birthday reward details.'
      );
      return;
    }

    const {
      error
    } = await supabase
      .from(
        'birthday_rewards'
      )
      .insert({
        name:
          name.trim(),
        reward_text:
          rewardText.trim(),
        active
      });

    if (error) {
      setMessage(
        error.message
      );
      return;
    }

    setName('');
    setRewardText('');

    setMessage(
      'Birthday reward added.'
    );

    load();
  }

  async function toggle(reward) {
    const {
      error
    } = await supabase
      .from(
        'birthday_rewards'
      )
      .update({
        active:
          !reward.active
      })
      .eq(
        'id',
        reward.id
      );

    if (error) {
      setMessage(
        error.message
      );
      return;
    }

    load();
  }

  return (
    <div className="admin-page">

      <AdminPageIntro
        eyebrow="BIRTHDAY"
        title="Birthday Rewards"
        description="Create special rewards for customers on their birthday."
      />

      <form
        className="admin-form-card"
        onSubmit={addReward}
      >

        <div className="admin-form-grid">

          <AdminInput
            label="Reward name"
            value={name}
            onChange={setName}
            placeholder="Birthday Sushi"
          />

          <AdminInput
            label="Reward text"
            value={rewardText}
            onChange={
              setRewardText
            }
            placeholder="Enjoy a free classic roll on us!"
          />

        </div>

        <label className="admin-checkbox">

          <input
            type="checkbox"
            checked={active}
            onChange={(e) =>
              setActive(
                e.target.checked
              )
            }
          />

          <span>
            Active
          </span>

        </label>

        {message && (
          <div className="notice">
            {message}
          </div>
        )}

        <button
          className="primary-button"
          type="submit"
        >
          <Plus size={17} />
          Add birthday reward
        </button>

      </form>

      <div className="admin-table-card">

        {loading ? (
          <AdminLoading />
        ) : (
          <div className="admin-menu-list">

            {rewards.map(
              (reward) => (
                <div
                  className="admin-menu-row"
                  key={reward.id}
                >

                  <div className="admin-menu-photo reward-photo">
                    <Cake
                      size={20}
                    />
                  </div>

                  <div className="admin-menu-info">

                    <strong>
                      {reward.name}
                    </strong>

                    <span>
                      {
                        reward.reward_text
                      }
                    </span>

                  </div>

                  <span
                    className={
                      reward.active
                        ? 'status-badge active'
                        : 'status-badge'
                    }
                  >
                    {reward.active
                      ? 'Active'
                      : 'Inactive'}
                  </span>

                  <button
                    className="icon-button"
                    onClick={() =>
                      toggle(
                        reward
                      )
                    }
                  >
                    {reward.active ? (
                      <ToggleRight
                        size={19}
                      />
                    ) : (
                      <ToggleLeft
                        size={19}
                      />
                    )}
                  </button>

                </div>
              )
            )}

          </div>
        )}

      </div>

    </div>
  );
}

/* =====================================================
   ADMIN STAFF
===================================================== */

function AdminStaff() {
  const [staff, setStaff] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [message, setMessage] =
    useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);

    const {
      data,
      error
    } = await supabase
      .from(
        'staff_users'
      )
      .select('*')
      .order(
        'created_at',
        {
          ascending: true
        }
      );

    if (error) {
      setMessage(
        error.message
      );
    }

    setStaff(
      data || []
    );

    setLoading(false);
  }

  async function toggle(user) {
    const {
      error
    } = await supabase
      .from(
        'staff_users'
      )
      .update({
        active:
          !user.active
      })
      .eq(
        'id',
        user.id
      );

    if (error) {
      setMessage(
        error.message
      );
      return;
    }

    load();
  }

  return (
    <div className="admin-page">

      <AdminPageIntro
        eyebrow="ACCESS"
        title="Staff & Admin"
        description="Manage authorized staff accounts."
      />

      <div className="admin-help-card">

        <Shield size={20} />

        <div>

          <strong>
            Adding staff accounts
          </strong>

          <p>
            Create the user first in
            Supabase Authentication,
            then add their User ID
            to the
            <code>
              staff_users
            </code>
            table.
          </p>

        </div>

      </div>

      <div className="admin-table-card">

        {loading ? (
          <AdminLoading />
        ) : staff.length ===
          0 ? (
          <AdminEmpty
            icon={
              <Shield
                size={24}
              />
            }
            title="No staff accounts"
            text="Your admin account will appear here."
          />
        ) : (
          <div className="admin-menu-list">

            {staff.map(
              (user) => (
                <div
                  className="admin-menu-row"
                  key={user.id}
                >

                  <div className="admin-customer-avatar">
                    <User
                      size={18}
                    />
                  </div>

                  <div className="admin-menu-info">

                    <strong>
                      {
                        user.full_name ||
                        'Staff'
                      }
                    </strong>

                    <span>
                      {
                        user.email
                      }
                    </span>

                    <small>
                      Role:{' '}
                      {
                        user.role
                      }
                    </small>

                  </div>

                  <span
                    className={
                      user.active
                        ? 'status-badge active'
                        : 'status-badge'
                    }
                  >
                    {user.active
                      ? 'Active'
                      : 'Disabled'}
                  </span>

                  <button
                    className="icon-button"
                    onClick={() =>
                      toggle(
                        user
                      )
                    }
                  >
                    {user.active ? (
                      <ToggleRight
                        size={19}
                      />
                    ) : (
                      <ToggleLeft
                        size={19}
                      />
                    )}
                  </button>

                </div>
              )
            )}

          </div>
        )}

      </div>

    </div>
  );
}

/* =====================================================
   ADMIN HOMEPAGE
===================================================== */

function AdminHomepage() {
  const [form, setForm] =
    useState({
      hero_title:
        'Good sushi. Better rewards.',
      hero_description:
        'Enjoy your favorites, earn Sushi Points, and make every order count.',
      hero_button_text:
        'Explore sushi',
      loyalty_title:
        'Your Sushi Points',
      loyalty_description:
        'Every order brings you closer to something delicious.',
      menu_title:
        'Explore Our Menu',
      menu_description:
        'Find your favorite roll, nigiri, sashimi or platter.',
      rewards_title:
        'Rewards',
      rewards_description:
        'A little something for every sushi lover.'
    });

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const {
      data,
      error
    } = await supabase
      .from(
        'homepage_content'
      )
      .select('*')
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setForm({
        hero_title:
          data.hero_title ||
          '',
        hero_description:
          data.hero_description ||
          '',
        hero_button_text:
          data.hero_button_text ||
          '',
        loyalty_title:
          data.loyalty_title ||
          '',
        loyalty_description:
          data.loyalty_description ||
          '',
        menu_title:
          data.menu_title ||
          '',
        menu_description:
          data.menu_description ||
          '',
        rewards_title:
          data.rewards_title ||
          '',
        rewards_description:
          data.rewards_description ||
          ''
      });
    }

    setLoading(false);
  }

  function update(
    field,
    value
  ) {
    setForm((old) => ({
      ...old,
      [field]: value
    }));
  }

  async function save(e) {
    e.preventDefault();

    setSaving(true);
    setMessage('');

    const {
      data: existing
    } = await supabase
      .from(
        'homepage_content'
      )
      .select('id')
      .limit(1)
      .maybeSingle();

    let error;

    if (existing) {
      ({
        error
      } = await supabase
        .from(
          'homepage_content'
        )
        .update(form)
        .eq(
          'id',
          existing.id
        ));
    } else {
      ({
        error
      } = await supabase
        .from(
          'homepage_content'
        )
        .insert(form));
    }

    setMessage(
      error
        ? error.message
        : 'Homepage content saved.'
    );

    setSaving(false);
  }

  if (loading) {
    return (
      <AdminLoading />
    );
  }

  return (
    <div className="admin-page">

      <AdminPageIntro
        eyebrow="HOMEPAGE"
        title="Homepage Content"
        description="Change the text customers see on the loyalty homepage."
      />

      <form
        className="admin-form-card"
        onSubmit={save}
      >

        <div className="admin-setting-block">

          <div className="admin-setting-heading">

            <HomeIcon
              size={20}
            />

            <div>
              <h3>
                Hero section
              </h3>

              <p>
                The first section
                customers see.
              </p>
            </div>

          </div>

          <div className="admin-form-grid">

            <AdminInput
              label="Hero title"
              value={
                form.hero_title
              }
              onChange={(v) =>
                update(
                  'hero_title',
                  v
                )
              }
            />

            <AdminInput
              label="Button text"
              value={
                form.hero_button_text
              }
              onChange={(v) =>
                update(
                  'hero_button_text',
                  v
                )
              }
            />

            <div className="field full">

              <label>
                Hero description
              </label>

              <textarea
                value={
                  form.hero_description
                }
                onChange={(e) =>
                  update(
                    'hero_description',
                    e.target.value
                  )
                }
              />

            </div>

          </div>

        </div>

        <div className="admin-setting-block">

          <div className="admin-setting-heading">

            <Star size={20} />

            <div>
              <h3>
                Loyalty section
              </h3>

              <p>
                Content for the
                Sushi Points section.
              </p>
            </div>

          </div>

          <AdminInput
            label="Title"
            value={
              form.loyalty_title
            }
            onChange={(v) =>
              update(
                'loyalty_title',
                v
              )
            }
          />

          <div className="field">

            <label>
              Description
            </label>

            <textarea
              value={
                form.loyalty_description
              }
              onChange={(e) =>
                update(
                  'loyalty_description',
                  e.target.value
                )
              }
            />

          </div>

        </div>

        <div className="admin-setting-block">

          <div className="admin-setting-heading">

            <Utensils
              size={20}
            />

            <div>
              <h3>
                Menu section
              </h3>

              <p>
                Content above the
                customer menu.
              </p>
            </div>

          </div>

          <AdminInput
            label="Title"
            value={
              form.menu_title
            }
            onChange={(v) =>
              update(
                'menu_title',
                v
              )
            }
          />

          <div className="field">

            <label>
              Description
            </label>

            <textarea
              value={
                form.menu_description
              }
              onChange={(e) =>
                update(
                  'menu_description',
                  e.target.value
                )
              }
            />

          </div>

        </div>

        <div className="admin-setting-block">

          <div className="admin-setting-heading">

            <Gift size={20} />

            <div>
              <h3>
                Rewards section
              </h3>

              <p>
                Content above the
                customer rewards.
              </p>
            </div>

          </div>

          <AdminInput
            label="Title"
            value={
              form.rewards_title
            }
            onChange={(v) =>
              update(
                'rewards_title',
                v
              )
            }
          />

          <div className="field">

            <label>
              Description
            </label>

            <textarea
              value={
                form.rewards_description
              }
              onChange={(e) =>
                update(
                  'rewards_description',
                  e.target.value
                )
              }
            />

          </div>

        </div>

        {message && (
          <div className="notice">
            {message}
          </div>
        )}

        <button
          className="primary-button"
          type="submit"
          disabled={saving}
        >
          <Save size={16} />

          {saving
            ? 'Saving...'
            : 'Save homepage'}
        </button>

      </form>

    </div>
  );
}

/* =====================================================
   ADMIN IMAGES
===================================================== */

function AdminImages() {
  return (
    <div className="admin-page">

      <AdminPageIntro
        eyebrow="MEDIA"
        title="Image Uploading"
        description="Manage the images used throughout At Home Sushi."
      />

      <div className="admin-help-card">

        <ImageIcon
          size={21}
        />

        <div>

          <strong>
            Image storage
          </strong>

          <p>
            Your menu currently
            supports image URLs.
            The next step is
            connecting this section
            to a Supabase Storage
            bucket so you can upload
            photos directly from
            Admin.
          </p>

        </div>

      </div>

      <div className="admin-section-grid">

        <div className="admin-action-card static">

          <ImageIcon
            size={22}
          />

          <div>

            <strong>
              Menu photos
            </strong>

            <span>
              Upload photos for
              individual sushi items.
            </span>

          </div>

        </div>

        <div className="admin-action-card static">

          <Store size={22} />

          <div>

            <strong>
              Business logo
            </strong>

            <span>
              Manage the logo shown
              across the app.
            </span>

          </div>

        </div>

        <div className="admin-action-card static">

          <HomeIcon
            size={22}
          />

          <div>

            <strong>
              Homepage images
            </strong>

            <span>
              Prepare images for
              homepage sections.
            </span>

          </div>

        </div>

      </div>

    </div>
  );
}

/* =====================================================
   ADMIN GENERAL
===================================================== */

function AdminGeneral() {
  const [form, setForm] =
    useState({
      app_name:
        'At Home Sushi Loyalty Club',
      maintenance_mode:
        false,
      customer_registration_enabled:
        true,
      ordering_enabled:
        true,
      facebook_enabled:
        true,
      ordermo_enabled:
        true
    });

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const {
      data,
      error
    } = await supabase
      .from(
        'app_settings'
      )
      .select('*')
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      setForm({
        app_name:
          data.app_name ||
          '',
        maintenance_mode:
          data.maintenance_mode,
        customer_registration_enabled:
          data.customer_registration_enabled,
        ordering_enabled:
          data.ordering_enabled,
        facebook_enabled:
          data.facebook_enabled,
        ordermo_enabled:
          data.ordermo_enabled
      });
    }

    setLoading(false);
  }

  function toggle(field) {
    setForm((old) => ({
      ...old,
      [field]:
        !old[field]
    }));
  }

  async function save(e) {
    e.preventDefault();

    setSaving(true);
    setMessage('');

    const {
      data: existing
    } = await supabase
      .from(
        'app_settings'
      )
      .select('id')
      .limit(1)
      .maybeSingle();

    let error;

    if (existing) {
      ({
        error
      } = await supabase
        .from(
          'app_settings'
        )
        .update(form)
        .eq(
          'id',
          existing.id
        ));
    } else {
      ({
        error
      } = await supabase
        .from(
          'app_settings'
        )
        .insert(form));
    }

    setMessage(
      error
        ? error.message
        : 'General settings saved.'
    );

    setSaving(false);
  }

  if (loading) {
    return (
      <AdminLoading />
    );
  }

  const switches = [
    {
      key:
        'maintenance_mode',
      title:
        'Maintenance mode',
      description:
        'Temporarily place the app into maintenance mode.'
    },
    {
      key:
        'customer_registration_enabled',
      title:
        'Customer registration',
      description:
        'Allow new customers to join the loyalty club.'
    },
    {
      key:
        'ordering_enabled',
      title:
        'Online ordering',
      description:
        'Show ordering options to customers.'
    },
    {
      key:
        'facebook_enabled',
      title:
        'Facebook ordering',
      description:
        'Allow customers to order through Facebook.'
    },
    {
      key:
        'ordermo_enabled',
      title:
        'OrderMo',
      description:
        'Show the OrderMo ordering option.'
    }
  ];

  return (
    <div className="admin-page">

      <AdminPageIntro
        eyebrow="GENERAL"
        title="General App Settings"
        description="Control the main behavior of the loyalty app."
      />

      <form
        className="admin-form-card"
        onSubmit={save}
      >

        <AdminInput
          label="App name"
          value={
            form.app_name
          }
          onChange={(v) =>
            setForm((old) => ({
              ...old,
              app_name: v
            }))
          }
        />

        <div className="admin-switch-list">

          {switches.map(
            (item) => (
              <button
                type="button"
                className="admin-switch-row"
                key={item.key}
                onClick={() =>
                  toggle(
                    item.key
                  )
                }
              >

                <div>

                  <strong>
                    {item.title}
                  </strong>

                  <span>
                    {
                      item.description
                    }
                  </span>

                </div>

                {form[
                  item.key
                ] ? (
                  <ToggleRight
                    size={30}
                  />
                ) : (
                  <ToggleLeft
                    size={30}
                  />
                )}

              </button>
            )
          )}

        </div>

        {message && (
          <div className="notice">
            {message}
          </div>
        )}

        <button
          className="primary-button"
          type="submit"
          disabled={saving}
        >
          <Save size={16} />

          {saving
            ? 'Saving...'
            : 'Save general settings'}
        </button>

      </form>

    </div>
  );
}

/* =====================================================
   ADMIN HELPERS
===================================================== */

function AdminPageIntro({
  eyebrow,
  title,
  description
}) {
  return (
    <div className="admin-page-heading">

      <span>
        {eyebrow}
      </span>

      <h2>
        {title}
      </h2>

      <p>
        {description}
      </p>

    </div>
  );
}

function AdminInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  step
}) {
  return (
    <div className="field">

      <label>
        {label}
      </label>

      <input
        type={type}
        value={
          value ?? ''
        }
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        placeholder={
          placeholder
        }
        step={step}
      />

    </div>
  );
}

function AdminLoading() {
  return (
    <div className="admin-loading">
      <RefreshCw
        size={20}
        className="spin"
      />

      <span>
        Loading...
      </span>
    </div>
  );
}

function AdminEmpty({
  icon,
  title,
  text
}) {
  return (
    <div className="admin-empty">

      {icon}

      <strong>
        {title}
      </strong>

      <p>
        {text}
      </p>

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

if (!rootElement) {
  throw new Error(
    'Root element #root was not found.'
  );
}

createRoot(
  rootElement
).render(
  path === '/admin'
    ? <Admin />
    : path === '/staff'
    ? <Staff />
    : <App />
);
