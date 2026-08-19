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
  ArrowRight,
  Sparkles
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
   LOADING SCREEN
===================================================== */

function LoadingScreen({ text = 'Loading...' }) {
  return (
    <div className="screen">
      <div className="loading-mark">
        <span />
        <span />
        <span />
      </div>

      <p>{text}</p>
    </div>
  );
}

/* =====================================================
   PASSWORD FIELD
===================================================== */

function PasswordField({
  value,
  onChange,
  placeholder = 'At least 8 characters'
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="field-group">
      <label>Password</label>

      <div className="password-wrap">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          required
          minLength={8}
          placeholder={placeholder}
        />

        <button
          type="button"
          className="password-toggle"
          onClick={() => setShow(!show)}
          aria-label={
            show ? 'Hide password' : 'Show password'
          }
        >
          {show ? (
            <EyeOff size={18} />
          ) : (
            <Eye size={18} />
          )}
        </button>
      </div>
    </div>
  );
}

/* =====================================================
   MAIN CUSTOMER APP
===================================================== */

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);

        if (currentSession) {
          loadProfile(currentSession.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function checkSession() {
    const { data } = await supabase.auth.getSession();

    if (data.session) {
      setSession(data.session);
      await loadProfile(data.session.user.id);
    } else {
      setLoading(false);
    }
  }

  async function loadProfile(id) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Customer profile error:', error);
    }

    setProfile(data || null);
    setLoading(false);
  }

  if (loading) {
    return (
      <LoadingScreen text="Loading At Home Sushi..." />
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

  const [remember, setRemember] = useState(
    localStorage.getItem('rememberLogin') === 'true'
  );

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const savedEmail =
      localStorage.getItem('savedLoginEmail');

    if (savedEmail) {
      setEmail(savedEmail);
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
        localStorage.removeItem('rememberLogin');
        localStorage.removeItem('savedLoginEmail');
      }

      const { error } =
        await supabase.auth.signInWithPassword({
          email,
          password
        });

      if (error) {
        setMsg(error.message);
      }

      setBusy(false);
      return;
    }

    const { data, error } =
      await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            phone,
            birthday
          }
        }
      });

    if (error) {
      setMsg(error.message);
      setBusy(false);
      return;
    }

    if (data.user) {
      const customerCode =
        Math.random()
          .toString(16)
          .substring(2, 12)
          .toUpperCase();

      const { error: profileError } =
        await supabase
          .from('customers')
          .insert({
            id: data.user.id,
            full_name: name,
            phone: phone || null,
            email,
            birthday: birthday || null,
            points: 0,
            stamps: 0,
            customer_code: customerCode
          });

      if (profileError) {
        console.error(
          'Customer creation error:',
          profileError
        );

        setMsg(
          'Account created, but your loyalty profile could not be created. Please contact staff.'
        );

        setBusy(false);
        return;
      }
    }

    setMsg(
      'Account created! Check your email to confirm your account, then log in.'
    );

    setBusy(false);
  }

  return (
    <div className="auth-wrap">

      <div className="auth-brand">

        <div className="auth-logo-wrap">
          <img
            src={logo}
            className="auth-logo"
            alt="At Home Sushi"
          />
        </div>

        <h1>AT HOME SUSHI</h1>

        <p>LOYALTY CLUB</p>

      </div>

      <div className="card auth-card">

        <div className="tabs">

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
            <LogIn size={17} />
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
            <UserPlus size={17} />
            Join
          </button>

        </div>

        <div className="auth-heading">

          <h2>
            {mode === 'signup'
              ? 'Join the Loyalty Club'
              : 'Welcome back'}
          </h2>

          <p>
            {mode === 'signup'
              ? 'Collect Sushi Points every time you order.'
              : 'Your sushi rewards are waiting for you.'}
          </p>

        </div>

        <form onSubmit={submit}>

          {mode === 'signup' && (
            <>
              <div className="field-group">
                <label>Full name</label>

                <input
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  required
                  placeholder="Your name"
                />
              </div>

              <div className="field-group">
                <label>Phone number</label>

                <input
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
                  }
                  placeholder="09xxxxxxxxx"
                />
              </div>

              <div className="field-group">
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

          <div className="field-group">
            <label>Email</label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
              placeholder="you@email.com"
            />
          </div>

          <PasswordField
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
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

              <span>Remember me</span>

            </label>
          )}

          {msg && (
            <div className="notice">
              {msg}
            </div>
          )}

          <button
            className="primary"
            disabled={busy}
            type="submit"
          >
            {busy
              ? 'Please wait...'
              : mode === 'signup'
              ? 'Create my account'
              : 'Log in'}

            {!busy && (
              <ArrowRight size={17} />
            )}
          </button>

        </form>

        {mode === 'login' && (
          <p className="switch">
            New here?{' '}

            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setMsg('');
              }}
            >
              Join the club
            </button>
          </p>
        )}

      </div>

      <p className="auth-footer">
        Quick Rolls. Bold Flavors. Great Rewards.
      </p>

    </div>
  );
}

/* =====================================================
   CUSTOMER DASHBOARD
===================================================== */

function Dashboard({
  session,
  profile
}) {
  const [birthdayReward, setBirthdayReward] =
    useState(null);

  const [rewards, setRewards] =
    useState([]);

  const [tx, setTx] =
    useState([]);

  const [tab, setTab] =
    useState('home');

  useEffect(() => {
    if (profile) {
      checkBirthdayReward();
    }
  }, [profile]);

  useEffect(() => {
    loadDashboard();
  }, [session.user.id]);

  async function checkBirthdayReward() {
    if (!profile?.birthday) return;

    const today = new Date();
    const birthday = new Date(profile.birthday);

    const isBirthday =
      today.getMonth() === birthday.getMonth() &&
      today.getDate() === birthday.getDate();

    if (!isBirthday) return;

    const year = today.getFullYear();

    const { data: alreadyClaimed } =
      await supabase
        .from('birthday_claims')
        .select('id')
        .eq('customer_id', profile.id)
        .eq('birthday_year', year)
        .maybeSingle();

    if (alreadyClaimed) return;

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

  async function loadDashboard() {
    const { data: rewardsData } =
      await supabase
        .from('rewards')
        .select('*')
        .eq('active', true)
        .order('points_required');

    setRewards(rewardsData || []);

    const { data: transactions } =
      await supabase
        .from('transactions')
        .select('*')
        .eq(
          'customer_id',
          session.user.id
        )
        .order('created_at', {
          ascending: false
        })
        .limit(20);

    setTx(transactions || []);
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  if (!profile) {
    return (
      <LoadingScreen text="Preparing your loyalty card..." />
    );
  }

  return (
    <div className="app">

      <header className="topbar">

        <div className="topbar-brand">

          <img
            src={logo}
            alt="At Home Sushi"
          />

          <div>
            <b>AT HOME SUSHI</b>
            <span>LOYALTY CLUB</span>
          </div>

        </div>

        <button
          className="iconbtn"
          onClick={logout}
          title="Log out"
        >
          <LogOut size={18} />
        </button>

      </header>

      <main>

        {birthdayReward && (
          <div className="birthday-banner">

            <div className="birthday-icon">
              <Cake size={20} />
            </div>

            <div>
              <span className="eyebrow">
                BIRTHDAY REWARD
              </span>

              <h2>
                {birthdayReward.name}
              </h2>

              <p>
                {birthdayReward.description}
              </p>

              <strong>
                {birthdayReward.reward_text}
              </strong>
            </div>

          </div>
        )}

        {tab === 'home' && (
          <Home
            profile={profile}
            rewards={rewards}
          />
        )}

        {tab === 'card' && (
          <DigitalCard profile={profile} />
        )}

        {tab === 'rewards' && (
          <Rewards
            profile={profile}
            rewards={rewards}
          />
        )}

        {tab === 'history' && (
          <HistoryTab tx={tx} />
        )}

      </main>

      <nav className="nav">

        <button
          className={
            tab === 'home'
              ? 'sel'
              : ''
          }
          onClick={() => setTab('home')}
        >
          <Star size={19} />
          <span>Home</span>
        </button>

        <button
          className={
            tab === 'card'
              ? 'sel'
              : ''
          }
          onClick={() => setTab('card')}
        >
          <QrCode size={19} />
          <span>My Card</span>
        </button>

        <button
          className={
            tab === 'rewards'
              ? 'sel'
              : ''
          }
          onClick={() => setTab('rewards')}
        >
          <Gift size={19} />
          <span>Rewards</span>
        </button>

        <button
          className={
            tab === 'history'
              ? 'sel'
              : ''
          }
          onClick={() => setTab('history')}
        >
          <History size={19} />
          <span>History</span>
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
  rewards
}) {
  const [menuIndex, setMenuIndex] =
    useState(0);

  const [orderOpen, setOrderOpen] =
    useState(false);

  const points =
    Number(profile.points || 0);

  const menu = [
    {
      name: 'California Roll',
      pieces: '8 pcs',
      price: '₱189',
      ingredients:
        'Avocado • Mango • Cucumber • Crabstick • Japanese Mayo',
      image: '/sushi/california-roll.png'
    },
    {
      name: 'Green Dragon Roll',
      pieces: '8 pcs',
      price: '₱219',
      ingredients:
        'Prawn Tempura • Fresh Avocado • Teriyaki • Spicy Mayo',
      image: '/sushi/green-dragon-roll.png'
    },
    {
      name: 'Volcano Roll',
      pieces: '8 pcs',
      price: '₱229',
      ingredients:
        'Prawn Tempura • Avocado • Cucumber • Spicy Prawn Tempura Mix',
      image: '/sushi/volcano-roll.png'
    },
    {
      name: 'Super California',
      pieces: '8 pcs',
      price: '₱209',
      ingredients:
        'Avocado • Mango • Cucumber • Crabstick • Japanese Mayo • Caviar',
      image: '/sushi/super-california-roll.png'
    }
  ];

  const current =
    menu[menuIndex];

  function previousSushi() {
    setMenuIndex((index) =>
      index === 0
        ? menu.length - 1
        : index - 1
    );
  }

  function nextSushi() {
    setMenuIndex((index) =>
      index === menu.length - 1
        ? 0
        : index + 1
    );
  }

  return (
    <div className="sushi-home">

      {/* HERO */}

      <section className="sushi-hero">

        <div className="hero-content">

          <span className="hero-kicker">
            AT HOME SUSHI
          </span>

          <h1>
            GOOD SUSHI.
            <br />
            <span>GREAT REWARDS.</span>
          </h1>

          <p>
            Earn Sushi Points with every
            order and enjoy rewards along
            the way.
          </p>

          <div className="hero-actions">

            <button
              className="glass-button dark-glass"
              onClick={() =>
                document
                  .getElementById('sushi-menu')
                  ?.scrollIntoView({
                    behavior: 'smooth'
                  })
              }
            >
              Explore Our Sushi
              <ChevronRight size={17} />
            </button>

            <button
              className="glass-button light-glass"
              onClick={() =>
                document
                  .getElementById('sushi-points')
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

      {/* SUSHI POINTS */}

      <section
        id="sushi-points"
        className="points-section"
      >

        <div className="section-kicker">
          YOUR LOYALTY
        </div>

        <h2>
          YOUR SUSHI POINTS
        </h2>

        <p className="section-intro">
          Every order brings you closer
          to something delicious.
        </p>

        <div className="points-glass-card">

          <div>

            <span>
              CURRENT BALANCE
            </span>

            <strong>
              {points.toFixed(0)}
            </strong>

            <small>
              SUSHI POINTS
            </small>

          </div>

          <button
            className="bubble-arrow"
            onClick={() =>
              document
                .getElementById(
                  'rewards-preview'
                )
                ?.scrollIntoView({
                  behavior: 'smooth'
                })
            }
          >
            <ChevronRight size={20} />
          </button>

        </div>

        <div className="earn-grid">

          <div className="earn-item">
            <span>01</span>

            <div>
              <b>ORDER</b>
              <p>
                Enjoy your favorite sushi.
              </p>
            </div>
          </div>

          <div className="earn-item">
            <span>02</span>

            <div>
              <b>EARN</b>
              <p>
                ₱100 spent = 1 Sushi Point.
              </p>
            </div>
          </div>

          <div className="earn-item">
            <span>03</span>

            <div>
              <b>REDEEM</b>
              <p>
                Turn points into rewards.
              </p>
            </div>
          </div>

        </div>

      </section>

      {/* MENU */}

      <section
        id="sushi-menu"
        className="menu-section"
      >

        <div className="section-kicker">
          FROM OUR KITCHEN
        </div>

        <h2>
          EXPLORE OUR SUSHI
        </h2>

        <p className="section-intro">
          A few favorites from At Home Sushi.
        </p>

        <div className="sushi-showcase">

          <button
            className="carousel-arrow left"
            onClick={previousSushi}
            aria-label="Previous sushi"
          >
            ‹
          </button>

          <div
            className="sushi-stage"
            key={current.name}
          >

            <div className="sushi-image-wrap">

              <img
                src={current.image}
                alt={current.name}
                className="sushi-image"
                onError={(e) => {
                  e.currentTarget.style.display =
                    'none';

                  e.currentTarget.parentElement.classList.add(
                    'photo-missing'
                  );
                }}
              />

              <div className="photo-placeholder">
                <span>
                  <Sparkles size={24} />
                </span>

                <small>
                  SUSHI PHOTO
                </small>
              </div>

            </div>

          </div>

          <button
            className="carousel-arrow right"
            onClick={nextSushi}
            aria-label="Next sushi"
          >
            ›
          </button>

        </div>

        <div className="sushi-details">

          <div className="sushi-counter">
            {String(
              menuIndex + 1
            ).padStart(2, '0')}

            <span>
              / {String(
                menu.length
              ).padStart(2, '0')}
            </span>
          </div>

          <h3>
            {current.name}
          </h3>

          <p className="sushi-meta">
            {current.pieces}
            {' · '}
            {current.price}
          </p>

          <p className="ingredients">
            {current.ingredients}
          </p>

          <button
            className="order-bubble"
            onClick={() =>
              setOrderOpen(true)
            }
          >
            ORDER THIS
            <ChevronRight size={17} />
          </button>

        </div>

      </section>

      {/* REWARDS */}

      <section
        id="rewards-preview"
        className="rewards-section"
      >

        <div className="section-kicker">
          YOUR BENEFITS
        </div>

        <h2>
          REWARDS
        </h2>

        <p className="section-intro">
          A little something for every
          sushi lover.
        </p>

        <div className="modern-rewards">

          {rewards
            .slice(0, 3)
            .map((reward, index) => (

              <div
                className="modern-reward"
                key={reward.id}
              >

                <span>
                  0{index + 1}
                </span>

                <div>

                  <h3>
                    {reward.name}
                  </h3>

                  <p>
                    {reward.description ||
                      'Use your Sushi Points for this reward.'}
                  </p>

                </div>

                <strong>
                  {reward.points_required}
                </strong>

              </div>

            ))}

        </div>

      </section>

      {/* ORDER MODAL */}

      {orderOpen && (
        <div
          className="order-overlay"
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

            <div className="section-kicker">
              {current.name}
            </div>

            <h2>
              HOW WOULD YOU
              <br />
              LIKE TO ORDER?
            </h2>

            <p>
              Choose where you'd like
              to place your order.
            </p>

            <a
              className="order-option"
              href="https://www.ordermo.ph/restaurants/at-home-sushi/M8y6MG8S?n=QXQgSG9tZSBTdXNoaQ==&p=cG5n&c=anBn"
              target="_blank"
              rel="noopener noreferrer"
            >

              <span className="order-option-icon">
                <ShoppingBag
                  size={20}
                  strokeWidth={1.7}
                />
              </span>

              <span>
                <b>ORDER ONLINE</b>
                <small>OrderMo</small>
              </span>

              <ChevronRight size={18} />

            </a>

            <a
              className="order-option"
              href="https://www.facebook.com/athomesushibustos"
              target="_blank"
              rel="noopener noreferrer"
            >

              <span className="order-option-icon">
                <MessageCircle
                  size={20}
                  strokeWidth={1.7}
                />
              </span>

              <span>
                <b>ORDER VIA FACEBOOK</b>
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
    <div className="container center">

      <div className="card digital">

        <span className="eyebrow">
          AT HOME SUSHI
        </span>

        <h2>
          LOYALTY CARD
        </h2>

        <div className="qr">

          <QRCodeSVG
            value={
              profile.customer_code || ''
            }
            size={190}
            includeMargin
          />

        </div>

        <h3>
          {profile.full_name}
        </h3>

        <p className="code">
          {profile.customer_code}
        </p>

        <div className="balance-grid">

          <div className="mini">
            <small>POINTS</small>

            <b>
              {Number(
                profile.points || 0
              ).toFixed(2)}
            </b>
          </div>

          <div className="mini">
            <small>STAMPS</small>

            <b>
              {profile.stamps || 0}
            </b>
          </div>

        </div>

        <p className="muted">
          Show this QR code at checkout.
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
  rewards
}) {
  return (
    <div className="container">

      <div className="page-title">
        <Gift
          size={22}
          strokeWidth={1.7}
        />

        <h1>
          Rewards
        </h1>
      </div>

      <p className="muted">
        You have{' '}
        <b>
          {Number(
            profile.points || 0
          ).toFixed(2)}{' '}
          Sushi Points
        </b>.
      </p>

      <div className="reward-list">

        {rewards.map((reward) => (

          <div
            className="card reward"
            key={reward.id}
          >

            <div className="reward-icon">
              <Gift size={20} />
            </div>

            <div>

              <b>
                {reward.name}
              </b>

              <p>
                {reward.description || ''}
              </p>

            </div>

            <strong>
              {reward.points_required}
              {' '}
              pts
            </strong>

          </div>

        ))}

      </div>

    </div>
  );
}

/* =====================================================
   HISTORY
===================================================== */

function HistoryTab({ tx }) {
  return (
    <div className="container">

      <div className="page-title">
        <History size={22} />
        <h1>History</h1>
      </div>

      {tx.length === 0 ? (

        <div className="card empty">

          <History size={28} />

          <p>
            No transactions yet.
          </p>

        </div>

      ) : (

        <div className="reward-list">

          {tx.map((transaction) => (

            <div
              className="card reward"
              key={transaction.id}
            >

              <div>

                <b>
                  {transaction.transaction_type}
                </b>

                <p>
                  {new Date(
                    transaction.created_at
                  ).toLocaleString()}
                </p>

              </div>

              <strong>
                +
                {Number(
                  transaction.points_earned || 0
                ).toFixed(2)}
              </strong>

            </div>

          ))}

        </div>

      )}

    </div>
  );
}

/* =====================================================
   STAFF APP
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

    setStaffSession(data.session);
    setChecking(false);
  }

  async function staffLogin(e) {
    e.preventDefault();

    setMsg('');
    setBusy(true);

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

  async function staffLogout() {
    await supabase.auth.signOut();
    setStaffSession(null);
  }

  async function findCustomer() {
    setMsg('');
    setCustomer(null);

    const code =
      customerCode.trim();

    if (!code) {
      setMsg(
        'Please enter the customer QR code.'
      );
      return;
    }

    setBusy(true);

    const { data, error } =
      await supabase
        .from('customers')
        .select('*')
        .eq('customer_code', code)
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
      Number.isNaN(purchase) ||
      purchase <= 0
    ) {
      setMsg(
        'Enter a valid purchase amount.'
      );
      return;
    }

    const points =
      purchase / 100;

    setBusy(true);
    setMsg('');

    const newPoints =
      Number(customer.points || 0) +
      points;

    const { error: updateError } =
      await supabase
        .from('customers')
        .update({
          points: newPoints
        })
        .eq('id', customer.id);

    if (updateError) {
      setMsg(updateError.message);
      setBusy(false);
      return;
    }

    const { error: transactionError } =
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
      `Success! ${points.toFixed(2)} points added.`
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
        .eq('id', customer.id);

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

    const today = new Date();

    const birthday =
      new Date(customer.birthday);

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
      data: alreadyClaimed,
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
      setMsg(checkError.message);
      setBusy(false);
      return;
    }

    if (alreadyClaimed) {
      setMsg(
        'Birthday reward has already been claimed this year.'
      );
      setBusy(false);
      return;
    }

    const {
      data: reward,
      error: rewardError
    } = await supabase
      .from('birthday_rewards')
      .select('*')
      .eq('active', true)
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
      <LoadingScreen text="Checking staff access..." />
    );
  }

  if (!staffSession) {
    return (
      <div className="auth-wrap">

        <div className="auth-brand">

          <div className="auth-logo-wrap staff-logo-wrap">
            <img
              src={logo}
              className="auth-logo"
              alt="At Home Sushi"
            />
          </div>

          <h1>
            AT HOME SUSHI
          </h1>

          <p>
            STAFF ACCESS
          </p>

        </div>

        <div className="card auth-card">

          <div className="auth-heading">

            <h2>
              Staff Login
            </h2>

            <p>
              Manage customer points and rewards.
            </p>

          </div>

          <form onSubmit={staffLogin}>

            <div className="field-group">

              <label>
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                required
                placeholder="Staff email"
              />

            </div>

            <PasswordField
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
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
              type="submit"
              className="primary"
              disabled={busy}
            >

              <LogIn size={18} />

              {busy
                ? 'Logging in...'
                : 'Log in'}

            </button>

          </form>

        </div>

      </div>
    );
  }

  return (
    <div className="app">

      <header className="topbar">

        <div className="topbar-brand">

          <img
            src={logo}
            alt="At Home Sushi"
          />

          <div>
            <b>AT HOME SUSHI</b>
            <span>STAFF PANEL</span>
          </div>

        </div>

        <button
          className="iconbtn"
          onClick={staffLogout}
          title="Log out"
        >
          <LogOut size={18} />
        </button>

      </header>

      <main className="container">

        <div className="staff-page-heading">

          <span className="section-kicker">
            STAFF
          </span>

          <h1>
            Customer Loyalty
          </h1>

          <p className="muted">
            Scan or enter a customer code
            to manage their Sushi Points.
          </p>

        </div>

        {/* FIND CUSTOMER */}

        <div className="card staff-card">

          <div className="card-heading">

            <div className="card-heading-icon">
              <ScanLine size={19} />
            </div>

            <div>
              <h3>
                Find Customer
              </h3>

              <p>
                Enter the customer QR code.
              </p>
            </div>

          </div>

          <div className="field-group">

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
            type="button"
            className="primary"
            onClick={findCustomer}
            disabled={busy}
          >

            <ScanLine size={18} />

            {busy
              ? 'Finding...'
              : 'Find Customer'}

          </button>

        </div>

        {/* CUSTOMER */}

        {customer && (
          <div className="card staff-card">

            <span className="eyebrow">
              CUSTOMER
            </span>

            <h2>
              {customer.full_name}
            </h2>

            {customer.email && (
              <p className="muted">
                {customer.email}
              </p>
            )}

            {customer.phone && (
              <p className="muted">
                {customer.phone}
              </p>
            )}

            <div
              className="balance-grid"
              style={{
                marginTop: 18
              }}
            >

              <div className="balance">

                <Star size={18} />

                <small>
                  CURRENT POINTS
                </small>

                <strong>
                  {Number(
                    customer.points || 0
                  ).toFixed(2)}
                </strong>

              </div>

              <div className="balance">

                <Ticket size={18} />

                <small>
                  STAMPS
                </small>

                <strong>
                  {customer.stamps || 0}
                </strong>

              </div>

            </div>

            {customer.birthday && (
              <p className="muted staff-birthday">

                <Cake size={15} />

                Birthday:{' '}

                {new Date(
                  customer.birthday
                ).toLocaleDateString()}

              </p>
            )}

            <div className="staff-divider" />

            {/* ADD POINTS */}

            <div className="field-group">

              <label>
                Purchase Amount
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
                <div className="points-preview">
                  <span>
                    Points to add
                  </span>

                  <strong>
                    {(
                      Number(amount) /
                      100
                    ).toFixed(2)}
                  </strong>
                </div>
              )}

            <button
              type="button"
              className="primary"
              onClick={addPoints}
              disabled={busy}
            >

              <PlusCircle size={18} />

              {busy
                ? 'Updating...'
                : 'Add Points'}

            </button>

            {/* BIRTHDAY */}

            <button
              type="button"
              className="birthday-button"
              onClick={
                claimBirthdayReward
              }
              disabled={busy}
            >

              <Cake
                size={17}
                strokeWidth={1.7}
              />

              Claim Birthday Reward

            </button>

            {/* NOTES */}

            <div className="staff-notes">

              <div className="card-heading">

                <div className="card-heading-icon">
                  <FileText size={18} />
                </div>

                <div>
                  <h3>
                    Customer Notes
                  </h3>

                  <p>
                    Add notes for future orders.
                  </p>
                </div>

              </div>

              <textarea
                value={notes}
                onChange={(e) =>
                  setNotes(
                    e.target.value
                  )
                }
                placeholder="Add notes about this customer..."
              />

              <button
                type="button"
                className="primary"
                onClick={saveNotes}
                disabled={busy}
              >
                {busy
                  ? 'Saving...'
                  : 'Save Notes'}
              </button>

            </div>

          </div>
        )}

        {msg && (
          <div className="notice staff-message">
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
