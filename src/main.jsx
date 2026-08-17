import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { QRCodeSVG } from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Gift, LogIn, LogOut, UserPlus, Star, Ticket, History,
  QrCode, ChevronRight, ScanLine, PlusCircle, Eye, EyeOff,
  Bell, Settings, Upload, Save, Search, MessageSquare,
  Cake, Palette, CheckCircle, X, Menu, Users
} from 'lucide-react';
import './styles.css';
import logo from '../logo.jpg';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);

const DEFAULT_DESIGN = {
  business_name: 'AT HOME SUSHI',
  card_title: 'LOYALTY CARD',
  card_subtitle: 'QUICK ROLLS. BOLD FLAVORS. GREAT REWARDS.',
  background_type: 'color',
  background_color: '#111111',
  background_image_url: '',
  primary_color: '#111111',
  secondary_color: '#1c1c1c',
  accent_color: '#c9a227',
  text_color: '#ffffff',
  font_family: 'Inter',
  logo_url: '',
  stamp_icon: '🍣',
  empty_stamp_icon: '○',
  stamp_count: 8,
  show_points: true,
  show_stamps: true,
  show_customer_code: true,
  show_qr: true
};

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) loadProfile(data.session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);

        if (session) loadProfile(session.user.id);
        else {
          setProfile(null);
          setLoading(false);
        }
      });

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(id) {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    setProfile(data);
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
    return <Auth mode={mode} setMode={setMode} />;
  }

  return (
    <CustomerDashboard
      session={session}
      profile={profile}
      refresh={() => loadProfile(session.user.id)}
    />
  );
}

function Auth({ mode, setMode }) {
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg('');

    try {
      if (mode === 'signup') {
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

        if (error) throw error;

        if (data.user) {
          await supabase.from('customers').upsert({
            id: data.user.id,
            full_name: name,
            email,
            phone,
            birthday,
            points: 0,
            stamps: 0
          });
        }

        setMsg(
          'Account created! Check your email if confirmation is required, then log in.'
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        if (!remember) {
          localStorage.setItem('athome_no_remember', '1');
        } else {
          localStorage.removeItem('athome_no_remember');
        }
      }
    } catch (error) {
      setMsg(error.message);
    }

    setBusy(false);
  }

  return (
    <div className="auth-wrap">
      <div className="brand">
        <img src={logo} className="logo" alt="At Home Sushi" />
        <h1>AT HOME SUSHI</h1>
        <p>LOYALTY CLUB</p>
      </div>

      <div className="card auth-card">
        <div className="tabs">
          <button
            className={mode === 'login' ? 'active' : ''}
            onClick={() => setMode('login')}
          >
            <LogIn size={17} /> Log in
          </button>

          <button
            className={mode === 'signup' ? 'active' : ''}
            onClick={() => setMode('signup')}
          >
            <UserPlus size={17} /> Join
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
                  onChange={e => setName(e.target.value)}
                  required
                  placeholder="Your name"
                />
              </label>

              <label>
                Birthday
                <input
                  type="date"
                  value={birthday}
                  onChange={e => setBirthday(e.target.value)}
                />
              </label>

              <label>
                Phone number
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="09xxxxxxxxx"
                />
              </label>
            </>
          )}

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@email.com"
            />
          </label>

          <label>
            Password
            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength="8"
                placeholder="At least 8 characters"
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          {mode === 'login' && (
            <label className="remember">
              <input
                type="checkbox"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
              />
              Remember me
            </label>
          )}

          {msg && <div className="notice">{msg}</div>}

          <button className="primary" disabled={busy}>
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
            <button onClick={() => setMode('signup')}>
              Join the club
            </button>
          </p>
        )}
      </div>

      <p className="footer">
        Quick Rolls. Bold Flavors. Great Rewards. 🍣
      </p>
    </div>
  );
}

function CustomerDashboard({ session, profile, refresh }) {
  const [rewards, setRewards] = useState([]);
  const [tx, setTx] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [design, setDesign] = useState(DEFAULT_DESIGN);
  const [tab, setTab] = useState('home');

  useEffect(() => {
    loadData();
  }, [session.user.id]);

  async function loadData() {
    const [
      rewardsResult,
      txResult,
      notificationResult,
      designResult
    ] = await Promise.all([
      supabase
        .from('rewards')
        .select('*')
        .eq('active', true)
        .order('points_required'),

      supabase
        .from('transactions')
        .select('*')
        .eq('customer_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(20),

      supabase
        .from('notifications')
        .select('*')
        .eq('customer_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(20),

      supabase
        .from('card_design')
        .select('*')
        .eq('id', 1)
        .maybeSingle()
    ]);

    setRewards(rewardsResult.data || []);
    setTx(txResult.data || []);
    setNotifications(notificationResult.data || []);

    if (designResult.data) {
      setDesign({
        ...DEFAULT_DESIGN,
        ...designResult.data
      });
    }
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  if (!profile) {
    return (
      <div className="screen">
        <p>Creating your loyalty card...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand-mini">
          <img
            src={design.logo_url || logo}
            alt="At Home Sushi"
          />
          <div>
            <b>{design.business_name}</b>
            <span>LOYALTY CLUB</span>
          </div>
        </div>

        <button className="iconbtn" onClick={logout}>
          <LogOut size={19} />
        </button>
      </header>

      <main>
        {tab === 'home' && (
          <Home
            profile={profile}
            rewards={rewards}
            notifications={notifications}
            design={design}
            setTab={setTab}
          />
        )}

        {tab === 'card' && (
          <DigitalCard
            profile={profile}
            design={design}
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

        {tab === 'notifications' && (
          <Notifications
            notifications={notifications}
            refresh={loadData}
          />
        )}
      </main>

      <nav className="nav">
        <button
          className={tab === 'home' ? 'sel' : ''}
          onClick={() => setTab('home')}
        >
          <Star /> Home
        </button>

        <button
          className={tab === 'card' ? 'sel' : ''}
          onClick={() => setTab('card')}
        >
          <QrCode /> My Card
        </button>

        <button
          className={tab === 'rewards' ? 'sel' : ''}
          onClick={() => setTab('rewards')}
        >
          <Gift /> Rewards
        </button>

        <button
          className={tab === 'history' ? 'sel' : ''}
          onClick={() => setTab('history')}
        >
          <History /> History
        </button>

        <button
          className={tab === 'notifications' ? 'sel' : ''}
          onClick={() => setTab('notifications')}
        >
          <Bell />
          {notifications.some(n => !n.read) && (
            <i className="notification-dot" />
          )}
          Alerts
        </button>
      </nav>
    </div>
  );
}

function Home({
  profile,
  rewards,
  notifications,
  design,
  setTab
}) {
  const next = rewards.find(
    r => Number(r.points_required) > Number(profile.points || 0)
  );

  return (
    <div className="container">
      <div className="hero">
        <p>
          Hello,{' '}
          {profile.full_name?.split(' ')[0] || 'Sushi Lover'} 👋
        </p>
        <h1>Your rewards are waiting.</h1>
      </div>

      {notifications.some(n => !n.read) && (
        <button
          className="card notification-banner"
          onClick={() => setTab('notifications')}
        >
          <Bell />
          <div>
            <b>You have new updates</b>
            <p className="muted">
              Tap to see your latest loyalty activity.
            </p>
          </div>
          <ChevronRight />
        </button>
      )}

      <div className="balance-grid">
        <div className="balance">
          <Star />
          <small>POINTS</small>
          <strong>
            {Number(profile.points || 0).toFixed(2)}
          </strong>
        </div>

        <div className="balance">
          <Ticket />
          <small>STAMPS</small>
          <strong>{profile.stamps || 0}</strong>
        </div>
      </div>

      <div
        className="card quick"
        onClick={() => setTab('card')}
      >
        <div>
          <span className="eyebrow">YOUR DIGITAL CARD</span>
          <h3>Show your QR at checkout</h3>
          <p className="muted">
            We'll add your points to your account.
          </p>
        </div>
        <ChevronRight />
      </div>

      {next && (
        <div className="card progress">
          <div className="row">
            <b>Next reward</b>
            <span>
              {(
                Number(next.points_required) -
                Number(profile.points || 0)
              ).toFixed(2)}{' '}
              points to go
            </span>
          </div>

          <div className="bar">
            <i
              style={{
                width: `${Math.min(
                  100,
                  (Number(profile.points || 0) /
                    Number(next.points_required)) *
                    100
                )}%`
              }}
            />
          </div>

          <b>{next.name}</b>
        </div>
      )}

      <DigitalStamps
        stamps={profile.stamps || 0}
        design={design}
      />

      <h3 className="section-title">
        Available rewards
      </h3>

      <div className="reward-list">
        {rewards.slice(0, 3).map(r => (
          <div className="card reward" key={r.id}>
            <div className="reward-icon">
              <Gift />
            </div>

            <div>
              <b>{r.name}</b>
              <p>
                {r.description ||
                  'Use your points for this reward.'}
              </p>
            </div>

            <strong>{r.points_required} pts</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function DigitalStamps({ stamps, design }) {
  const total = Number(design.stamp_count || 8);

  return (
    <div className="card stamp-card">
      <div className="row">
        <div>
          <span className="eyebrow">LOYALTY STAMPS</span>
          <h3>Your progress</h3>
        </div>

        <b>
          {stamps}/{total}
        </b>
      </div>

      <div className="stamp-grid">
        {Array.from({ length: total }).map((_, index) => (
          <span key={index} className={index < stamps ? 'filled' : ''}>
            {index < stamps
              ? design.stamp_icon
              : design.empty_stamp_icon}
          </span>
        ))}
      </div>
    </div>
  );
}

function DigitalCard({ profile, design }) {
  const background =
    design.background_type === 'image' &&
    design.background_image_url
      ? `url("${design.background_image_url}")`
      : design.background_color;

  return (
    <div className="container center">
      <div
        className="premium-card"
        style={{
          backgroundImage:
            design.background_type === 'image'
              ? background
              : 'none',
          backgroundColor:
            design.background_type === 'color'
              ? design.background_color
              : '#111',
          color: design.text_color,
          fontFamily: design.font_family,
          borderColor: design.accent_color
        }}
      >
        <div className="card-overlay" />

        <div className="premium-card-content">
          <div className="premium-card-top">
            <div>
              <span
                className="card-business"
                style={{ color: design.accent_color }}
              >
                {design.business_name}
              </span>

              <h2>{design.card_title}</h2>

              <p>{design.card_subtitle}</p>
            </div>

            <img
              className="card-logo"
              src={design.logo_url || logo}
              alt=""
            />
          </div>

          {design.show_qr && (
            <div className="premium-qr">
              <QRCodeSVG
                value={profile.customer_code}
                size={155}
                includeMargin
              />
            </div>
          )}

          <div className="premium-card-bottom">
            <div>
              <small>CARD MEMBER</small>
              <strong>{profile.full_name}</strong>
            </div>

            {design.show_points && (
              <div>
                <small>POINTS</small>
                <strong>
                  {Number(profile.points || 0).toFixed(2)}
                </strong>
              </div>
            )}
          </div>

          {design.show_customer_code && (
            <p className="premium-code">
              {profile.customer_code}
            </p>
          )}

          {design.show_stamps && (
            <DigitalStamps
              stamps={profile.stamps || 0}
              design={design}
            />
          )}
        </div>
      </div>

      <p className="muted card-help">
        Show this QR code at checkout.
      </p>
    </div>
  );
}

function Rewards({ profile, rewards }) {
  return (
    <div className="container">
      <h1>Rewards 🎁</h1>

      <p className="muted">
        You have{' '}
        <b>
          {Number(profile.points || 0).toFixed(2)} points
        </b>.
      </p>

      <div className="reward-list">
        {rewards.map(r => (
          <div className="card reward" key={r.id}>
            <div className="reward-icon">
              <Gift />
            </div>

            <div>
              <b>{r.name}</b>
              <p>{r.description || ''}</p>
            </div>

            <strong>{r.points_required}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function HistoryTab({ tx }) {
  return (
    <div className="container">
      <h1>History</h1>

      {tx.length === 0 ? (
        <div className="card empty">
          <History />
          <p>No transactions yet.</p>
        </div>
      ) : (
        <div className="reward-list">
          {tx.map(t => (
            <div className="card reward" key={t.id}>
              <div>
                <b>
                  {t.transaction_type === 'purchase'
                    ? 'Purchase'
                    : t.transaction_type}
                </b>

                <p>
                  {new Date(
                    t.created_at
                  ).toLocaleString()}
                </p>
              </div>

              <strong>
                +{Number(t.points_earned || 0).toFixed(2)}
              </strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Notifications({ notifications, refresh }) {
  async function markRead(id) {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);

    refresh();
  }

  return (
    <div className="container">
      <h1>Updates 🔔</h1>

      {notifications.length === 0 ? (
        <div className="card empty">
          <Bell />
          <p>No notifications yet.</p>
        </div>
      ) : (
        <div className="reward-list">
          {notifications.map(n => (
            <button
              className={`card notification-item ${
                n.read ? '' : 'unread'
              }`}
              key={n.id}
              onClick={() => markRead(n.id)}
            >
              <Bell />
              <div>
                <b>{n.title}</b>
                <p>{n.message}</p>
                <small>
                  {new Date(
                    n.created_at
                  ).toLocaleString()}
                </small>
              </div>
            </button>
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
  const [staffSession, setStaffSession] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setStaffSession(data.session);
      setChecking(false);
    });
  }, []);

  if (checking) {
    return (
      <div className="screen">
        <div className="loader">🍣</div>
        <p>Checking staff access...</p>
      </div>
    );
  }

  if (!staffSession) {
    return <StaffLogin onLogin={setStaffSession} />;
  }

  return (
    <StaffPanel
      session={staffSession}
      logout={async () => {
        await supabase.auth.signOut();
        setStaffSession(null);
      }}
    />
  );
}

function StaffLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

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
    } else {
      onLogin(data.session);

      if (!remember) {
        localStorage.setItem('staff_no_remember', '1');
      }
    }

    setBusy(false);
  }

  return (
    <div className="auth-wrap">
      <div className="brand">
        <img src={logo} className="logo" alt="At Home Sushi" />
        <h1>AT HOME SUSHI</h1>
        <p>STAFF ACCESS</p>
      </div>

      <div className="card auth-card">
        <h2>Staff Login</h2>

        <p className="muted">
          Sign in to manage customer loyalty accounts.
        </p>

        <form onSubmit={login}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="Staff email"
            />
          </label>

          <label>
            Password

            <div className="password-field">
              <input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Password"
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShow(!show)}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
                {show ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          <label className="remember">
            <input
              type="checkbox"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
            />
            Remember me
          </label>

          {msg && <div className="notice">{msg}</div>}

          <button className="primary" disabled={busy}>
            {busy ? 'Logging in...' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  );
}

function StaffPanel({ session, logout }) {
  const [page, setPage] = useState('points');

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand-mini">
          <img src={logo} alt="At Home Sushi" />
          <div>
            <b>AT HOME SUSHI</b>
            <span>STAFF PANEL</span>
          </div>
        </div>

        <button
          className="iconbtn"
          onClick={logout}
        >
          <LogOut size={19} />
        </button>
      </header>

      <main>
        {page === 'points' && (
          <StaffPoints />
        )}

        {page === 'customers' && (
          <StaffCustomers />
        )}

        {page === 'designer' && (
          <CardDesigner />
        )}

        {page === 'birthday' && (
          <BirthdaySettings />
        )}
      </main>

      <nav className="nav staff-nav">
        <button
          className={page === 'points' ? 'sel' : ''}
          onClick={() => setPage('points')}
        >
          <ScanLine />
          Points
        </button>

        <button
          className={page === 'customers' ? 'sel' : ''}
          onClick={() => setPage('customers')}
        >
          <Users />
          Customers
        </button>

        <button
          className={page === 'designer' ? 'sel' : ''}
          onClick={() => setPage('designer')}
        >
          <Palette />
          Card
        </button>

        <button
          className={page === 'birthday' ? 'sel' : ''}
          onClick={() => setPage('birthday')}
        >
          <Cake />
          Birthday
        </button>
      </nav>
    </div>
  );
}

function StaffPoints() {
  const [code, setCode] = useState('');
  const [customer, setCustomer] = useState(null);
  const [amount, setAmount] = useState('');
  const [msg, setMsg] = useState('');
  const [scanner, setScanner] = useState(false);
  const [busy, setBusy] = useState(false);

  const scannerRef = useRef(null);

  async function findCustomer(value = code) {
    setMsg('');
    setCustomer(null);

    const clean = value.trim();

    if (!clean) {
      setMsg('Please enter or scan a customer QR code.');
      return;
    }

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('customer_code', clean)
      .single();

    if (error || !data) {
      setMsg('Customer not found.');
      return;
    }

    setCustomer(data);
  }

  async function startScanner() {
    setMsg('');
    setScanner(true);

    setTimeout(async () => {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          async decodedText => {
            setCode(decodedText);

            await scanner.stop();
            scanner.clear();
            scannerRef.current = null;
            setScanner(false);

            findCustomer(decodedText);
          },
          () => {}
        );
      } catch (error) {
        setScanner(false);
        setMsg(
          'Camera could not be opened. Please allow camera access or enter the code manually.'
        );
      }
    }, 100);
  }

  async function stopScanner() {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch {}

    setScanner(false);
  }

  async function addPoints() {
    const purchase = Number(amount);

    if (!customer) {
      setMsg('Find a customer first.');
      return;
    }

    if (!purchase || purchase <= 0) {
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

    await supabase
      .from('notifications')
      .insert({
        customer_id: customer.id,
        title: 'Points Added! 🍣',
        message: `You earned ${points.toFixed(
          2
        )} points from your ₱${purchase.toFixed(
          2
        )} purchase. Your new balance is ${newPoints.toFixed(
          2
        )} points.`,
        type: 'points'
      });

    setCustomer({
      ...customer,
      points: newPoints
    });

    setAmount('');
    setMsg(
      `Success! ${points.toFixed(
        2
      )} points added to ${customer.full_name}.`
    );

    setBusy(false);
  }

  return (
    <div className="container">
      <div className="hero">
        <p>STAFF</p>
        <h1>Add Customer Points</h1>
      </div>

      <div className="card staff-action-card">
        <button
          className="primary"
          onClick={startScanner}
        >
          <ScanLine size={18} />
          Scan Customer QR
        </button>

        {scanner && (
          <>
            <div id="qr-reader" className="qr-reader" />

            <button
              className="secondary"
              onClick={stopScanner}
            >
              Cancel Scanner
            </button>
          </>
        )}

        <div className="divider">
          <span>OR ENTER CODE</span>
        </div>

        <label>
          Customer QR / Code
          <input
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Example: 254D39A2A2"
          />
        </label>

        <button
          className="secondary"
          onClick={() => findCustomer()}
        >
          <Search size={18} />
          Find Customer
        </button>
      </div>

      {customer && (
        <div className="card customer-result">
          <span className="eyebrow">CUSTOMER</span>

          <h2>{customer.full_name}</h2>

          <p className="muted">
            Current points:{' '}
            <b>
              {Number(customer.points || 0).toFixed(2)}
            </b>
          </p>

          <label>
            Purchase Amount
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="₱0.00"
            />
          </label>

          {amount && Number(amount) > 0 && (
            <div className="points-preview">
              <span>Points to add</span>
              <strong>
                {(Number(amount) / 100).toFixed(2)}
              </strong>
            </div>
          )}

          <button
            className="primary"
            onClick={addPoints}
            disabled={busy}
          >
            <PlusCircle size={18} />
            {busy ? 'Updating...' : 'Add Points'}
          </button>
        </div>
      )}

      {msg && (
        <div className="notice staff-message">
          {msg}
        </div>
      )}
    </div>
  );
}

function StaffCustomers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState('');

  async function loadCustomers() {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', {
        ascending: false
      });

    setCustomers(data || []);
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  async function saveNote() {
    if (!selected || !note.trim()) return;

    const { error } = await supabase
      .from('customer_notes')
      .insert({
        customer_id: selected.id,
        note: note.trim()
      });

    if (error) {
      setMsg(error.message);
      return;
    }

    setNote('');
    setMsg('Private note saved.');
  }

  const filtered = customers.filter(c =>
    `${c.full_name} ${c.email} ${c.customer_code}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="container">
      <div className="hero">
        <p>STAFF</p>
        <h1>Customers</h1>
      </div>

      <div className="card">
        <div className="search-box">
          <Search size={18} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search customers..."
          />
        </div>
      </div>

      <div className="customer-list">
        {filtered.map(customer => (
          <button
            className="card customer-row"
            key={customer.id}
            onClick={() => setSelected(customer)}
          >
            <div>
              <b>{customer.full_name}</b>
              <small>{customer.email}</small>
            </div>

            <strong>
              {Number(customer.points || 0).toFixed(2)}
            </strong>
          </button>
        ))}
      </div>

      {selected && (
        <div className="modal-backdrop">
          <div className="card modal">
            <button
              className="close-btn"
              onClick={() => setSelected(null)}
            >
              <X />
            </button>

            <span className="eyebrow">
              CUSTOMER PROFILE
            </span>

            <h2>{selected.full_name}</h2>

            <p>{selected.email}</p>

            <p>
              Points:{' '}
              <b>
                {Number(selected.points || 0).toFixed(2)}
              </b>
            </p>

            <p>
              Stamps: <b>{selected.stamps || 0}</b>
            </p>

            {selected.birthday && (
              <p>
                Birthday: {selected.birthday}
              </p>
            )}

            <hr />

            <h3>Private Staff Note</h3>

            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Add a private note..."
            />

            <button
              className="primary"
              onClick={saveNote}
            >
              <MessageSquare size={18} />
              Save Note
            </button>

            {msg && (
              <div className="notice">{msg}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* =====================================================
   CARD DESIGNER
===================================================== */

function CardDesigner() {
  const [design, setDesign] = useState(DEFAULT_DESIGN);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    loadDesign();
  }, []);

  async function loadDesign() {
    const { data } = await supabase
      .from('card_design')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (data) {
      setDesign({
        ...DEFAULT_DESIGN,
        ...data
      });
    }
  }

  async function uploadAsset(file, type) {
    if (!file) return;

    const extension =
      file.name.split('.').pop() || 'png';

    const path = `${type}-${Date.now()}.${extension}`;

    const { error } = await supabase.storage
      .from('card-assets')
      .upload(path, file, {
        upsert: true
      });

    if (error) {
      setMsg(error.message);
      return;
    }

    const { data } = supabase.storage
      .from('card-assets')
      .getPublicUrl(path);

    if (type === 'logo') {
      setDesign(d => ({
        ...d,
        logo_url: data.publicUrl
      }));
    }

    if (type === 'background') {
      setDesign(d => ({
        ...d,
        background_type: 'image',
        background_image_url: data.publicUrl
      }));
    }
  }

  async function save() {
    setSaving(true);
    setMsg('');

    const { error } = await supabase
      .from('card_design')
      .upsert({
        ...design,
        id: 1,
        updated_at: new Date().toISOString()
      });

    if (error) {
      setMsg(error.message);
    } else {
      setMsg('Card design saved! 🎉');
    }

    setSaving(false);
  }

  return (
    <div className="container">
      <div className="hero">
        <p>ADMIN</p>
        <h1>Card Designer</h1>
      </div>

      <div className="designer-grid">
        <div className="card designer-controls">
          <h3>Branding</h3>

          <label>
            Business name
            <input
              value={design.business_name}
              onChange={e =>
                setDesign({
                  ...design,
                  business_name: e.target.value
                })
              }
            />
          </label>

          <label>
            Card title
            <input
              value={design.card_title}
              onChange={e =>
                setDesign({
                  ...design,
                  card_title: e.target.value
                })
              }
            />
          </label>

          <label>
            Card subtitle
            <input
              value={design.card_subtitle}
              onChange={e =>
                setDesign({
                  ...design,
                  card_subtitle: e.target.value
                })
              }
            />
          </label>

          <h3>Images</h3>

          <label className="upload-button">
            <Upload size={18} />
            Upload Logo
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={e =>
                uploadAsset(
                  e.target.files?.[0],
                  'logo'
                )
              }
            />
          </label>

          <label className="upload-button">
            <Upload size={18} />
            Upload Card Background
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={e =>
                uploadAsset(
                  e.target.files?.[0],
                  'background'
                )
              }
            />
          </label>

          <h3>Colors</h3>

          <ColorInput
            label="Background"
            value={design.background_color}
            onChange={value =>
              setDesign({
                ...design,
                background_type: 'color',
                background_color: value
              })
            }
          />

          <ColorInput
            label="Accent"
            value={design.accent_color}
            onChange={value =>
              setDesign({
                ...design,
                accent_color: value
              })
            }
          />

          <ColorInput
            label="Text"
            value={design.text_color}
            onChange={value =>
              setDesign({
                ...design,
                text_color: value
              })
            }
          />

          <h3>Stamp</h3>

          <label>
            Filled stamp
            <input
              value={design.stamp_icon}
              onChange={e =>
                setDesign({
                  ...design,
                  stamp_icon: e.target.value
                })
              }
              placeholder="🍣"
            />
          </label>

          <label>
            Empty stamp
            <input
              value={design.empty_stamp_icon}
              onChange={e =>
                setDesign({
                  ...design,
                  empty_stamp_icon: e.target.value
                })
              }
              placeholder="○"
            />
          </label>

          <label>
            Number of stamps
            <input
              type="number"
              min="1"
              max="20"
              value={design.stamp_count}
              onChange={e =>
                setDesign({
                  ...design,
                  stamp_count: Number(e.target.value)
                })
              }
            />
          </label>

          <h3>Show on card</h3>

          <Toggle
            label="QR Code"
            checked={design.show_qr}
            onChange={value =>
              setDesign({
                ...design,
                show_qr: value
              })
            }
          />

          <Toggle
            label="Points"
            checked={design.show_points}
            onChange={value =>
              setDesign({
                ...design,
                show_points: value
              })
            }
          />

          <Toggle
            label="Stamps"
            checked={design.show_stamps}
            onChange={value =>
              setDesign({
                ...design,
                show_stamps: value
              })
            }
          />

          <button
            className="primary"
            onClick={save}
            disabled={saving}
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Card Design'}
          </button>

          {msg && (
            <div className="notice">{msg}</div>
          )}
        </div>

        <div>
          <span className="eyebrow">LIVE PREVIEW</span>

          <div className="designer-preview">
            <PreviewCard design={design} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorInput({ label, value, onChange }) {
  return (
    <label className="color-input">
      {label}
      <span>
        <input
          type="color"
          value={value}
          onChange={e =>
            onChange(e.target.value)
          }
        />
        <code>{value}</code>
      </span>
    </label>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="toggle">
      <span>{label}</span>

      <input
        type="checkbox"
        checked={checked}
        onChange={e =>
          onChange(e.target.checked)
        }
      />
    </label>
  );
}

function PreviewCard({ design }) {
  const background =
    design.background_type === 'image' &&
    design.background_image_url
      ? `url("${design.background_image_url}")`
      : 'none';

  return (
    <div
      className="premium-card preview"
      style={{
        backgroundImage: background,
        backgroundColor: design.background_color,
        color: design.text_color,
        fontFamily: design.font_family,
        borderColor: design.accent_color
      }}
    >
      <div className="card-overlay" />

      <div className="premium-card-content">
        <div className="premium-card-top">
          <div>
            <span
              className="card-business"
              style={{
                color: design.accent_color
              }}
            >
              {design.business_name}
            </span>

            <h2>{design.card_title}</h2>

            <p>{design.card_subtitle}</p>
          </div>

          <img
            className="card-logo"
            src={design.logo_url || logo}
            alt=""
          />
        </div>

        {design.show_qr && (
          <div className="premium-qr">
            <QRCodeSVG
              value="AT-HOME-SUSHI-PREVIEW"
              size={130}
              includeMargin
            />
          </div>
        )}

        <div className="premium-card-bottom">
          <div>
            <small>CARD MEMBER</small>
            <strong>YOUR NAME</strong>
          </div>

          {design.show_points && (
            <div>
              <small>POINTS</small>
              <strong>25.50</strong>
            </div>
          )}
        </div>

        {design.show_stamps && (
          <DigitalStamps
            stamps={4}
            design={design}
          />
        )}
      </div>
    </div>
  );
}

/* =====================================================
   BIRTHDAY SETTINGS
===================================================== */

function BirthdaySettings() {
  const [settings, setSettings] = useState({
    enabled: true,
    reward_name: 'Birthday Sushi Treat',
    reward_description:
      'Enjoy a special birthday reward from At Home Sushi!',
    validity_days: 7,
    send_email: true,
    send_sms: false
  });

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    supabase
      .from('birthday_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setSettings(data);
      });
  }, []);

  async function save() {
    setSaving(true);

    const { error } = await supabase
      .from('birthday_settings')
      .upsert({
        id: 1,
        ...settings,
        updated_at: new Date().toISOString()
      });

    setMsg(
      error
        ? error.message
        : 'Birthday settings saved! 🎂'
    );

    setSaving(false);
  }

  return (
    <div className="container">
      <div className="hero">
        <p>LOYALTY</p>
        <h1>Birthday Reward 🎂</h1>
      </div>

      <div className="card">
        <Toggle
          label="Enable birthday rewards"
          checked={settings.enabled}
          onChange={value =>
            setSettings({
              ...settings,
              enabled: value
            })
          }
        />

        <label>
          Reward name
          <input
            value={settings.reward_name}
            onChange={e =>
              setSettings({
                ...settings,
                reward_name: e.target.value
              })
            }
          />
        </label>

        <label>
          Reward message
          <textarea
            value={settings.reward_description}
            onChange={e =>
              setSettings({
                ...settings,
                reward_description: e.target.value
              })
            }
          />
        </label>

        <label>
          Valid for
          <input
            type="number"
            min="1"
            value={settings.validity_days}
            onChange={e =>
              setSettings({
                ...settings,
                validity_days: Number(
                  e.target.value
                )
              })
            }
          />
          <small>days after birthday</small>
        </label>

        <Toggle
          label="Email notification"
          checked={settings.send_email}
          onChange={value =>
            setSettings({
              ...settings,
              send_email: value
            })
          }
        />

        <Toggle
          label="SMS notification"
          checked={settings.send_sms}
          onChange={value =>
            setSettings({
              ...settings,
              send_sms: value
            })
          }
        />

        <button
          className="primary"
          onClick={save}
          disabled={saving}
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Birthday Settings'}
        </button>

        {msg && (
          <div className="notice">{msg}</div>
        )}
      </div>
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
