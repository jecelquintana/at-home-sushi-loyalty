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
  FileText
} from 'lucide-react';

import './styles.css';
import logo from './logo.jpg';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
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
          minLength="8"
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
      refresh={() => loadProfile(session.user.id)}
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

    /* SIGN UP */

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
      const customerCode = Math.random()
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
  const [rewards, setRewards] = useState([]);
  const [tx, setTx] = useState([]);
  const [tab, setTab] = useState('home');

  useEffect(() => {
    loadDashboard();
  }, [session.user.id]);

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

function Home({
  profile,
  rewards
}) {
  const points =
    Number(profile.points || 0);

  const next = rewards.find(
    (reward) =>
      Number(reward.points_required) > points
  );

  return (
    <div className="container">

      <div className="hero">

        <p>
          Hello,{' '}
          {profile.full_name?.split(' ')[0] ||
            'Sushi Lover'} 👋
        </p>

        <h1>
          Your rewards are waiting.
        </h1>

      </div>

      <div className="balance-grid">

        <div className="balance">

          <Star />

          <small>POINTS</small>

          <strong>
            {points.toFixed(2)}
          </strong>

        </div>

        <div className="balance">

          <Ticket />

          <small>STAMPS</small>

          <strong>
            {profile.stamps || 0}
          </strong>

        </div>

      </div>

      <div className="card quick">

        <div>

          <span className="eyebrow">
            YOUR DIGITAL CARD
          </span>

          <h3>
            Show your QR at checkout
          </h3>

          <p className="muted">
            We'll add your points to your account.
          </p>

        </div>

        <ChevronRight />

      </div>

      {next && (
        <div className="card progress">

          <div style={{ width: '100%' }}>

            <div className="row">

              <b>Next reward</b>

              <span>
                {(
                  Number(next.points_required) -
                  points
                ).toFixed(2)}{' '}
                points to go
              </span>

            </div>

            <div className="bar">

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

            <b>
              {next.name}
            </b>

          </div>

        </div>
      )}

      <h3 className="section-title">
        Available rewards
      </h3>

      <div className="reward-list">

        {rewards
          .slice(0, 3)
          .map((reward) => (

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
                  {reward.description ||
                    'Use your points for this reward.'}
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
            value={profile.customer_code}
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
              {reward.points_required}
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
      return;
    }

    setStaffSession(data.session);
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

    const { data, error } =
      await supabase
        .from('customers')
        .select('*')
        .eq('customer_code', code)
        .single();

    if (error || !data) {
      setMsg('Customer not found.');
      return;
    }

    setCustomer(data);
    setNotes(data.notes || '');
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

    /*
      POINT SYSTEM

      ₱100 = 1 point
      ₱50  = 0.50 point
      ₱850 = 8.50 points
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
      )} points added.`
    );

    setBusy(false);
  }

  async function saveNotes() {
    if (!customer) return;

    setBusy(true);
    setMsg('');

    const { error } =
      await supabase
        .from('customers')
        .update({
          notes: notes
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

  /* STAFF LOGIN */

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

          <form onSubmit={staffLogin}>

            <label>
              Email

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                required
                placeholder="Staff email"
              />
            </label>

            <PasswordField
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Staff password"
            />

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
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

            <button className="primary">
              <LogIn size={18} />
              Log in
            </button>

          </form>

        </div>

      </div>
    );
  }

  /* STAFF DASHBOARD */

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
          style={{ padding: 20 }}
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
            className="primary"
            onClick={findCustomer}
          >
            <ScanLine size={18} />
            Find Customer
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

            <p className="muted">
              Current points:{' '}
              <b>
                {Number(
                  customer.points || 0
                ).toFixed(2)}
              </b>
            </p>

            {customer.birthday && (
              <p className="muted">
                <Cake
                  size={15}
                  style={{
                    verticalAlign:
                      'middle'
                  }}
                />{' '}
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
                      Number(amount) / 100
                    ).toFixed(2)}
                  </b>
                </p>
              )}

            <button
              className="primary"
              onClick={addPoints}
              disabled={busy}
            >
              <PlusCircle size={18} />

              {busy
                ? 'Updating...'
                : 'Add Points'}
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
                />{' '}
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
                className="primary"
                onClick={saveNotes}
                disabled={busy}
              >
                Save Notes
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
