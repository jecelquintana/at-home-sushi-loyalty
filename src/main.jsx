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
  ChevronRight
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
   PASSWORD FIELD
===================================================== */

function PasswordField({
  value,
  onChange,
  placeholder = 'At least 8 characters'
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
          required
          minLength={8}
          placeholder={placeholder}
        />

        <button
          type="button"
          className="password-toggle"
          onClick={() => setShow(!show)}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? (
            <EyeOff size={18} strokeWidth={1.6} />
          ) : (
            <Eye size={18} strokeWidth={1.6} />
          )}
        </button>
      </div>
    </div>
  );
}

/* =====================================================
   LOADING
===================================================== */

function LoadingScreen({ text = 'Loading...' }) {
  return (
    <div className="loading-screen">
      <div className="loading-mark">🍣</div>
      <p>{text}</p>
    </div>
  );
}

/* =====================================================
   CUSTOMER APP
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
      console.error('Customer profile:', error);
    }

    setProfile(data || null);
    setLoading(false);
  }

  if (loading) {
    return (
      <LoadingScreen text="Loading your loyalty club..." />
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
   CUSTOMER AUTH
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

    setMode('login');
    setBusy(false);
  }

  return (
    <div className="auth-page">

      <div className="auth-brand">

        <img
          src={logo}
          className="auth-logo"
          alt="At Home Sushi"
        />

        <h1>AT HOME SUSHI</h1>

        <p>LOYALTY CLUB</p>

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
            {mode === 'signup'
              ? 'Join the Loyalty Club'
              : 'Welcome back'}
          </h2>

          <p>
            {mode === 'signup'
              ? 'Collect Sushi Points every time you order.'
              : 'Check your points, rewards and loyalty card.'}
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
                  required
                  placeholder="Your name"
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
            className="primary-button"
            disabled={busy}
            type="submit"
          >
            {busy
              ? 'Please wait...'
              : mode === 'signup'
              ? 'Create my account'
              : 'Log in'}
          </button>

        </form>

        {mode === 'login' && (
          <p className="auth-switch">
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

function Dashboard({ session, profile }) {
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
        .order('id', { ascending: true })
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
        .eq('customer_id', session.user.id)
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
          className="header-icon"
          onClick={logout}
          aria-label="Log out"
        >
          <LogOut size={18} />
        </button>

      </header>

      <main className="app-content">

        {birthdayReward && (
          <div className="birthday-banner">

            <div>
              <span className="small-label">
                <Cake size={14} />
                BIRTHDAY REWARD
              </span>

              <h3>{birthdayReward.name}</h3>

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

      </nav>

    </div>
  );
}

/* =====================================================
   HOME
===================================================== */

function Home({ profile, rewards }) {
  const [menuIndex, setMenuIndex] = useState(0);
  const [orderOpen, setOrderOpen] = useState(false);

  const points = Number(profile.points || 0);

  const menu = [
    {
      name: 'Spicy Salmon Roll',
      pieces: '8 pcs',
      price: '₱219',
      ingredients:
        'Fresh salmon • Cucumber • Black & white sesame • Spicy salmon mix',
      image: '/sushi/spicy-salmon-roll.png'
    },
    {
      name: 'California Roll',
      pieces: '8 pcs',
      price: '₱189',
      ingredients:
        'Avocado • Mango • Cucumber • Crabstick • Japanese mayo',
      image: '/sushi/california-roll.png'
    },
    {
      name: 'Green Dragon',
      pieces: '8 pcs',
      price: '₱209',
      ingredients:
        'Prawn tempura • Fresh avocado • Teriyaki • Spicy mayo',
      image: '/sushi/green-dragon-roll.png'
    },
    {
      name: 'Shrimp Avo Roll',
      pieces: '8 pcs',
      price: '₱205',
      ingredients:
        'Prawn tempura • Avocado • White sesame seeds',
      image: '/sushi/shrimp-avo-roll.png'
    },
    {
      name: 'Spicy California',
      pieces: '8 pcs',
      price: '₱195',
      ingredients:
        'Avocado • Mango • Cucumber • Crabstick • Japanese mayo • Togarashi',
      image: '/sushi/spicy-california.png'
    },
    {
      name: 'Crispy Cream',
      pieces: '8 pcs',
      price: '₱209',
      ingredients:
        'Prawn tempura • Avocado • Cucumber • Tamago • Cream cheese',
      image: '/sushi/crispy-cream.png'
    },
    {
      name: 'Crunchy California',
      pieces: '8 pcs',
      price: '₱189',
      ingredients:
        'California roll covered with crispy tanuki',
      image: '/sushi/crunchy-california.png'
    },
    {
      name: 'Chicken Katsu Roll',
      pieces: '8 pcs',
      price: '₱209',
      ingredients:
        'Chicken katsu • Cucumber • Crispy tanuki • Teriyaki • Sweet chili',
      image: '/sushi/chicken-katsu-roll.png'
    },
    {
      name: 'Hurricane Roll',
      pieces: '8 pcs',
      price: '₱219',
      ingredients:
        'Avocado • Crabsticks • Cucumber • Crabstick salad • Spring onion • Caviar',
      image: '/sushi/hurricane-roll.png'
    },
    {
      name: 'Super California',
      pieces: '8 pcs',
      price: '₱209',
      ingredients:
        'Avocado • Mango • Cucumber • Crabstick • Japanese mayo • Caviar',
      image: '/sushi/super-california.png'
    },
    {
      name: 'Crunchy Tempura',
      pieces: '8 pcs',
      price: '₱199',
      ingredients:
        'Prawn tempura • Cucumber • Crispy tanuki • Sweet chili • Teriyaki',
      image: '/sushi/crunchy-tempura.png'
    },
    {
      name: 'Sphinx Roll',
      pieces: '8 pcs',
      price: '₱219',
      ingredients:
        'Prawn tempura • Avocado • Cucumber • Fried salmon • Crispy nori',
      image: '/sushi/sphinx-roll.png'
    },
    {
      name: 'Crunchy Potato',
      pieces: '8 pcs',
      price: '₱219',
      ingredients:
        'Prawn tempura • Avocado • Cucumber • Crabstick salad • Crispy potato',
      image: '/sushi/crunchy-potato.png'
    },
    {
      name: 'Passion Rainbow',
      pieces: '8 pcs',
      price: '₱219',
      ingredients:
        'Fresh salmon • Avocado • Cucumber • Crabstick • Japanese mayo • Caviar',
      image: '/sushi/passion-rainbow.png'
    },
    {
      name: 'Kani Aburi Roll',
      pieces: '8 pcs',
      price: '₱229',
      ingredients:
        'Prawn tempura • Tamago • Avocado • Seared crabstick • Spicy mayo',
      image: '/sushi/kani-aburi-roll.png'
    },
    {
      name: 'Imperial Salmon',
      pieces: '8 pcs',
      price: '₱239',
      ingredients:
        'Prawn tempura • Mango • Cucumber • Cream cheese • Seared salmon',
      image: '/sushi/imperial-salmon.png'
    },
    {
      name: 'At Home Supreme Roll',
      pieces: '8 pcs',
      price: '₱239',
      ingredients:
        'Prawn tempura • Avocado • Tamago • Cream cheese • Seared salmon • Crispy potato',
      image: '/sushi/at-home-supreme-roll.png'
    },
    {
      name: 'Crab Lava Roll',
      pieces: '8 pcs',
      price: '₱239',
      ingredients:
        'Tempura crabstick • Avocado • Spicy mayo crab • Crispy tanuki',
      image: '/sushi/crab-lava-roll.png'
    },
    {
      name: 'Cheezy Tempura',
      pieces: '8 pcs',
      price: '₱229',
      ingredients:
        'Prawn tempura • Tamago • Carrots • Cream cheese • Cheddar cheese',
      image: '/sushi/cheezy-tempura.png'
    },
    {
      name: 'Volcano Roll',
      pieces: '8 pcs',
      price: '₱229',
      ingredients:
        'Prawn tempura • Avocado • Cucumber • Cream cheese • Spicy prawn mix',
      image: '/sushi/volcano-roll.png'
    }
  ];

  const current = menu[menuIndex];

  function previousSushi() {
    setMenuIndex((index) =>
      index === 0 ? menu.length - 1 : index - 1
    );
  }

  function nextSushi() {
    setMenuIndex((index) =>
      index === menu.length - 1 ? 0 : index + 1
    );
  }

  return (
    <div className="home-page">

      <section className="home-hero">

        <div className="hero-inner">

          <span className="hero-kicker">
            AT HOME SUSHI
          </span>

          <h1>
            More sushi.
            <br />
            More rewards.
          </h1>

          <p>
            Earn Sushi Points every time
            you order your favorites.
          </p>

          <div className="hero-buttons">

            <button
              className="dark-button"
              onClick={() =>
                document
                  .getElementById('menu')
                  ?.scrollIntoView({
                    behavior: 'smooth'
                  })
              }
            >
              Explore Sushi
              <ChevronRight size={16} />
            </button>

            <button
              className="outline-button"
              onClick={() =>
                document
                  .getElementById('points')
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
        id="points"
        className="home-section points-section"
      >

        <span className="section-label">
          YOUR LOYALTY
        </span>

        <h2>Your Sushi Points</h2>

        <p className="section-description">
          Every order brings you closer
          to something delicious.
        </p>

        <div className="points-card">

          <div>
            <span>AVAILABLE BALANCE</span>

            <strong>
              {points.toFixed(0)}
            </strong>

            <small>SUSHI POINTS</small>
          </div>

          <Star
            size={28}
            strokeWidth={1.4}
          />

        </div>

        <div className="earn-steps">

          <div>
            <span>01</span>
            <b>ORDER</b>
            <p>Enjoy your favorite sushi.</p>
          </div>

          <div>
            <span>02</span>
            <b>EARN</b>
            <p>₱100 spent = 1 Sushi Point.</p>
          </div>

          <div>
            <span>03</span>
            <b>REDEEM</b>
            <p>Turn points into rewards.</p>
          </div>

        </div>

      </section>

      <section
        id="menu"
        className="home-section menu-section"
      >

        <span className="section-label">
          FROM OUR KITCHEN
        </span>

        <h2>Explore Our Sushi</h2>

        <p className="section-description">
          Some of our favorites, made fresh
          for every order.
        </p>

        <div className="menu-carousel">

          <button
            className="carousel-button"
            onClick={previousSushi}
            aria-label="Previous"
          >
            ‹
          </button>

          <div className="menu-photo">

            <img
              src={current.image}
              alt={current.name}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement.classList.add(
                  'photo-fallback'
                );
              }}
            />

            <div className="photo-fallback-content">
              <span>🍣</span>
              <small>At Home Sushi</small>
            </div>

          </div>

          <button
            className="carousel-button"
            onClick={nextSushi}
            aria-label="Next"
          >
            ›
          </button>

        </div>

        <div className="menu-info">

          <span className="menu-number">
            {String(menuIndex + 1).padStart(2, '0')}
            {' / '}
            {String(menu.length).padStart(2, '0')}
          </span>

          <h3>{current.name}</h3>

          <div className="menu-price">
            {current.pieces}
            <span>•</span>
            {current.price}
          </div>

          <p>{current.ingredients}</p>

          <button
            className="order-button"
            onClick={() => setOrderOpen(true)}
          >
            Order This
            <ChevronRight size={17} />
          </button>

        </div>

      </section>

      <section className="home-section rewards-preview">

        <span className="section-label">
          YOUR BENEFITS
        </span>

        <h2>Rewards</h2>

        <p className="section-description">
          A little something for every
          sushi lover.
        </p>

        <div className="preview-rewards">

          {rewards.slice(0, 3).map((reward, index) => (
            <div
              className="preview-reward"
              key={reward.id}
            >

              <span>
                0{index + 1}
              </span>

              <div>
                <h3>{reward.name}</h3>

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

      {orderOpen && (
        <div
          className="modal-overlay"
          onClick={() => setOrderOpen(false)}
        >

          <div
            className="order-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <button
              className="modal-close"
              onClick={() => setOrderOpen(false)}
            >
              <X size={18} />
            </button>

            <span className="section-label">
              {current.name}
            </span>

            <h2>
              How would you
              <br />
              like to order?
            </h2>

            <p>
              Choose how you'd like to
              order your sushi.
            </p>

            <a
              className="order-option"
              href="https://www.ordermo.ph/restaurants/at-home-sushi/M8y6MG8S?n=QXQgSG9tZSBTdXNoaQ==&p=cG5n&c=anBn"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="order-option-icon">
                <ShoppingBag size={19} />
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
                <MessageCircle size={19} />
              </span>

              <span>
                <b>ORDER VIA FACEBOOK</b>
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

      <div className="digital-card">

        <span className="section-label">
          AT HOME SUSHI
        </span>

        <h1>My Loyalty Card</h1>

        <div className="qr-box">
          <QRCodeSVG
            value={profile.customer_code || ''}
            size={190}
            includeMargin
          />
        </div>

        <h2>{profile.full_name}</h2>

        <p className="customer-code">
          {profile.customer_code}
        </p>

        <div className="balance-cards">

          <div>
            <small>SUSHI POINTS</small>
            <strong>
              {Number(profile.points || 0).toFixed(0)}
            </strong>
          </div>

          <div>
            <small>STAMPS</small>
            <strong>
              {profile.stamps || 0}
            </strong>
          </div>

        </div>

        <p className="card-help">
          Show this QR code at checkout.
        </p>

      </div>

    </div>
  );
}

/* =====================================================
   REWARDS
===================================================== */

function Rewards({ profile, rewards }) {
  const [redeeming, setRedeeming] = useState(false);

  if (redeeming) {
    return (
      <RedeemPoints
        profile={profile}
        rewards={rewards}
        onClose={() => setRedeeming(false)}
      />
    );
  }

  return (
    <div className="page-container">

      <div className="page-heading">

        <div>
          <span className="section-label">
            YOUR BENEFITS
          </span>

          <h1>Rewards</h1>
        </div>

        <Gift size={24} strokeWidth={1.5} />

      </div>

      <p className="page-intro">
        You have{' '}
        <strong>
          {Number(profile.points || 0).toFixed(0)}
        </strong>{' '}
        Sushi Points.
      </p>

      <div className="reward-list">

        {rewards.map((reward) => (
          <div
            className="reward-card"
            key={reward.id}
          >

            <div className="reward-icon">
              <Gift size={20} />
            </div>

            <div className="reward-content">

              <h3>{reward.name}</h3>

              <p>
                {reward.description ||
                  'Use your Sushi Points for this reward.'}
              </p>

              <span>
                {reward.points_required} points
              </span>

            </div>

          </div>
        ))}

      </div>

      {rewards.length > 0 && (
        <button
          className="primary-button redeem-main-button"
          onClick={() => setRedeeming(true)}
        >
          <Gift size={18} />
          Use My Sushi Points
        </button>
      )}

    </div>
  );
}

/* =====================================================
   REDEEM POINTS
===================================================== */

function RedeemPoints({
  profile,
  rewards,
  onClose
}) {
  const [selectedReward, setSelectedReward] =
    useState(null);

  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const points = Number(profile.points || 0);

  async function createRedemption() {
    if (!selectedReward) {
      setMsg('Please select a reward.');
      return;
    }

    const required =
      Number(selectedReward.points_required);

    if (points < required) {
      setMsg('You do not have enough points.');
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

    const { data, error } =
      await supabase
        .from('point_redemptions')
        .insert({
          customer_id: profile.id,
          reward_id: selectedReward.id,
          points_used: required,
          redemption_code: redemptionCode,
          status: 'pending'
        })
        .select()
        .single();

    if (error) {
      console.error('Redemption error:', error);
      setMsg(error.message);
      setBusy(false);
      return;
    }

    setCode(data.redemption_code);
    setBusy(false);
  }

  async function copyCode() {
    await navigator.clipboard.writeText(code);
    setMsg('Code copied!');
  }

  if (code) {
    return (
      <div className="page-container">

        <div className="redemption-success">

          <CheckCircle
            size={48}
            strokeWidth={1.4}
          />

          <span className="section-label">
            REDEMPTION CODE
          </span>

          <h1>Show this code to staff</h1>

          <p>
            Do not close this screen until
            staff confirms your redemption.
          </p>

          <div className="redemption-code">
            {code}
          </div>

          <button
            className="primary-button"
            onClick={copyCode}
          >
            <Copy size={17} />
            Copy Code
          </button>

          {msg && (
            <div className="notice">
              {msg}
            </div>
          )}

          <button
            className="secondary-button"
            onClick={onClose}
          >
            Back to Rewards
          </button>

        </div>

      </div>
    );
  }

  return (
    <div className="page-container">

      <div className="page-heading">

        <div>
          <span className="section-label">
            REDEEM
          </span>

          <h1>Use Points</h1>
        </div>

        <button
          className="header-icon"
          onClick={onClose}
        >
          <X size={19} />
        </button>

      </div>

      <p className="page-intro">
        Available balance:{' '}
        <strong>
          {points.toFixed(0)} Sushi Points
        </strong>
      </p>

      <div className="reward-list">

        {rewards.map((reward) => {

          const required =
            Number(reward.points_required);

          const available =
            points >= required;

          const selected =
            selectedReward?.id === reward.id;

          return (
            <button
              type="button"
              key={reward.id}
              className={`redeem-reward ${
                selected ? 'selected' : ''
              }`}
              disabled={!available}
              onClick={() =>
                available &&
                setSelectedReward(reward)
              }
            >

              <div className="reward-icon">
                <Gift size={19} />
              </div>

              <div>
                <strong>{reward.name}</strong>

                <p>
                  {reward.description || ''}
                </p>

                <span>
                  {required} points
                </span>
              </div>

              {!available && (
                <small>Not enough</small>
              )}

            </button>
          );
        })}

      </div>

      {selectedReward && (
        <div className="redeem-confirm">

          <span className="section-label">
            CONFIRM REWARD
          </span>

          <h3>
            Redeem {selectedReward.name}?
          </h3>

          <p>
            This will create a redemption
            code for{' '}
            <strong>
              {selectedReward.points_required}
              {' '}points.
            </strong>
          </p>

          <p>
            Your points will only be deducted
            after staff confirms the redemption.
          </p>

          {msg && (
            <div className="notice">
              {msg}
            </div>
          )}

          <button
            className="primary-button"
            onClick={createRedemption}
            disabled={busy}
          >
            {busy
              ? 'Creating Code...'
              : 'Generate Redemption Code'}
          </button>

        </div>
      )}

    </div>
  );
}

/* =====================================================
   HISTORY
===================================================== */

function HistoryTab({ tx }) {
  return (
    <div className="page-container">

      <div className="page-heading">

        <div>
          <span className="section-label">
            YOUR ACTIVITY
          </span>

          <h1>History</h1>
        </div>

        <History
          size={24}
          strokeWidth={1.5}
        />

      </div>

      {tx.length === 0 ? (
        <div className="empty-state">

          <History size={34} />

          <p>No transactions yet.</p>

        </div>
      ) : (
        <div className="transaction-list">

          {tx.map((transaction) => (
            <div
              className="transaction"
              key={transaction.id}
            >

              <div>
                <strong>
                  {transaction.transaction_type}
                </strong>

                <span>
                  {new Date(
                    transaction.created_at
                  ).toLocaleString()}
                </span>
              </div>

              <b>
                +{Number(
                  transaction.points_earned || 0
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
      localStorage.getItem('staffRemember') === 'true'
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
      setMsg('Please enter the customer QR code.');
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
      setMsg('Customer not found.');
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
      setMsg('Find a customer first.');
      return;
    }

    const purchase =
      parseFloat(amount);

    if (
      Number.isNaN(purchase) ||
      purchase <= 0
    ) {
      setMsg('Enter a valid purchase amount.');
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
          customer_id: customer.id,
          transaction_type: 'purchase',
          points_earned: points
        });

    if (transactionError) {
      setMsg(transactionError.message);
      setBusy(false);
      return;
    }

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
    if (!customer) {
      setMsg('Find a customer first.');
      return;
    }

    setBusy(true);
    setMsg('');

    const { error } =
      await supabase
        .from('customers')
        .update({ notes })
        .eq('id', customer.id);

    if (error) {
      setMsg(error.message);
    } else {
      setCustomer({
        ...customer,
        notes
      });

      setMsg('Customer notes saved.');
    }

    setBusy(false);
  }

  async function claimBirthdayReward() {
    if (!customer) {
      setMsg('Find a customer first.');
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
      today.getMonth() === birthday.getMonth() &&
      today.getDate() === birthday.getDate();

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
      .eq('customer_id', customer.id)
      .eq('birthday_year', year)
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
      setMsg(rewardError.message);
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
        customer_id: customer.id,
        birthday_year: year
      });

    if (claimError) {
      setMsg(claimError.message);
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
      <div className="auth-page">

        <div className="auth-brand">

          <img
            src={logo}
            className="auth-logo staff-auth-logo"
            alt="At Home Sushi"
          />

          <h1>AT HOME SUSHI</h1>

          <p>STAFF ACCESS</p>

        </div>

        <div className="auth-card">

          <div className="auth-heading">

            <h2>Staff Login</h2>

            <p>
              Sign in to manage customer
              loyalty points.
            </p>

          </div>

          <form onSubmit={staffLogin}>

            <div className="field">
              <label>Email</label>

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
                  setRemember(e.target.checked)
                }
              />

              <span>Remember me</span>

            </label>

            {msg && (
              <div className="notice">
                {msg}
              </div>
            )}

            <button
              type="submit"
              className="primary-button"
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
            <span>STAFF PANEL</span>
          </div>

        </div>

        <button
          className="header-icon"
          onClick={staffLogout}
        >
          <LogOut size={18} />
        </button>

      </header>

      <main className="staff-container">

        <div className="staff-heading">

          <span>STAFF</span>

          <h1>
            Customer Loyalty
          </h1>

          <p>
            Scan or enter a customer's
            loyalty code to manage points.
          </p>

        </div>

        <div className="staff-card">

          <span className="section-label">
            FIND CUSTOMER
          </span>

          <div className="field">

            <label>
              Customer QR / Code
            </label>

            <input
              value={customerCode}
              onChange={(e) =>
                setCustomerCode(e.target.value)
              }
              placeholder="Enter customer code"
            />

          </div>

          <button
            type="button"
            className="primary-button"
            onClick={findCustomer}
            disabled={busy}
          >
            <ScanLine size={17} />

            {busy
              ? 'Finding...'
              : 'Find Customer'}
          </button>

        </div>

        {customer && (
          <div className="staff-card customer-card">

            <span className="section-label">
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

            <div className="staff-balances">

              <div>
                <Star size={18} />

                <span>CURRENT POINTS</span>

                <strong>
                  {Number(
                    customer.points || 0
                  ).toFixed(0)}
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

            {customer.birthday && (
              <p className="muted birthday-info">

                <Cake size={15} />

                Birthday:{' '}

                {new Date(
                  customer.birthday
                ).toLocaleDateString()}

              </p>
            )}

            <div className="staff-divider" />

            <span className="section-label">
              ADD POINTS
            </span>

            <div className="field">

              <label>
                Purchase Amount
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) =>
                  setAmount(e.target.value)
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
                      Number(amount) / 100
                    ).toFixed(2)}
                  </strong>
                </p>
              )}

            <button
              type="button"
              className="primary-button"
              onClick={addPoints}
              disabled={busy}
            >
              <PlusCircle size={17} />

              {busy
                ? 'Updating...'
                : 'Add Points'}
            </button>

            <button
              type="button"
              className="birthday-button"
              onClick={claimBirthdayReward}
              disabled={busy}
            >
              <Cake size={17} />

              Claim Birthday Reward
            </button>

            <div className="staff-divider" />

            <span className="section-label">
              CUSTOMER NOTES
            </span>

            <div className="field">

              <label>
                <FileText size={14} />
                Notes
              </label>

              <textarea
                value={notes}
                onChange={(e) =>
                  setNotes(e.target.value)
                }
                placeholder="Add notes about this customer..."
              />

            </div>

            <button
              type="button"
              className="secondary-button"
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

const path = window.location.pathname;

createRoot(
  document.getElementById('root')
).render(
  path === '/staff'
    ? <Staff />
    : <App />
);
