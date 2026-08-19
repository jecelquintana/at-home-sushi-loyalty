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
  X
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
    <div>
      <label>Password</label>

      <div style={{ position: 'relative' }}>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          required
          minLength={8}
          placeholder={placeholder}
          style={{ paddingRight: '48px' }}
        />

        <button
          type="button"
          onClick={() => setShow(!show)}
          title={show ? 'Hide password' : 'Show password'}
          style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-35%)',
            border: '0',
            background: 'transparent',
            color: '#999',
            padding: '5px',
            cursor: 'pointer'
          }}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
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
      <div className="screen">
        <div className="loader">🍣</div>
        <p>Loading At Home Sushi Loyalty Club...</p>
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
   CUSTOMER LOGIN / SIGNUP
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
          'Account created, but customer profile could not be created. Please contact staff.'
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

      <div className="brand">

        <img
          src={logo}
          className="logo"
          alt="At Home Sushi"
        />

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

        <h2>
          {mode === 'signup'
            ? 'Join the Loyalty Club'
            : 'Welcome back!'}
        </h2>

        <p className="muted">
          {mode === 'signup'
            ? 'Collect points every time you enjoy At Home Sushi.'
            : 'Check your points, stamps and rewards.'}
        </p>

        <form onSubmit={submit}>

          {mode === 'signup' && (
            <>
              <label>
                Full name

                <input
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  required
                  placeholder="Your name"
                />
              </label>

              <label>
                Phone number

                <input
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
                  }
                  placeholder="09xxxxxxxxx"
                />
              </label>

              <label>
                Birthday

                <input
                  type="date"
                  value={birthday}
                  onChange={(e) =>
                    setBirthday(e.target.value)
                  }
                />
              </label>
            </>
          )}

          <label>
            Email

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
              placeholder="you@email.com"
            />
          </label>

          <PasswordField
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
          />

          {mode === 'login' && (
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '14px',
                fontWeight: '500',
                color: '#999',
                cursor: 'pointer'
              }}
            >
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) =>
                  setRemember(e.target.checked)
                }
              />

              Remember me
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

      <p className="footer">
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
      <div className="screen">
        <p>
          Creating your loyalty card...
        </p>
      </div>
    );
  }

  return (
    <div className="app">

      <header className="topbar">

        <div>
          <b>🍣 AT HOME SUSHI</b>
          <span>LOYALTY CLUB</span>
        </div>

        <button
          className="iconbtn"
          onClick={logout}
        >
          <LogOut size={19} />
        </button>

      </header>

      <main>

        {birthdayReward && (
          <div className="birthday-banner">
            <div>
              <span className="eyebrow">
                🎂 BIRTHDAY REWARD
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
          <DigitalCard
            profile={profile}
          />
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
          <Star />
          Home
        </button>

        <button
          className={
            tab === 'card'
              ? 'sel'
              : ''
          }
          onClick={() => setTab('card')}
        >
          <QrCode />
          My Card
        </button>

        <button
          className={
            tab === 'rewards'
              ? 'sel'
              : ''
          }
          onClick={() => setTab('rewards')}
        >
          <Gift />
          Rewards
        </button>

        <button
          className={
            tab === 'history'
              ? 'sel'
              : ''
          }
          onClick={() => setTab('history')}
        >
          <History />
          History
        </button>

      </nav>

    </div>
  );
}

/* =====================================================
   HOME
===================================================== */

function Home({ profile, rewards }) {
  const points = Number(profile.points || 0);

  const next = rewards.find(
    (reward) => Number(reward.points_required) > points
  );

  const sushiMenu = [
    {
      name: 'California Roll',
      price: '₱189',
      pieces: '8 pcs',
      ingredients: 'Crab • Cucumber • Japanese Mayo',
      emoji: '🍣'
    },
    {
      name: 'Volcano Roll',
      price: '₱229',
      pieces: '8 pcs',
      ingredients: 'Crab • Cucumber • Spicy Sauce',
      emoji: '🍣'
    },
    {
      name: 'Cheezy Tempura Roll',
      price: '₱219',
      pieces: '8 pcs',
      ingredients: 'Tempura • Cheese • Special Sauce',
      emoji: '🍣'
    },
    {
      name: 'Green Dragon Roll',
      price: '₱249',
      pieces: '8 pcs',
      ingredients: 'Tempura • Avocado • Special Sauce',
      emoji: '🍣'
    }
  ];

  const [selectedSushi, setSelectedSushi] = useState(0);

  const sushi = sushiMenu[selectedSushi];

  function previousSushi() {
    setSelectedSushi((current) =>
      current === 0
        ? sushiMenu.length - 1
        : current - 1
    );
  }

  function nextSushi() {
    setSelectedSushi((current) =>
      current === sushiMenu.length - 1
        ? 0
        : current + 1
    );
  }

  return (
    <div className="container sushi-home">

      {/* =================================================
          HERO
      ================================================= */}

      <section className="sushi-hero">

        <p className="sushi-kicker">
          AT HOME SUSHI LOYALTY CLUB
        </p>

        <h1>
          GET MORE FROM
          <br />
          EVERY ORDER
        </h1>

        <p className="sushi-subtitle">
          Every order brings you closer
          to your next reward.
        </p>

      </section>


      {/* =================================================
          SUSHI POINTS
      ================================================= */}

      <section className="points-card">

        <div className="points-content">

          <span>
            YOUR SUSHI POINTS
          </span>

          <strong>
            {points.toFixed(2)}
          </strong>

          <p>
            Keep ordering. Keep earning.
          </p>

        </div>

        <div className="points-mark">
          🍣
        </div>

      </section>


      {/* =================================================
          SUSHI MENU
      ================================================= */}

      <section className="menu-section">

        <div className="menu-heading">

          <div>
            <span className="sushi-kicker">
              FROM OUR MENU
            </span>

            <h2>
              Pick your favorite
            </h2>
          </div>

          <span className="menu-count">
            {selectedSushi + 1} / {sushiMenu.length}
          </span>

        </div>


        <div className="sushi-carousel">

          <button
            type="button"
            className="sushi-arrow left"
            onClick={previousSushi}
          >
            ‹
          </button>


          <div className="sushi-stage">

            <div className="sushi-glow" />

            <div
              key={sushi.name}
              className="sushi-placeholder"
            >
              <span>
                {sushi.emoji}
              </span>
            </div>

          </div>


          <button
            type="button"
            className="sushi-arrow right"
            onClick={nextSushi}
          >
            ›
          </button>

        </div>


        <div
          key={`${sushi.name}-info`}
          className="sushi-info"
        >

          <h2>
            {sushi.name}
          </h2>

          <div className="sushi-meta">

            <strong>
              {sushi.price}
            </strong>

            <span>
              {sushi.pieces}
            </span>

          </div>

          <p>
            {sushi.ingredients}
          </p>

          <button
            type="button"
            className="order-button"
            onClick={() => {
              alert(
                `Order ${sushi.name} — we'll connect this to your ordering system next.`
              );
            }}
          >
            ORDER THIS
          </button>

        </div>


        <div className="sushi-dots">

          {sushiMenu.map((item, index) => (

            <button
              key={item.name}
              type="button"
              className={
                selectedSushi === index
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setSelectedSushi(index)
              }
              aria-label={`View ${item.name}`}
            />

          ))}

        </div>

      </section>


      {/* =================================================
          NEXT REWARD
      ================================================= */}

      {next && (
        <section className="next-reward-card">

          <div className="next-reward-top">

            <span>
              NEXT REWARD
            </span>

            <b>
              {(
                Number(next.points_required) -
                points
              ).toFixed(2)}{' '}
              pts to go
            </b>

          </div>

          <div className="reward-progress">

            <i
              style={{
                width: `${Math.min(
                  100,
                  (points /
                    Number(next.points_required)) *
                    100
                )}%`
              }}
            />

          </div>

          <h3>
            {next.name}
          </h3>

          <p>
            {next.description ||
              'You are getting closer to your next reward.'}
          </p>

        </section>
      )}


      {/* =================================================
          HOW IT WORKS
      ================================================= */}

      <section className="how-section">

        <span className="sushi-kicker">
          YOUR SUSHI POINTS
        </span>

        <h2>
          Simple. Rewarding.
        </h2>

        <div className="how-grid">

          <div className="how-item">

            <span className="how-number">
              01
            </span>

            <h3>
              ORDER
            </h3>

            <p>
              Enjoy your favorite
              At Home Sushi.
            </p>

          </div>

          <div className="how-item">

            <span className="how-number">
              02
            </span>

            <h3>
              EARN
            </h3>

            <p>
              Collect Sushi Points
              with every purchase.
            </p>

          </div>

          <div className="how-item">

            <span className="how-number">
              03
            </span>

            <h3>
              REDEEM
            </h3>

            <p>
              Turn your points
              into delicious rewards.
            </p>

          </div>

        </div>

      </section>

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
            value={profile.customer_code || ''}
            size={210}
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
      console.error(
        'Redemption error:',
        error
      );

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
      <div className="container center">

        <div className="card digital">

          <CheckCircle
            size={50}
            style={{ marginBottom: 10 }}
          />

          <span className="eyebrow">
            REDEMPTION CODE
          </span>

          <h2>
            Show this code to staff
          </h2>

          <p className="muted">
            Do not close this screen until
            staff confirms your redemption.
          </p>

          <div
            style={{
              fontSize: '32px',
              fontWeight: '800',
              letterSpacing: '4px',
              padding: '20px 10px',
              margin: '20px 0',
              borderRadius: '14px',
              background: '#181818'
            }}
          >
            {code}
          </div>

          <button
            type="button"
            className="primary"
            onClick={copyCode}
          >
            <Copy size={18} />
            Copy Code
          </button>

          {msg && (
            <div className="notice">
              {msg}
            </div>
          )}

          <button
            type="button"
            className="birthday-button"
            onClick={onClose}
          >
            Back to Rewards
          </button>

        </div>

      </div>
    );
  }

  return (
    <div className="container">

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20
        }}
      >

        <div>
          <h1>
            Use Points
          </h1>

          <p className="muted">
            You have{' '}
            <b>
              {points.toFixed(2)} points
            </b>
          </p>
        </div>

        <button
          type="button"
          className="iconbtn"
          onClick={onClose}
        >
          <X size={20} />
        </button>

      </div>

      <div className="reward-list">

        {rewards.map((reward) => {

          const required =
            Number(
              reward.points_required
            );

          const available =
            points >= required;

          const selected =
            selectedReward?.id === reward.id;

          return (
            <button
              type="button"
              key={reward.id}
              onClick={() =>
                available &&
                setSelectedReward(reward)
              }
              disabled={!available}
              style={{
                width: '100%',
                textAlign: 'left',
                border: selected
                  ? '2px solid white'
                  : '1px solid #292929',
                opacity: available ? 1 : 0.45,
                cursor: available
                  ? 'pointer'
                  : 'not-allowed'
              }}
              className="card reward"
            >

              <div className="reward-icon">
                <Gift />
              </div>

              <div>

                <b>
                  {reward.name}
                </b>

                <p>
                  {reward.description || ''}
                </p>

                <small>
                  {required} points
                </small>

              </div>

              {!available && (
                <small>
                  Not enough
                </small>
              )}

            </button>
          );
        })}

      </div>

      {selectedReward && (
        <div
          className="card"
          style={{
            padding: 20,
            marginTop: 20
          }}
        >

          <h3>
            Redeem {selectedReward.name}?
          </h3>

          <p className="muted">
            This will create a redemption
            code for{' '}
            <b>
              {selectedReward.points_required}
              {' '}points.
            </b>
          </p>

          <p className="muted">
            Your points will only be deducted
            after staff confirms the code.
          </p>

          {msg && (
            <div className="notice">
              {msg}
            </div>
          )}

          <button
            type="button"
            className="primary"
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

function Rewards({
  profile,
  rewards
}) {
  return (
    <div className="container">

      <h1>
        Rewards 🎁
      </h1>

      <p className="muted">
        You have{' '}
        <b>
          {Number(
            profile.points || 0
          ).toFixed(2)}{' '}
          points
        </b>.
      </p>

      <div className="reward-list">

        {rewards.map((reward) => (

          <div
            className="card reward"
            key={reward.id}
          >

            <div className="reward-icon">
              <Gift />
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
              {reward.points_required} pts
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

      <h1>
        History
      </h1>

      {tx.length === 0 ? (

        <div className="card empty">

          <History />

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
   STAFF PANEL
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

  /* =====================================================
     FIND CUSTOMER
  ===================================================== */

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
      console.error(
        'Find customer error:',
        error
      );

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

  /* =====================================================
     ADD POINTS
  ===================================================== */

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

    /*
      POINT SYSTEM

      ₱100 = 1 point
      ₱500 = 5 points
      ₱1,000 = 10 points
    */

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
      console.error(
        'Points update error:',
        updateError
      );

      setMsg(
        updateError.message
      );

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
      console.error(
        'Transaction error:',
        transactionError
      );

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

  /* =====================================================
     SAVE NOTES
  ===================================================== */

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

  /* =====================================================
     BIRTHDAY REWARD
  ===================================================== */

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
      setMsg(
        checkError.message
      );

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
      `🎂 Birthday reward claimed: ${reward.reward_text}`
    );

    setBusy(false);
  }

  /* =====================================================
     CHECKING
  ===================================================== */

  if (checking) {
    return (
      <div className="screen">

        <div className="loader">
          🍣
        </div>

        <p>
          Checking staff access...
        </p>

      </div>
    );
  }

  /* =====================================================
     STAFF LOGIN
  ===================================================== */

  if (!staffSession) {
    return (
      <div className="auth-wrap">

        <div className="brand">

          <img
            src={logo}
            className="staff-logo"
            alt="At Home Sushi"
          />

          <h1>
            AT HOME SUSHI
          </h1>

          <p>
            STAFF ACCESS
          </p>

        </div>

        <div className="card auth-card">

          <h2>
            Staff Login
          </h2>

          <p className="muted">
            Sign in to manage customer points.
          </p>

          <form
            onSubmit={staffLogin}
          >

            <label>
              Email

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }
                required
                placeholder="Staff email"
              />
            </label>

            <PasswordField
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              placeholder="Staff password"
            />

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '14px',
                fontWeight: '500',
                color: '#999',
                cursor: 'pointer'
              }}
            >

              <input
                type="checkbox"
                checked={remember}
                onChange={(e) =>
                  setRemember(
                    e.target.checked
                  )
                }
              />

              Remember me

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

  /* =====================================================
     STAFF DASHBOARD
  ===================================================== */

  return (
    <div className="app">

      <header className="topbar">

        <div>

          <b>
            🍣 AT HOME SUSHI
          </b>

          <span>
            STAFF PANEL
          </span>

        </div>

        <button
          className="iconbtn"
          onClick={staffLogout}
          title="Log out"
        >
          <LogOut size={19} />
        </button>

      </header>

      <main className="container">

        <div className="hero">

          <p>
            STAFF
          </p>

          <h1>
            Add Customer Points
          </h1>

        </div>

        {/* FIND CUSTOMER */}

        <div
          className="card"
          style={{
            padding: 20
          }}
        >

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
          <div
            className="card"
            style={{
              padding: 20,
              marginTop: 14
            }}
          >

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
                marginTop: 15
              }}
            >

              <div className="balance">

                <Star />

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

                <Ticket />

                <small>
                  STAMPS
                </small>

                <strong>
                  {customer.stamps || 0}
                </strong>

              </div>

            </div>

            {customer.birthday && (
              <p className="muted">

                <Cake
                  size={15}
                  style={{
                    verticalAlign:
                      'middle'
                  }}
                />

                {' '}
                Birthday:{' '}

                {new Date(
                  customer.birthday
                ).toLocaleDateString()}

              </p>
            )}

            {/* ADD POINTS */}

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

            {amount &&
              Number(amount) > 0 && (
                <p className="muted">

                  Points to add:{' '}

                  <b>
                    {(
                      Number(amount) /
                      100
                    ).toFixed(2)}
                  </b>

                </p>
              )}

            <button
              type="button"
              className="primary"
              onClick={addPoints}
              disabled={busy}
            >

              <PlusCircle
                size={18}
              />

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
              🎂 Claim Birthday Reward
            </button>

            {/* NOTES */}

            <div
              style={{
                marginTop: 25,
                paddingTop: 20,
                borderTop:
                  '1px solid #292929'
              }}
            >

              <label>

                <FileText
                  size={14}
                  style={{
                    verticalAlign:
                      'middle'
                  }}
                />

                {' '}
                Customer Notes

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
          <div
            className="notice"
            style={{
              marginTop: 14
            }}
          >
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
