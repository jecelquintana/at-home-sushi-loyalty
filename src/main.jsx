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
  ChevronRight,
  ChevronLeft
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
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
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
      <div className="loading-screen">
        <div className="loading-mark">
          <span>AH</span>
        </div>
        <p>At Home Sushi</p>
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
    const savedEmail = localStorage.getItem('savedLoginEmail');

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
        localStorage.setItem('rememberLogin', 'true');
        localStorage.setItem('savedLoginEmail', email);
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
        console.error(profileError);

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
    <div className="auth-page">

      <div className="auth-brand">
        <img
          src={logo}
          alt="At Home Sushi"
          className="auth-logo"
        />

        <div className="auth-brand-name">
          AT HOME SUSHI
        </div>

        <div className="auth-brand-sub">
          LOYALTY CLUB
        </div>
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
          <h1>
            {mode === 'signup'
              ? 'Join the club'
              : 'Welcome back'}
          </h1>

          <p>
            {mode === 'signup'
              ? 'Collect Sushi Points every time you order.'
              : 'Your sushi rewards are waiting for you.'}
          </p>
        </div>

        <form onSubmit={submit}>

          {mode === 'signup' && (
            <>
              <div className="field">
                <label>Full name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Your name"
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
            </>
          )}

          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@email.com"
            />
          </div>

          <PasswordField
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {mode === 'login' && (
            <label className="remember-row">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
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
   DASHBOARD
===================================================== */

function Dashboard({ session, profile }) {
  const [birthdayReward, setBirthdayReward] = useState(null);
  const [rewards, setRewards] = useState([]);
  const [tx, setTx] = useState([]);
  const [tab, setTab] = useState('home');

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
        .order('created_at', { ascending: false })
        .limit(20);

    setTx(transactions || []);
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  if (!profile) {
    return (
      <div className="loading-screen">
        <div className="loading-mark">
          <span>AH</span>
        </div>
        <p>Preparing your loyalty club...</p>
      </div>
    );
  }

  return (
    <div className="app-shell">

      <header className="topbar">

        <div className="topbar-brand">
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
          className="logout-button"
          onClick={logout}
          aria-label="Log out"
        >
          <LogOut size={18} />
        </button>

      </header>

      <main className="page-content">

        {birthdayReward && (
          <div className="birthday-banner">
            <div className="birthday-icon">
              <Cake size={20} />
            </div>

            <div>
              <span>BIRTHDAY REWARD</span>
              <strong>{birthdayReward.name}</strong>
              <p>{birthdayReward.reward_text}</p>
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
   MENU DATA
===================================================== */

const MENU = {

  'Classic Rolls': [
    {
      name: 'California Roll',
      price: 189,
      description:
        'Avocado, mango, cucumber, crabstick and Japanese mayo, white sesame seeds',
      pieces: '8 pcs'
    },
    {
      name: 'Spicy California',
      price: 189,
      description:
        'Avocado, mango, cucumber, crabstick and Japanese mayo, togarashi',
      pieces: '8 pcs'
    },
    {
      name: 'Super California',
      price: 209,
      description:
        'Avocado, mango, cucumber, crabstick and Japanese mayo, caviar',
      pieces: '8 pcs'
    },
    {
      name: 'Crunchy California',
      price: 209,
      description:
        'Avocado, mango, cucumber, crabstick and Japanese mayo covered with crispy tanuki',
      pieces: '8 pcs'
    }
  ],

  'Specialty Rolls': [
    {
      name: 'Spicy Salmon Roll',
      price: 219,
      description:
        'Fresh salmon, cucumber, black and white sesame seeds, spicy salmon mix',
      pieces: '8 pcs'
    },
    {
      name: 'Hurricane Roll',
      price: 219,
      description:
        'Avocado, crabsticks and cucumber, deep fried, crabstick salad, spring onion and caviar',
      pieces: '8 pcs'
    },
    {
      name: 'Crunchy Tempura',
      price: 199,
      description:
        'Prawn tempura, cucumber, crispy tanuki, sweet chili sauce and teriyaki sauce',
      pieces: '8 pcs'
    },
    {
      name: 'Sphinx Roll',
      price: 219,
      description:
        'Prawn tempura, avocado, cucumber, fried salmon, crispy nori and sweet chili',
      pieces: '8 pcs'
    },
    {
      name: 'Shrimp Avo Roll',
      price: 205,
      description:
        'Prawn tempura, avocado and white sesame seeds',
      pieces: '8 pcs'
    },
    {
      name: 'Crispy Cream',
      price: 209,
      description:
        'Prawn tempura, avocado, cucumber, tamago and cream cheese, deep fried with sweet chili sauce',
      pieces: '8 pcs'
    },
    {
      name: 'Green Dragon',
      price: 219,
      description:
        'Prawn tempura, fresh avocado, teriyaki sauce, spicy mayo and black sesame seeds',
      pieces: '8 pcs'
    },
    {
      name: 'Creamy Salmon Avo',
      price: 209,
      description:
        'Fresh salmon with cream cheese and avocado, white and black sesame seeds',
      pieces: '8 pcs'
    },
    {
      name: 'Chicken Katsu Roll',
      price: 209,
      description:
        'Chicken katsu, cucumber, crispy tanuki, teriyaki sauce, sweet chili and Japanese mayo',
      pieces: '8 pcs'
    },
    {
      name: 'Crunchy Potato',
      price: 219,
      description:
        'Prawn tempura, avocado, cucumber, crabstick salad, Japanese mayo and crispy potato',
      pieces: '8 pcs'
    },
    {
      name: 'Passion Rainbow',
      price: 219,
      description:
        'Fresh salmon, avocado, cucumber, crabstick, Japanese mayo and caviar',
      pieces: '8 pcs'
    },
    {
      name: 'Kani Aburi Roll',
      price: 229,
      description:
        'Prawn tempura, tamago, avocado, seared crabstick, spicy mayo, teriyaki sauce and crispy topping',
      pieces: '8 pcs'
    },
    {
      name: 'Imperial Salmon',
      price: 239,
      description:
        'Prawn tempura, mango, cucumber, cream cheese, seared salmon and spicy mayo',
      pieces: '8 pcs'
    },
    {
      name: 'At Home Supreme Roll',
      price: 239,
      description:
        'Prawn tempura, avocado, tamago, cream cheese, seared salmon, spicy mayo and crispy potato',
      pieces: '8 pcs'
    },
    {
      name: 'Crab Lava Roll',
      price: 239,
      description:
        'Tempura crabstick and avocado, black and white sesame, spicy mayo crab and crispy tanuki',
      pieces: '8 pcs'
    },
    {
      name: 'Cheezy Tempura',
      price: 229,
      description:
        'Prawn tempura, tamago, carrots, cream cheese, seared cheddar cheese, Japanese mayo, teriyaki and chips',
      pieces: '8 pcs'
    },
    {
      name: 'Volcano Roll',
      price: 229,
      description:
        'Prawn tempura, avocado, cucumber, cream cheese, spicy mayo, spicy prawn tempura mix and crispy chips',
      pieces: '8 pcs'
    }
  ],

  'Veggie Rolls': [
    {
      name: 'Creamy Avo',
      price: 99,
      description:
        'Avocado with cream cheese',
      pieces: '8 pcs'
    },
    {
      name: 'Avo Lover',
      price: 119,
      description:
        'Avocado inside covered with avocado',
      pieces: '8 pcs'
    },
    {
      name: 'Veggie Roll',
      price: 109,
      description:
        'Avocado, cucumber, carrots, lettuce and white sesame',
      pieces: '8 pcs'
    },
    {
      name: 'Tropical Garden Roll',
      price: 159,
      description:
        'Mango, cucumber, avocado, carrots and lettuce wrapped with rice paper, drizzled with sweet chili sauce',
      pieces: '8 pcs'
    }
  ],

  'Nigiri & Sashimi': [
    {
      name: 'Tamago Nigiri',
      price: 89,
      description: 'Tamago',
      pieces: '2 pcs'
    },
    {
      name: 'Salmon Nigiri',
      price: 129,
      description: 'Fresh salmon',
      pieces: '2 pcs'
    },
    {
      name: 'Kani Nigiri',
      price: 95,
      description: 'Crabstick',
      pieces: '2 pcs'
    },
    {
      name: 'Seared Salmon',
      price: 135,
      description: 'Seared salmon',
      pieces: '2 pcs'
    },
    {
      name: 'Sake Sashimi',
      price: 219,
      description: 'Fresh slices of salmon',
      pieces: '4 pcs'
    }
  ],

  'Platters': [
    {
      name: 'Create Your Own Platter',
      price: 859,
      description:
        'Mix & match any 4 rolls from Classic or Specialty Rolls',
      pieces: '32 pcs'
    },
    {
      name: 'Tempura Platter',
      price: 759,
      description:
        'Mix of tempura rolls from Classic selection',
      pieces: '32 pcs'
    },
    {
      name: 'California Party Platter',
      price: 689,
      description:
        'Mixed California rolls',
      pieces: '32 pcs'
    },
    {
      name: 'Mini Harvest Platter',
      price: 959,
      description:
        'Fresh salmon nigiri and crabstick nigiri with Tropical Garden Roll and seafood rolls',
      pieces: '32 pcs'
    },
    {
      name: 'At Home Supreme Platter',
      price: 1699,
      description:
        'Mixed sushi rolls and makis',
      pieces: '80 pcs'
    },
    {
      name: 'Harvest Platter',
      price: 1899,
      description:
        'Fresh salmon nigiri and crabstick nigiri with veggie rolls and seafood rolls',
      pieces: '68 pcs'
    }
  ]
};

/* =====================================================
   HOME
===================================================== */

function Home({ profile, rewards }) {
  const categories = Object.keys(MENU);

  const [categoryIndex, setCategoryIndex] = useState(0);
  const [itemIndex, setItemIndex] = useState(0);
  const [direction, setDirection] = useState('next');
  const [orderOpen, setOrderOpen] = useState(false);

  const category = categories[categoryIndex];
  const items = MENU[category];
  const current = items[itemIndex];

  const points = Number(profile.points || 0);

  function changeCategory(index) {
    setCategoryIndex(index);
    setItemIndex(0);
    setDirection('next');
  }

  function previousItem() {
    setDirection('prev');

    setItemIndex((index) =>
      index === 0
        ? items.length - 1
        : index - 1
    );
  }

  function nextItem() {
    setDirection('next');

    setItemIndex((index) =>
      index === items.length - 1
        ? 0
        : index + 1
    );
  }

  return (
    <div className="sushi-home">

      {/* HERO */}

      <section className="home-hero">

        <div className="hero-inner">

          <div className="hero-small-label">
            AT HOME SUSHI
          </div>

          <h1>
            GOOD SUSHI.
            <br />
            <span>GREAT REWARDS.</span>
          </h1>

          <p>
            Every order brings you closer
            to your next reward.
          </p>

          <div className="hero-buttons">

            <button
              className="hero-button dark"
              onClick={() =>
                document
                  .getElementById('menu-section')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              Explore our sushi
              <ChevronRight size={17} />
            </button>

            <button
              className="hero-button light"
              onClick={() =>
                document
                  .getElementById('points-section')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              My Sushi Points
            </button>

          </div>

        </div>

      </section>

      {/* POINTS */}

      <section
        id="points-section"
        className="home-section points-area"
      >

        <div className="section-label">
          YOUR LOYALTY
        </div>

        <h2>Your Sushi Points</h2>

        <p className="section-description">
          Every order brings you closer to
          something delicious.
        </p>

        <div className="points-card">

          <div>
            <span>YOUR BALANCE</span>

            <strong>
              {points.toFixed(0)}
            </strong>

            <small>
              SUSHI POINTS
            </small>
          </div>

          <button
            onClick={() =>
              document
                .getElementById('rewards-section')
                ?.scrollIntoView({ behavior: 'smooth' })
            }
            aria-label="View rewards"
          >
            <ChevronRight size={21} />
          </button>

        </div>

        <div className="earn-row">

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

      {/* MENU */}

      <section
        id="menu-section"
        className="home-section menu-area"
      >

        <div className="section-label">
          FROM OUR KITCHEN
        </div>

        <h2>Our Menu</h2>

        <p className="section-description">
          Discover something delicious.
        </p>

        {/* CATEGORY BUTTONS */}

        <div className="menu-categories">

          {categories.map((name, index) => (
            <button
              key={name}
              className={
                index === categoryIndex
                  ? 'active'
                  : ''
              }
              onClick={() => changeCategory(index)}
            >
              {name}
            </button>
          ))}

        </div>

        {/* CAROUSEL */}

        <div className="menu-carousel">

          <button
            className="carousel-button"
            onClick={previousItem}
            aria-label="Previous item"
          >
            <ChevronLeft size={20} />
          </button>

          <div
            className={`menu-item-card ${
              direction === 'next'
                ? 'slide-next'
                : 'slide-prev'
            }`}
            key={`${category}-${current.name}-${itemIndex}`}
          >

            <div className="sushi-photo">
              <div className="photo-mark">
                <span>🍣</span>
              </div>
            </div>

            <div className="menu-item-info">

              <div className="menu-item-top">

                <span className="pieces">
                  {current.pieces}
                </span>

                <strong>
                  ₱{current.price}
                </strong>

              </div>

              <h3>
                {current.name}
              </h3>

              <p>
                {current.description}
              </p>

              <button
                className="order-item-button"
                onClick={() => setOrderOpen(true)}
              >
                Order this
                <ChevronRight size={17} />
              </button>

            </div>

          </div>

          <button
            className="carousel-button"
            onClick={nextItem}
            aria-label="Next item"
          >
            <ChevronRight size={20} />
          </button>

        </div>

        <div className="menu-counter">
          {String(itemIndex + 1).padStart(2, '0')}
          <span>
            / {String(items.length).padStart(2, '0')}
          </span>
        </div>

      </section>

      {/* REWARDS */}

      <section
        id="rewards-section"
        className="home-section rewards-area"
      >

        <div className="section-label">
          YOUR BENEFITS
        </div>

        <h2>Rewards</h2>

        <p className="section-description">
          A little something for every
          sushi lover.
        </p>

        <div className="home-rewards">

          {rewards.slice(0, 3).map((reward, index) => (

            <div
              className="home-reward"
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

          {rewards.length === 0 && (
            <div className="empty-home-rewards">
              Rewards will appear here once
              they are added.
            </div>
          )}

        </div>

      </section>

      {/* ORDER POPUP */}

      {orderOpen && (

        <div
          className="order-overlay"
          onClick={() => setOrderOpen(false)}
        >

          <div
            className="order-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <button
              className="modal-close"
              onClick={() => setOrderOpen(false)}
              aria-label="Close"
            >
              <X size={19} />
            </button>

            <div className="modal-label">
              {current.name}
            </div>

            <h2>
              HOW WOULD YOU
              <br />
              LIKE TO ORDER?
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
                <span className="simple-chat-icon">•••</span>
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
    <div className="simple-page">

      <div className="page-heading">
        <span>YOUR MEMBERSHIP</span>
        <h1>My Card</h1>
      </div>

      <div className="digital-card">

        <div className="digital-card-top">
          <span>AT HOME SUSHI</span>
          <b>LOYALTY CLUB</b>
        </div>

        <div className="qr-box">
          <QRCodeSVG
            value={profile.customer_code || ''}
            size={190}
            includeMargin
          />
        </div>

        <h2>
          {profile.full_name}
        </h2>

        <p className="member-code">
          {profile.customer_code}
        </p>

        <div className="digital-balances">

          <div>
            <span>SUSHI POINTS</span>
            <strong>
              {Number(profile.points || 0).toFixed(0)}
            </strong>
          </div>

          <div>
            <span>STAMPS</span>
            <strong>
              {profile.stamps || 0}
            </strong>
          </div>

        </div>

        <p className="card-note">
          Show your QR code at checkout.
        </p>

      </div>

    </div>
  );
}

/* =====================================================
   REWARDS
===================================================== */

function Rewards({ profile, rewards }) {
  const [showRedeem, setShowRedeem] = useState(false);

  if (showRedeem) {
    return (
      <RedeemPoints
        profile={profile}
        rewards={rewards}
        onClose={() => setShowRedeem(false)}
      />
    );
  }

  return (
    <div className="simple-page">

      <div className="page-heading">
        <span>YOUR BENEFITS</span>
        <h1>Rewards</h1>
      </div>

      <div className="points-summary">
        <span>AVAILABLE SUSHI POINTS</span>
        <strong>
          {Number(profile.points || 0).toFixed(0)}
        </strong>
      </div>

      {rewards.length > 0 ? (
        <div className="reward-list-clean">

          {rewards.map((reward) => (

            <div
              className="reward-card-clean"
              key={reward.id}
            >

              <div className="reward-number">
                <Gift size={19} />
              </div>

              <div className="reward-copy">

                <h3>
                  {reward.name}
                </h3>

                <p>
                  {reward.description || ''}
                </p>

              </div>

              <strong>
                {reward.points_required}
                <small>pts</small>
              </strong>

            </div>

          ))}

        </div>
      ) : (
        <div className="empty-card">
          No rewards available yet.
        </div>
      )}

      {rewards.length > 0 && (
        <button
          className="primary-button redeem-main-button"
          onClick={() => setShowRedeem(true)}
        >
          <Gift size={18} />
          Use My Points
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
  const [selectedReward, setSelectedReward] = useState(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const points = Number(profile.points || 0);

  async function createRedemption() {
    if (!selectedReward) {
      setMsg('Please select a reward.');
      return;
    }

    const requiredPoints =
      Number(selectedReward.points_required);

    if (points < requiredPoints) {
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
          points_used: requiredPoints,
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

    setCode(data.redemption_code);
    setBusy(false);
  }

  async function copyCode() {
    await navigator.clipboard.writeText(code);
    setMsg('Code copied!');
  }

  if (code) {
    return (
      <div className="simple-page redeem-page">

        <button
          className="back-button"
          onClick={onClose}
        >
          <ChevronLeft size={17} />
          Rewards
        </button>

        <div className="redemption-success">

          <CheckCircle size={48} />

          <span>REDEMPTION CODE</span>

          <h1>
            Show this code to staff
          </h1>

          <p>
            Keep this screen open until
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

        </div>

      </div>
    );
  }

  return (
    <div className="simple-page redeem-page">

      <button
        className="back-button"
        onClick={onClose}
      >
        <ChevronLeft size={17} />
        Rewards
      </button>

      <div className="page-heading">
        <span>REDEEM</span>
        <h1>Use Points</h1>
      </div>

      <p className="redeem-intro">
        Select a reward you have enough
        points for.
      </p>

      <div className="reward-list-clean">

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
              className={`reward-card-clean selectable ${
                selected ? 'selected' : ''
              }`}
              disabled={!available}
              onClick={() =>
                available &&
                setSelectedReward(reward)
              }
            >

              <div className="reward-number">
                <Gift size={19} />
              </div>

              <div className="reward-copy">
                <h3>{reward.name}</h3>

                <p>
                  {reward.description || ''}
                </p>
              </div>

              <strong>
                {required}
                <small>pts</small>
              </strong>

            </button>
          );
        })}

      </div>

      {selectedReward && (
        <div className="redeem-confirm">

          <span>
            SELECTED REWARD
          </span>

          <h3>
            {selectedReward.name}
          </h3>

          <p>
            This will create a redemption
            code for{' '}
            <b>
              {selectedReward.points_required} points.
            </b>
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
              ? 'Creating code...'
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
    <div className="simple-page">

      <div className="page-heading">
        <span>YOUR ACTIVITY</span>
        <h1>History</h1>
      </div>

      {tx.length === 0 ? (
        <div className="empty-card">
          <History size={25} />
          <p>No transactions yet.</p>
        </div>
      ) : (
        <div className="history-list">

          {tx.map((transaction) => (

            <div
              className="history-item"
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
                +
                {Number(
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
  const [staffSession, setStaffSession] = useState(null);
  const [checking, setChecking] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [remember, setRemember] = useState(
    localStorage.getItem('staffRemember') === 'true'
  );

  const [customerCode, setCustomerCode] = useState('');
  const [customer, setCustomer] = useState(null);

  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

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
      localStorage.setItem('staffRemember', 'true');
    } else {
      localStorage.removeItem('staffRemember');
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

    const code = customerCode.trim();

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

    setMsg(`Customer found: ${data.full_name}`);
  }

  async function addPoints() {
    if (!customer) {
      setMsg('Find a customer first.');
      return;
    }

    const purchase = parseFloat(amount);

    if (Number.isNaN(purchase) || purchase <= 0) {
      setMsg('Enter a valid purchase amount.');
      return;
    }

    const points = purchase / 100;

    setBusy(true);
    setMsg('');

    const newPoints =
      Number(customer.points || 0) + points;

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
      `Success! ${points.toFixed(2)} points added.`
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
      setMsg('This customer has no birthday saved.');
      return;
    }

    const today = new Date();
    const birthday = new Date(customer.birthday);

    const isBirthday =
      today.getMonth() === birthday.getMonth() &&
      today.getDate() === birthday.getDate();

    if (!isBirthday) {
      setMsg('Today is not this customer’s birthday.');
      return;
    }

    const year = today.getFullYear();

    setBusy(true);
    setMsg('');

    const { data: alreadyClaimed, error: checkError } =
      await supabase
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

    const { data: reward, error: rewardError } =
      await supabase
        .from('birthday_rewards')
        .select('*')
        .eq('active', true)
        .order('id', { ascending: true })
        .limit(1)
        .maybeSingle();

    if (rewardError) {
      setMsg(rewardError.message);
      setBusy(false);
      return;
    }

    if (!reward) {
      setMsg('No active birthday reward found.');
      setBusy(false);
      return;
    }

    const { error: claimError } =
      await supabase
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
      <div className="loading-screen">
        <div className="loading-mark">
          <span>AH</span>
        </div>
        <p>Checking staff access...</p>
      </div>
    );
  }

  if (!staffSession) {
    return (
      <div className="auth-page">

        <div className="auth-brand">

          <img
            src={logo}
            alt="At Home Sushi"
            className="auth-logo"
          />

          <div className="auth-brand-name">
            AT HOME SUSHI
          </div>

          <div className="auth-brand-sub">
            STAFF ACCESS
          </div>

        </div>

        <div className="auth-card">

          <div className="auth-heading">
            <h1>Staff Login</h1>
            <p>
              Sign in to manage customer points.
            </p>
          </div>

          <form onSubmit={staffLogin}>

            <div className="field">
              <label>Email</label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Staff email"
              />
            </div>

            <PasswordField
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Staff password"
            />

            <label className="remember-row">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
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
              <LogIn size={18} />
              {busy ? 'Logging in...' : 'Log in'}
            </button>

          </form>

        </div>

      </div>
    );
  }

  return (
    <div className="staff-shell">

      <header className="topbar">

        <div className="topbar-brand">

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
          className="logout-button"
          onClick={staffLogout}
        >
          <LogOut size={18} />
        </button>

      </header>

      <main className="staff-content">

        <div className="page-heading">
          <span>STAFF</span>
          <h1>Add Customer Points</h1>
        </div>

        <div className="staff-card">

          <div className="field">
            <label>Customer QR / Code</label>

            <input
              value={customerCode}
              onChange={(e) =>
                setCustomerCode(e.target.value)
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
            {busy ? 'Finding...' : 'Find Customer'}
          </button>

        </div>

        {customer && (
          <div className="staff-card customer-card">

            <span className="card-label">
              CUSTOMER
            </span>

            <h2>
              {customer.full_name}
            </h2>

            {customer.email && (
              <p>{customer.email}</p>
            )}

            {customer.phone && (
              <p>{customer.phone}</p>
            )}

            <div className="staff-balances">

              <div>
                <Star size={18} />
                <span>CURRENT POINTS</span>
                <strong>
                  {Number(
                    customer.points || 0
                  ).toFixed(2)}
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
              <p className="customer-birthday">
                <Cake size={15} />
                Birthday:{' '}
                {new Date(
                  customer.birthday
                ).toLocaleDateString()}
              </p>
            )}

            <div className="staff-divider" />

            <div className="field">
              <label>Purchase Amount</label>

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
                  <b>
                    {(Number(amount) / 100).toFixed(2)}
                  </b>
                </p>
              )}

            <button
              className="primary-button"
              onClick={addPoints}
              disabled={busy}
            >
              <PlusCircle size={18} />
              {busy ? 'Updating...' : 'Add Points'}
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={claimBirthdayReward}
              disabled={busy}
            >
              <Cake size={17} />
              Claim Birthday Reward
            </button>

            <div className="staff-divider" />

            <div className="field">
              <label>
                <FileText size={14} />
                Customer Notes
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
              className="secondary-button"
              onClick={saveNotes}
              disabled={busy}
            >
              {busy ? 'Saving...' : 'Save Notes'}
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
