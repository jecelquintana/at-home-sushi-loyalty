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
  Save
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
      const { data, error } = await supabase.auth.getSession();

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

  /* =====================================================
     LOAD OR CREATE CUSTOMER PROFILE
  ===================================================== */

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

    /* ===================================================
       PROFILE ALREADY EXISTS
    =================================================== */

    if (data) {
      setProfile(data);
      setLoading(false);
      return;
    }

    /* ===================================================
       PROFILE DOES NOT EXIST
       CREATE IT NOW
    =================================================== */

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

    console.log('Creating customer profile:', newCustomer);

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
      reloadProfile={() =>
        loadProfile(session.user)
      }
    />
  );
}

/* =====================================================
   AUTH
===================================================== */

function Auth({ mode, setMode }) {
  function Settings({
  session,
  profile,
  reloadProfile,
  onLogout
}) {
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

    /* ===================================================
       LOGIN
    =================================================== */

    if (mode === 'login') {
      if (remember) {
        localStorage.setItem('rememberLogin', 'true');
        localStorage.setItem('savedLoginEmail', email);
      } else {
        localStorage.removeItem('rememberLogin');
        localStorage.removeItem('savedLoginEmail');
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

    /* ===================================================
       SIGN UP
    =================================================== */

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

    /* ===================================================
       IF SUPABASE RETURNS A SESSION
       CREATE PROFILE IMMEDIATELY
    =================================================== */

    if (data?.session && data?.user) {
      const user = data.user;

      const {
        error: profileError
      } = await supabase
        .from('customers')
        .insert({
          id: user.id,
          full_name: name.trim(),
          phone: phone.trim() || null,
          email: user.email || email.trim(),
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

    /* ===================================================
       SUCCESS
    =================================================== */

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
                    setRemember(e.target.checked)
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
   DASHBOARD
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

    setRewards(rewardsData || []);

    const {
      data: txData,
      error: txError
    } = await supabase
      .from('transactions')
      .select('*')
      .eq('customer_id', session.user.id)
      .order('created_at', {
        ascending: false
      })
      .limit(30);

    if (txError) {
      console.error(
        'Transactions error:',
        txError
      );
    }

    setTransactions(txData || []);
  }

  async function checkBirthdayReward() {
    if (!profile?.birthday) return;

    const today = new Date();
    const birthday = new Date(profile.birthday);

    const birthdayToday =
      today.getMonth() === birthday.getMonth() &&
      today.getDate() === birthday.getDate();

    if (!birthdayToday) return;

    const year = today.getFullYear();

    const { data: claimed } =
      await supabase
        .from('birthday_claims')
        .select('id')
        .eq('customer_id', profile.id)
        .eq('birthday_year', year)
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

          <img
            src={logo}
            alt="At Home Sushi"
          />

          <div>
            <strong>AT HOME SUSHI</strong>
            <span>LOYALTY CLUB</span>
          </div>

        </div>

        <button
          className="header-action"
          onClick={logout}
          aria-label="Log out"
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
            transactions={transactions}
          />
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
{tab === 'settings' && (
  <Settings
    session={session}
    profile={profile}
    reloadProfile={reloadProfile}
    onLogout={logout}
  />
)}

/* =====================================================
   HOME
===================================================== */

function Home({
  profile,
  rewards,
  onGoRewards
}) {
  const points = Number(profile.points || 0);

  const [menu, setMenu] = useState([]);
  const [menuLoading, setMenuLoading] = useState(true);

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
    { id: 'appetizers', label: 'Appetizers' },
    { id: 'classic', label: 'Classic Rolls' },
    { id: 'specialty', label: 'Specialty Rolls' },
    { id: 'signature', label: 'Signature Rolls' },
    { id: 'veggie', label: 'Veggie' },
    { id: 'nigiri', label: 'Nigiri' },
    { id: 'sashimi', label: 'Sashimi' },
    { id: 'platters', label: 'Platters' }
  ];

  const filteredMenu =
    activeCategory === 'all'
      ? menu
      : menu.filter(
          (item) =>
            String(item.category || '').toLowerCase() ===
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

            <strong>
              {points.toFixed(0)}
            </strong>

            <small>SUSHI POINTS</small>

          </div>

          <button
            onClick={onGoRewards}
            aria-label="View rewards"
          >
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

          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={
                activeCategory === category.id
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setActiveCategory(category.id)
              }
            >
              {category.label}
            </button>
          ))}

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
                Check back soon for our latest menu.
              </p>

            </div>
          )}

        {!menuLoading &&
          filteredMenu.length > 0 && (
            <div className="menu-grid">

              {filteredMenu.map((item) => (
                <article
                  className="menu-item-card"
                  key={item.id}
                >

                  <div className="menu-item-image">

                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
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
                        <span>🍣</span>
                        <small>
                          AT HOME SUSHI
                        </small>
                      </div>
                    )}

                  </div>

                  <div className="menu-item-content">

                    <div className="menu-item-top">

                      <h3>
                        {item.name}
                      </h3>

                    </div>

                    {item.description && (
                      <p>
                        {item.description}
                      </p>
                    )}

                    <button
                      type="button"
                      className="order-button"
                      onClick={() =>
                        openOrder(item)
                      }
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

          {rewards
            .slice(0, 3)
            .map((reward, i) => (
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
                  {reward.points_required}
                </b>

              </div>
            ))}

          {rewards.length === 0 && (
            <div className="empty-card">
              Rewards will appear here once available.
            </div>
          )}

        </div>

        <button
          className="primary-button"
          onClick={onGoRewards}
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
                aria-label="Close"
              >
                <X size={19} />
              </button>

              <div className="section-label">
                {selectedMenuItem.name}
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

function DigitalCard({ profile }) {
  return (
    <div className="page-container">

      <div className="page-heading">

        <span className="section-label">
          YOUR MEMBERSHIP
        </span>

        <h1>My Card</h1>

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
            value={profile.customer_code || ''}
            size={190}
            includeMargin
          />

        </div>

        <div className="digital-member">

          <span>MEMBER</span>

          <strong>
            {profile.full_name}
          </strong>

          <small>
            {profile.customer_code}
          </small>

        </div>

        <div className="digital-balances">

          <div>
            <span>POINTS</span>

            <strong>
              {Number(
                profile.points || 0
              ).toFixed(0)}
            </strong>
          </div>

          <div>
            <span>STAMPS</span>

            <strong>
              {profile.stamps || 0}
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
  const [selected, setSelected] =
    useState(null);

  const [code, setCode] =
    useState('');

  const [busy, setBusy] =
    useState(false);

  const [msg, setMsg] =
    useState('');

  const points = Number(
    profile.points || 0
  );

  async function redeem() {
    if (!selected) return;

    const required = Number(
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
        customer_id: profile.id,
        reward_id: selected.id,
        points_used: required,
        redemption_code: redemptionCode,
        status: 'pending'
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
            Staff will confirm your redemption before your points are deducted.
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

        <h1>Rewards</h1>

        <p>
          You have{' '}
          <strong>
            {points.toFixed(0)} Sushi Points
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
            selected?.id === reward.id;

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
                setSelected(reward)
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

              <ChevronRight size={18} />

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
            Redeem {selected.name}?
          </h2>

          <p>
            This will create a redemption code for{' '}
            <strong>
              {selected.points_required} points.
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

        <h1>History</h1>

      </div>

      {transactions.length === 0 ? (
        <div className="empty-card large">

          <History size={25} />

          <strong>
            No transactions yet
          </strong>

          <p>
            Your activity will appear here.
          </p>

        </div>
      ) : (
        <div className="history-list">

          {transactions.map((tx) => (
            <div
              className="history-card"
              key={tx.id}
            >

              <div>

                <strong>
                  {tx.transaction_type}
                </strong>

                <small>
                  {new Date(
                    tx.created_at
                  ).toLocaleString()}
                </small>

              </div>

              <b className="history-points">
                +{Number(
                  tx.points_earned || 0
                ).toFixed(2)}
              </b>

            </div>
          ))}

        </div>
      )}

    </div>
  );
}

/* =====================================================
   STAFF
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
  const [profileBusy, setProfileBusy] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  useEffect(() => {
    setName(profile.full_name || '');
    setPhone(profile.phone || '');
    setBirthday(profile.birthday || '');
  }, [profile]);

  async function saveProfile(e) {
    e.preventDefault();

    if (!name.trim()) {
      setProfileMessage('Please enter your full name.');
      return;
    }

    setProfileBusy(true);
    setProfileMessage('');

    const updates = {
      full_name: name.trim(),
      phone: phone.trim() || null,
      birthday: birthday || null
    };

    const { error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', session.user.id);

    if (error) {
      setProfileMessage(error.message);
      setProfileBusy(false);
      return;
    }

    await supabase.auth.updateUser({ data: updates });
    await reloadProfile();

    setProfileMessage('Your profile has been updated.');
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

    if (newPassword !== confirmPassword) {
      setPasswordMessage('Your new passwords do not match.');
      return;
    }

    setPasswordBusy(true);
    setPasswordMessage('');

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      setPasswordMessage(error.message);
    } else {
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage('Your password has been changed.');
    }

    setPasswordBusy(false);
  }

  return (
    <div className="page-container settings-page">
      <div className="page-heading">
        <span className="section-label">YOUR ACCOUNT</span>
        <h1>Settings</h1>
        <p>Manage your loyalty club account.</p>
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
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>Phone number</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09xxxxxxxxx"
            />
          </div>

          <div className="field">
            <label>Birthday</label>
            <input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
            />
          </div>

          {profileMessage && (
            <div className="notice">{profileMessage}</div>
          )}

          <button
            className="primary-button"
            type="submit"
            disabled={profileBusy}
          >
            <Save size={16} />
            {profileBusy ? 'Saving...' : 'Save changes'}
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
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              required
              minLength={8}
            />
          </div>

          <div className="field">
            <label>Confirm new password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              required
              minLength={8}
            />
          </div>

          {passwordMessage && (
            <div className="notice">{passwordMessage}</div>
          )}

          <button
            className="secondary-button"
            type="submit"
            disabled={passwordBusy}
          >
            {passwordBusy ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </section>

      <section className="settings-card settings-links">
        <a href="#privacy-policy">
          <Shield size={18} />
          <span>
            <strong>Privacy Policy</strong>
            <small>How we handle your information</small>
          </span>
          <ChevronRight size={18} />
        </a>

        <a href="#terms-and-conditions">
          <Scale size={18} />
          <span>
            <strong>Terms &amp; Conditions</strong>
            <small>The terms for using the loyalty club</small>
          </span>
          <ChevronRight size={18} />
        </a>

        <a href="#about-at-home-sushi">
          <Info size={18} />
          <span>
            <strong>About At Home Sushi</strong>
            <small>Quick rolls. Bold flavors. Great rewards.</small>
          </span>
          <ChevronRight size={18} />
        </a>
      </section>

      <section className="settings-card settings-legal">
        <div id="privacy-policy">
          <h2>Privacy Policy</h2>
          <p>
            We use your account details to operate your loyalty membership,
            including points, rewards, and birthday offers.
          </p>
        </div>

        <div id="terms-and-conditions">
          <h2>Terms &amp; Conditions</h2>
          <p>
            Points and rewards are subject to availability and may not be
            exchanged for cash.
          </p>
        </div>

        <div id="about-at-home-sushi">
          <h2>About At Home Sushi</h2>
          <p>
            At Home Sushi brings quick rolls, bold flavors, and a little
            extra value to every order.
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

  return (
    <div className="page-container settings-page">
      <div className="page-heading">
        <span className="section-label">YOUR ACCOUNT</span>
        <h1>Settings</h1>
        <p>Manage your loyalty club account.</p>
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
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>Phone number</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09xxxxxxxxx"
            />
          </div>

          <div className="field">
            <label>Birthday</label>
            <input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
            />
          </div>

          {profileMessage && (
            <div className="notice">{profileMessage}</div>
          )}

          <button
            className="primary-button"
            type="submit"
            disabled={profileBusy}
          >
            <Save size={16} />
            {profileBusy ? 'Saving...' : 'Save changes'}
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
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              required
              minLength={8}
            />
          </div>

          <div className="field">
            <label>Confirm new password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              required
              minLength={8}
            />
          </div>

          {passwordMessage && (
            <div className="notice">{passwordMessage}</div>
          )}

          <button
            className="secondary-button"
            type="submit"
            disabled={passwordBusy}
          >
            {passwordBusy ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </section>

      <section className="settings-card settings-links">
        <a href="#privacy-policy">
          <Shield size={18} />
          <span>
            <strong>Privacy Policy</strong>
            <small>How we handle your information</small>
          </span>
          <ChevronRight size={18} />
        </a>

        <a href="#terms-and-conditions">
          <Scale size={18} />
          <span>
            <strong>Terms &amp; Conditions</strong>
            <small>The terms for using the loyalty club</small>
          </span>
          <ChevronRight size={18} />
        </a>

        <a href="#about-at-home-sushi">
          <Info size={18} />
          <span>
            <strong>About At Home Sushi</strong>
            <small>Quick rolls. Bold flavors. Great rewards.</small>
          </span>
          <ChevronRight size={18} />
        </a>
      </section>

      <section className="settings-card settings-legal">
        <div id="privacy-policy">
          <h2>Privacy Policy</h2>
          <p>
            We use your account details to operate your loyalty membership,
            including points, rewards, and birthday offers.
          </p>
        </div>

        <div id="terms-and-conditions">
          <h2>Terms &amp; Conditions</h2>
          <p>
            Points and rewards are subject to availability and may not be
            exchanged for cash.
          </p>
        </div>

        <div id="about-at-home-sushi">
          <h2>About At Home Sushi</h2>
          <p>
            At Home Sushi brings quick rolls, bold flavors, and a little
            extra value to every order.
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

    setStaffSession(
      data.session
    );

    setChecking(false);
  }

  async function staffLogin(e) {
    e.preventDefault();

    setBusy(true);
    setMsg('');

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

    const {
      data,
      error
    } =
      await supabase.auth.signInWithPassword({
        email,
        password
      });

    if (error) {
      setMsg(error.message);
      setBusy(false);
      return;
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
    } =
      await supabase
        .from('customers')
        .select('*')
        .eq(
          'customer_code',
          code
        )
        .maybeSingle();

    setBusy(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    if (!data) {
      setMsg(
        'Customer not found.'
      );
      return;
    }

    setCustomer(data);
    setNotes(data.notes || '');

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
      !Number.isFinite(purchase) ||
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
      Number(customer.points || 0) +
      points;

    setBusy(true);
    setMsg('');

    const {
      error: updateError
    } =
      await supabase
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
    } =
      await supabase
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
      points: newPoints
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
      setMsg(error.message);
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
    } =
      await supabase
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
    } =
      await supabase
        .from('birthday_rewards')
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
    } =
      await supabase
        .from('birthday_claims')
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
      <div className="loading-screen">

        <div className="loading-mark">
          🍣
        </div>

        <div className="loading-brand">
          AT HOME SUSHI
        </div>

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

            <form onSubmit={staffLogin}>

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

          <span>STAFF</span>

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
            onClick={findCustomer}
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
                    customer.points || 0
                  ).toFixed(2)}
                </strong>

              </div>

              <div>

                <Ticket size={18} />

                <span>
                  STAMPS
                </span>

                <strong>
                  {customer.stamps || 0}
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
              Number(amount) > 0 && (
                <p className="points-preview">
                  Points to add:{' '}
                  <strong>
                    {(
                      Number(amount) /
                      100
                    ).toFixed(2)}
                  </strong>
                </p>
              )}

            <button
              className="primary-button"
              onClick={addPoints}
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
              onClick={saveNotes}
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
   ROUTING
===================================================== */

const path =
  window.location.pathname;

createRoot(
  document.getElementById('root')
).render(
  path === '/staff'
    ? <Staff />
    : <App />
);
