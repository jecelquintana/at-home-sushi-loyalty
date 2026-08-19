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
  ArrowLeft
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
   PASSWORD
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
      const { data } = await supabase.auth.getSession();

      if (!mounted) return;

      if (data.session) {
        setSession(data.session);
        await loadProfile(data.session.user.id);
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
        await loadProfile(currentSession.user.id);
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
        <div className="loading-mark">🍣</div>
        <div className="loading-brand">AT HOME SUSHI</div>
        <div className="loading-text">Loading your loyalty club</div>
      </div>
    );
  }

  if (!session) {
    return <Auth mode={mode} setMode={setMode} />;
  }

  return (
    <Dashboard
      session={session}
      profile={profile}
      reloadProfile={() => loadProfile(session.user.id)}
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
        email,
        password
      });

      if (error) {
        setMsg(error.message);
      }

      setBusy(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
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
          .toString(36)
          .substring(2, 12)
          .toUpperCase();

      const { error: profileError } = await supabase
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
          'Your account was created, but your loyalty profile could not be created. Please contact staff.'
        );
        setBusy(false);
        return;
      }
    }

    setMsg(
      'Account created! Please check your email to confirm your account, then log in.'
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
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
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
              </>
            )}

            <div className="field">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                required
              />
            </div>

            <PasswordField
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
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

function Dashboard({ session, profile, reloadProfile }) {
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
      .order('created_at', { ascending: false })
      .limit(30);

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
      .order('id', { ascending: true })
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
        <div className="loading-brand">AT HOME SUSHI</div>
        <div className="loading-text">Preparing your loyalty card</div>
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
  const [category, setCategory] = useState('Specialty Rolls');
  const [menuIndex, setMenuIndex] = useState(0);
  const [orderOpen, setOrderOpen] = useState(false);
  const [direction, setDirection] = useState('next');

  const points = Number(profile.points || 0);

  const menuCategories = {
    'Specialty Rolls': [
      {
        name: 'Spicy Salmon Roll',
        pieces: '8 pcs',
        price: '₱219',
        ingredients:
          'Fresh salmon • Cucumber • Black & white sesame • Spicy salmon mix'
      },
      {
        name: 'California Roll',
        pieces: '8 pcs',
        price: '₱189',
        ingredients:
          'Avocado • Mango • Cucumber • Crabstick • Japanese mayo • White sesame'
      },
      {
        name: 'Green Dragon',
        pieces: '8 pcs',
        price: '₱219',
        ingredients:
          'Prawn tempura • Fresh avocado • Teriyaki • Spicy mayo • Black sesame'
      },
      {
        name: 'Shrimp Avo Roll',
        pieces: '8 pcs',
        price: '₱205',
        ingredients:
          'Prawn tempura • Avocado • White sesame seeds'
      },
      {
        name: 'Spicy California',
        pieces: '8 pcs',
        price: '₱195',
        ingredients:
          'Avocado • Mango • Cucumber • Crabstick • Japanese mayo • Togarashi'
      },
      {
        name: 'Creamy Salmon Avo',
        pieces: '8 pcs',
        price: '₱209',
        ingredients:
          'Fresh salmon • Cream cheese • Avocado • Black & white sesame'
      },
      {
        name: 'Crispy Cream',
        pieces: '8 pcs',
        price: '₱209',
        ingredients:
          'Prawn tempura • Avocado • Cucumber • Tamago • Cream cheese • Sweet chili sauce'
      },
      {
        name: 'Crunchy California',
        pieces: '8 pcs',
        price: '₱189',
        ingredients:
          'Avocado • Mango • Cucumber • Crabstick • Japanese mayo • Crispy tanuki'
      },
      {
        name: 'Chicken Katsu Roll',
        pieces: '8 pcs',
        price: '₱209',
        ingredients:
          'Chicken katsu • Cucumber • Crispy tanuki • Teriyaki • Sweet chili • Japanese mayo'
      },
      {
        name: 'Hurricane Roll',
        pieces: '8 pcs',
        price: '₱219',
        ingredients:
          'Avocado • Crabsticks • Cucumber • Crabstick salad • Spring onion • Caviar'
      },
      {
        name: 'Super California',
        pieces: '8 pcs',
        price: '₱209',
        ingredients:
          'Avocado • Mango • Cucumber • Crabstick • Japanese mayo • Caviar'
      },
      {
        name: 'Crunchy Tempura',
        pieces: '8 pcs',
        price: '₱199',
        ingredients:
          'Prawn tempura • Cucumber • Crispy tanuki • Sweet chili • Teriyaki'
      },
      {
        name: 'Sphinx Roll',
        pieces: '8 pcs',
        price: '₱219',
        ingredients:
          'Prawn tempura • Avocado • Cucumber • Fried salmon • Crispy nori • Sweet chili'
      },
      {
        name: 'Crunchy Potato',
        pieces: '8 pcs',
        price: '₱219',
        ingredients:
          'Prawn tempura • Avocado • Cucumber • Crabstick salad • Japanese mayo • Crispy potato'
      },
      {
        name: 'Passion Rainbow',
        pieces: '8 pcs',
        price: '₱219',
        ingredients:
          'Fresh salmon • Avocado • Cucumber • Crabstick • Japanese mayo • Caviar'
      },
      {
        name: 'Kani Aburi Roll',
        pieces: '8 pcs',
        price: '₱229',
        ingredients:
          'Prawn tempura • Tamago • Avocado • Seared crabstick • Spicy mayo • Teriyaki'
      },
      {
        name: 'Imperial Salmon',
        pieces: '8 pcs',
        price: '₱239',
        ingredients:
          'Prawn tempura • Mango • Cucumber • Cream cheese • Seared salmon • Spicy mayo'
      },
      {
        name: 'At Home Supreme Roll',
        pieces: '8 pcs',
        price: '₱239',
        ingredients:
          'Prawn tempura • Avocado • Tamago • Cream cheese • Seared salmon • Spicy mayo • Crispy potato'
      },
      {
        name: 'Crab Lava Roll',
        pieces: '8 pcs',
        price: '₱239',
        ingredients:
          'Tempura crabstick • Avocado • Black & white sesame • Spicy mayo crab • Crispy tanuki'
      },
      {
        name: 'Cheezy Tempura',
        pieces: '8 pcs',
        price: '₱229',
        ingredients:
          'Prawn tempura • Tamago • Carrots • Cream cheese • Seared cheddar • Japanese mayo • Teriyaki • Chips'
      },
      {
        name: 'Volcano Roll',
        pieces: '8 pcs',
        price: '₱229',
        ingredients:
          'Prawn tempura • Avocado • Cucumber • Cream cheese • Spicy mayo • Spicy prawn tempura mix • Crispy chips'
      }
    ],

    'Tempura & Seafood': [
      {
        name: 'Dynamite Shrimp',
        pieces: '—',
        price: '₱189',
        ingredients: 'Prawn tempura covered with dynamite sauce'
      },
      {
        name: 'Ebi Fry',
        pieces: '4 pcs',
        price: '₱189',
        ingredients: '4 pieces prawn tempura'
      },
      {
        name: 'Cucumber Crab Salad',
        pieces: '—',
        price: '₱179',
        ingredients:
          'Mango • Cucumber • Crabstick • Japanese mayo • Caviar'
      }
    ],

    'Veggie': [
      {
        name: 'Creamy Avo',
        pieces: '8 pcs',
        price: '₱99',
        ingredients: 'Avocado • Cream cheese'
      },
      {
        name: 'Avo Lover',
        pieces: '8 pcs',
        price: '₱119',
        ingredients:
          'Avocado inside covered with avocado'
      },
      {
        name: 'Veggie Roll',
        pieces: '8 pcs',
        price: '₱109',
        ingredients:
          'Avocado • Cucumber • Carrots • Lettuce • White sesame'
      },
      {
        name: 'Tropical Garden Roll',
        pieces: '—',
        price: '₱199',
        ingredients:
          'Mango • Cucumber • Crabstick • Avocado • Carrots • Lettuce • Rice paper • Sweet chili'
      },
      {
        name: 'Tropical Garden Roll — Veggie',
        pieces: '—',
        price: '₱159',
        ingredients:
          'Mango • Cucumber • Avocado • Carrots • Lettuce • Rice paper • Sweet chili'
      }
    ],

    'Nigiri & Sashimi': [
      {
        name: 'Tamago Nigiri',
        pieces: '2 pcs',
        price: '₱89',
        ingredients: 'Japanese omelette'
      },
      {
        name: 'Salmon Nigiri',
        pieces: '2 pcs',
        price: '₱129',
        ingredients: 'Fresh salmon'
      },
      {
        name: 'Kani Nigiri',
        pieces: '2 pcs',
        price: '₱95',
        ingredients: 'Crabstick'
      },
      {
        name: 'Sake Sashimi',
        pieces: '4 pcs',
        price: '₱219',
        ingredients: 'Fresh slices of salmon'
      },
      {
        name: 'Seared Salmon',
        pieces: '2 pcs',
        price: '₱135',
        ingredients: 'Seared salmon'
      }
    ],

    'Platters': [
      {
        name: 'Create Your Own Platter',
        pieces: '32 pcs',
        price: '₱859',
        ingredients:
          'Mix & match any 4 rolls from Classic or Specialty Rolls'
      },
      {
        name: 'Tempura Platter',
        pieces: '32 pcs',
        price: '₱759',
        ingredients:
          'Mix of tempura rolls from Classic selection'
      },
      {
        name: 'California Party Platter',
        pieces: '32 pcs',
        price: '₱689',
        ingredients:
          'Mixed California rolls'
      },
      {
        name: 'Mini Harvest Platter',
        pieces: '32 pcs',
        price: '₱959',
        ingredients:
          'Fresh salmon nigiri • Crabstick nigiri • Tropical garden roll • Seafood rolls'
      },
      {
        name: 'At Home Supreme Platter',
        pieces: '80 pcs',
        price: '₱1,699',
        ingredients:
          'Mixed sushi rolls and makis'
      },
      {
        name: 'Harvest Platter',
        pieces: '68 pcs',
        price: '₱1,899',
        ingredients:
          'Fresh salmon nigiri • Crabstick nigiri • Veggie rolls • Seafood rolls'
      }
    ]
  };

  const currentMenu =
    menuCategories[category] || [];

  const current =
    currentMenu[menuIndex] ||
    currentMenu[0];

  function changeCategory(newCategory) {
    setCategory(newCategory);
    setMenuIndex(0);
    setDirection('next');
  }

  function previousSushi() {
    setDirection('prev');

    setMenuIndex((index) =>
      index === 0
        ? currentMenu.length - 1
        : index - 1
    );
  }

  function nextSushi() {
    setDirection('next');

    setMenuIndex((index) =>
      index === currentMenu.length - 1
        ? 0
        : index + 1
    );
  }

  return (
    <div className="sushi-home">

      {/* HERO */}

      <section className="sushi-hero">

        <div className="hero-content">

          <div className="hero-brand">
            <img
              src={logo}
              alt="At Home Sushi"
            />

            <span>AT HOME SUSHI</span>
          </div>

          <h1>
            GET MORE FROM
            <span> EVERY ORDER.</span>
          </h1>

          <p>
            Every order brings you closer
            to your next reward.
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
                .getElementById('rewards-preview')
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
              <p>Enjoy your favorite sushi.</p>
            </div>
          </div>

          <div className="earn-item">
            <span>02</span>
            <div>
              <b>EARN</b>
              <p>₱100 spent = 1 Sushi Point.</p>
            </div>
          </div>

          <div className="earn-item">
            <span>03</span>
            <div>
              <b>REDEEM</b>
              <p>Turn points into rewards.</p>
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
          Discover something delicious.
        </p>


        {/* CATEGORY BUTTONS */}

        <div className="menu-categories">

          {Object.keys(menuCategories).map(
            (item) => (
              <button
                key={item}
                className={
                  category === item
                    ? 'category-active'
                    : ''
                }
                onClick={() =>
                  changeCategory(item)
                }
              >
                {item}
              </button>
            )
          )}

        </div>


        {/* SUSHI SHOWCASE */}

        {current && (
          <>
            <div className="sushi-showcase">

              <button
                className="carousel-arrow left"
                onClick={previousSushi}
                aria-label="Previous sushi"
              >
                ‹
              </button>

              <div
                className={`sushi-stage sushi-slide-${direction}`}
                key={`${category}-${current.name}-${menuIndex}`}
              >

                <div className="sushi-image-wrap">

                  <div className="sushi-photo-placeholder">
                    <span>🍣</span>
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
                {String(menuIndex + 1).padStart(2, '0')}

                <span>
                  / {String(currentMenu.length).padStart(2, '0')}
                </span>
              </div>

              <h3>
                {current.name}
              </h3>

              <p className="sushi-meta">
                {current.pieces}
                &nbsp;·&nbsp;
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
          </>
        )}

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

          {rewards.slice(0, 3).map(
            (reward, index) => (

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

            )
          )}

        </div>

      </section>


      {/* ORDER POPUP */}

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

function Rewards({ profile, rewards, onRefresh }) {
  const [selected, setSelected] = useState(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const points = Number(profile.points || 0);

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
      console.error(error);
      setMsg(error.message);
      setBusy(false);
      return;
    }

    setCode(data.redemption_code);
    setBusy(false);
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setMsg('Code copied!');
    } catch {
      setMsg('Please copy the code manually.');
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
            onClick={copyCode}
          >
            <Copy size={17} />
            Copy code
          </button>

          {msg && <div className="notice">{msg}</div>}

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
        <span className="section-label">YOUR BENEFITS</span>
        <h1>Rewards</h1>
        <p>
          You have <strong>{points.toFixed(0)} Sushi Points</strong>.
        </p>
      </div>

      <div className="reward-list">

        {rewards.map((reward) => {
          const required = Number(reward.points_required);
          const available = points >= required;
          const isSelected = selected?.id === reward.id;

          return (
            <button
              type="button"
              key={reward.id}
              className={`reward-card ${
                isSelected ? 'selected' : ''
              } ${!available ? 'locked' : ''}`}
              disabled={!available}
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

          <span className="section-label">CONFIRM REWARD</span>

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
            {busy ? 'Creating code...' : 'Generate redemption code'}
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

          {transactions.map((tx) => (
            <div className="history-card" key={tx.id}>

              <div>
                <strong>
                  {tx.transaction_type}
                </strong>

                <small>
                  {new Date(tx.created_at).toLocaleString()}
                </small>
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
    const { data } = await supabase.auth.getSession();

    setStaffSession(data.session);
    setChecking(false);
  }

  async function staffLogin(e) {
    e.preventDefault();

    setBusy(true);
    setMsg('');

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
    const code = customerCode.trim();

    setMsg('');
    setCustomer(null);

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

    if (!Number.isFinite(purchase) || purchase <= 0) {
      setMsg('Enter a valid purchase amount.');
      return;
    }

    const points = purchase / 100;
    const newPoints = Number(customer.points || 0) + points;

    setBusy(true);
    setMsg('');

    const { error: updateError } =
      await supabase
        .from('customers')
        .update({ points: newPoints })
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
    setMsg(`Success! ${points.toFixed(2)} Sushi Points added.`);
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

    const { data: claimed, error: checkError } =
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

    if (claimed) {
      setMsg('Birthday reward already claimed this year.');
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

    setMsg(`Birthday reward claimed: ${reward.reward_text}`);
    setBusy(false);
  }

  if (checking) {
    return (
      <div className="loading-screen">
        <div className="loading-mark">🍣</div>
        <div className="loading-brand">AT HOME SUSHI</div>
        <div className="loading-text">Checking staff access</div>
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
              <p>Manage customer points and rewards.</p>
            </div>

            <form onSubmit={staffLogin}>

              <div className="field">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Staff email"
                  required
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

              {msg && <div className="notice">{msg}</div>}

              <button
                className="primary-button"
                type="submit"
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
          onClick={staffLogout}
        >
          <LogOut size={18} />
        </button>

      </header>

      <main className="staff-main">

        <div className="staff-heading">
          <span>STAFF</span>
          <h1>Customer Points</h1>
          <p>Scan or enter a customer's loyalty code.</p>
        </div>

        <div className="staff-card">

          <div className="section-label">
            FIND CUSTOMER
          </div>

          <div className="field">
            <label>Customer QR / Code</label>

            <input
              value={customerCode}
              onChange={(e) => setCustomerCode(e.target.value)}
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

            <div className="section-label">
              CUSTOMER
            </div>

            <h2>{customer.full_name}</h2>

            {customer.email && (
              <p className="staff-muted">{customer.email}</p>
            )}

            {customer.phone && (
              <p className="staff-muted">{customer.phone}</p>
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
                <strong>{customer.stamps || 0}</strong>
              </div>

            </div>

            {customer.birthday && (
              <p className="staff-muted birthday-line">
                <Cake size={15} />
                Birthday:{' '}
                {new Date(customer.birthday).toLocaleDateString()}
              </p>
            )}

            <div className="staff-divider" />

            <div className="section-label">
              ADD POINTS
            </div>

            <div className="field">
              <label>Purchase amount</label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
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
              {busy ? 'Updating...' : 'Add Points'}
            </button>

            <button
              className="secondary-staff-button"
              onClick={claimBirthdayReward}
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
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this customer..."
              />
            </div>

            <button
              className="secondary-staff-button"
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

createRoot(document.getElementById('root')).render(
  path === '/staff' ? <Staff /> : <App />
);
