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
  PlusCircle
} from 'lucide-react';
import './styles.css';
import logo from '../logo.jpg';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

function App(){
  const [session,setSession]=useState(null);
  const [profile,setProfile]=useState(null);
  const [mode,setMode]=useState('login');
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>{
      setSession(data.session);

      if(data.session){
        loadProfile(data.session.user.id);
      }else{
        setLoading(false);
      }
    });

    const {
      data:{subscription}
    }=supabase.auth.onAuthStateChange((_e,s)=>{
      setSession(s);

      if(s){
        loadProfile(s.user.id);
      }else{
        setProfile(null);
        setLoading(false);
      }
    });

    return ()=>subscription.unsubscribe();
  },[]);

  async function loadProfile(id){
    const {data,error}=await supabase
      .from('customers')
      .select('*')
      .eq('id',id)
      .single();

    if(error) console.error(error);

    setProfile(data);
    setLoading(false);
  }

  if(loading){
    return (
      <div className="screen">
        <div className="loader">🍣</div>
        <p>Loading At Home Sushi Loyalty Club...</p>
      </div>
    );
  }

  if(!session){
    return <Auth mode={mode} setMode={setMode}/>;
  }

  return (
    <Dashboard
      session={session}
      profile={profile}
      refresh={()=>loadProfile(session.user.id)}
    />
  );
}

function Auth({mode,setMode}){
  const [name,setName]=useState('');
  const [email,setEmail]=useState('');
  const [phone,setPhone]=useState('');
  const [password,setPassword]=useState('');
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState('');

  async function submit(e){
    e.preventDefault();
    setBusy(true);
    setMsg('');

    if(mode==='signup'){
      const {error}=await supabase.auth.signUp({
        email,
        password,
        options:{
          data:{
            full_name:name,
            phone
          }
        }
      });

      if(error){
        setMsg(error.message);
      }else{
        setMsg(
          'Account created! Check your email to confirm your account, then log in.'
        );
      }
    }else{
      const {error}=await supabase.auth.signInWithPassword({
        email,
        password
      });

      if(error){
        setMsg(error.message);
      }
    }

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
            className={mode==='login'?'active':''}
            onClick={()=>setMode('login')}
          >
            <LogIn size={17}/>
            Log in
          </button>

          <button
            className={mode==='signup'?'active':''}
            onClick={()=>setMode('signup')}
          >
            <UserPlus size={17}/>
            Join
          </button>

        </div>

        <h2>
          {mode==='signup'
            ?'Join the Loyalty Club'
            :'Welcome back!'}
        </h2>

        <p className="muted">
          {mode==='signup'
            ?'Collect points every time you enjoy At Home Sushi.'
            :'Check your points, stamps and rewards.'}
        </p>

        <form onSubmit={submit}>

          {mode==='signup' && (
            <>
              <label>
                Full name
                <input
                  value={name}
                  onChange={e=>setName(e.target.value)}
                  required
                  placeholder="Your name"
                />
              </label>

              <label>
                Phone number
                <input
                  value={phone}
                  onChange={e=>setPhone(e.target.value)}
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
              onChange={e=>setEmail(e.target.value)}
              required
              placeholder="you@email.com"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={e=>setPassword(e.target.value)}
              required
              minLength="8"
              placeholder="At least 8 characters"
            />
          </label>

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
              ?'Please wait...'
              :mode==='signup'
                ?'Create my account'
                :'Log in'}
          </button>

        </form>

        {mode==='login' && (
          <p className="switch">
            New here?{' '}
            <button onClick={()=>setMode('signup')}>
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

function Dashboard({session,profile}){

  const [rewards,setRewards]=useState([]);
  const [tx,setTx]=useState([]);
  const [tab,setTab]=useState('home');

  useEffect(()=>{
    supabase
      .from('rewards')
      .select('*')
      .eq('active',true)
      .order('points_required')
      .then(({data})=>setRewards(data||[]));

    supabase
      .from('transactions')
      .select('*')
      .eq('customer_id',session.user.id)
      .order('created_at',{ascending:false})
      .limit(10)
      .then(({data})=>setTx(data||[]));

  },[session.user.id]);

  async function logout(){
    await supabase.auth.signOut();
  }

  if(!profile){
    return (
      <div className="screen">
        <p>Creating your loyalty card...</p>
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
          <LogOut size={19}/>
        </button>

      </header>

      <main>

        {tab==='home' && (
          <Home
            profile={profile}
            rewards={rewards}
          />
        )}

        {tab==='card' && (
          <DigitalCard
            profile={profile}
          />
        )}

        {tab==='rewards' && (
          <Rewards
            profile={profile}
            rewards={rewards}
          />
        )}

        {tab==='history' && (
          <HistoryTab
            tx={tx}
          />
        )}

      </main>

      <nav className="nav">

        <button
          className={tab==='home'?'sel':''}
          onClick={()=>setTab('home')}
        >
          <Star/>
          Home
        </button>

        <button
          className={tab==='card'?'sel':''}
          onClick={()=>setTab('card')}
        >
          <QrCode/>
          My Card
        </button>

        <button
          className={tab==='rewards'?'sel':''}
          onClick={()=>setTab('rewards')}
        >
          <Gift/>
          Rewards
        </button>

        <button
          className={tab==='history'?'sel':''}
          onClick={()=>setTab('history')}
        >
          <History/>
          History
        </button>

      </nav>

    </div>
  );
}

function Home({profile,rewards}){

  const next=rewards.find(
    r=>r.points_required>profile.points
  );

  return (
    <div className="container">

      <div className="hero">
        <p>
          Hello, {profile.full_name?.split(' ')[0] || 'Sushi Lover'} 👋
        </p>

        <h1>Your rewards are waiting.</h1>
      </div>

      <div className="balance-grid">

        <div className="balance">
          <Star/>
          <small>POINTS</small>
          <strong>{profile.points}</strong>
        </div>

        <div className="balance">
          <Ticket/>
          <small>STAMPS</small>
          <strong>{profile.stamps}</strong>
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

        <ChevronRight/>

      </div>

      {next && (
        <div className="card progress">

          <div className="row">
            <b>Next reward</b>

            <span>
              {next.points_required-profile.points} points to go
            </span>
          </div>

          <div className="bar">
            <i
              style={{
                width:`${Math.min(
                  100,
                  (profile.points/next.points_required)*100
                )}%`
              }}
            />
          </div>

          <b>{next.name}</b>

        </div>
      )}

      <h3 className="section-title">
        Available rewards
      </h3>

      <div className="reward-list">

        {rewards.slice(0,3).map(r=>(
          <div
            className="card reward"
            key={r.id}
          >

            <div className="reward-icon">
              <Gift/>
            </div>

            <div>
              <b>{r.name}</b>

              <p>
                {r.description ||
                  'Use your points for this reward.'}
              </p>
            </div>

            <strong>
              {r.points_required} pts
            </strong>

          </div>
        ))}

      </div>

    </div>
  );
}

function DigitalCard({profile}){

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
            <b>{profile.points}</b>
          </div>

          <div className="mini">
            <small>STAMPS</small>
            <b>{profile.stamps}</b>
          </div>

        </div>

        <p className="muted">
          Show this QR code at checkout.
        </p>

      </div>

    </div>
  );
}

function Rewards({profile,rewards}){

  return (
    <div className="container">

      <h1>Rewards 🎁</h1>

      <p className="muted">
        You have <b>{profile.points} points</b>.
      </p>

      <div className="reward-list">

        {rewards.map(r=>(
          <div
            className="card reward"
            key={r.id}
          >

            <div className="reward-icon">
              <Gift/>
            </div>

            <div>
              <b>{r.name}</b>
              <p>{r.description||''}</p>
            </div>

            <strong>
              {r.points_required}
            </strong>

          </div>
        ))}

      </div>

    </div>
  );
}

function HistoryTab({tx}){

  return (
    <div className="container">

      <h1>History</h1>

      {tx.length===0 ? (

        <div className="card empty">
          <History/>
          <p>No transactions yet.</p>
        </div>

      ) : (

        <div className="reward-list">

          {tx.map(t=>(
            <div
              className="card reward"
              key={t.id}
            >

              <div>
                <b>{t.transaction_type}</b>

                <p>
                  {new Date(
                    t.created_at
                  ).toLocaleString()}
                </p>
              </div>

              <strong>
                +{t.points_earned}
              </strong>

            </div>
          ))}

        </div>

      )}

    </div>
  );
}

function Staff(){

  const [staffSession,setStaffSession]=useState(null);
  const [checking,setChecking]=useState(true);

  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [loginMsg,setLoginMsg]=useState('');

  const [customerCode,setCustomerCode]=useState('');
  const [customer,setCustomer]=useState(null);
  const [amount,setAmount]=useState('');
  const [msg,setMsg]=useState('');
  const [busy,setBusy]=useState(false);

  useEffect(()=>{

    supabase.auth.getSession().then(({data})=>{
      setStaffSession(data.session);
      setChecking(false);
    });

  },[]);

  async function staffLogin(e){

    e.preventDefault();
    setLoginMsg('');

    const {data,error}=await supabase.auth.signInWithPassword({
      email,
      password
    });

    if(error){
      setLoginMsg(error.message);
      return;
    }

    setStaffSession(data.session);
  }

  async function staffLogout(){

    await supabase.auth.signOut();

    setStaffSession(null);
  }

  async function findCustomer(){

    setMsg('');
    setCustomer(null);

    if(!customerCode.trim()){
      setMsg('Please enter a customer QR code.');
      return;
    }

    const {data,error}=await supabase
      .from('customers')
      .select('*')
      .eq('customer_code',customerCode.trim())
      .single();

    if(error || !data){
      setMsg('Customer not found.');
      return;
    }

    setCustomer(data);
  }

  async function addPoints(){

    const purchase=parseFloat(amount);

    if(!customer){
      setMsg('Find a customer first.');
      return;
    }

    if(!purchase || purchase<=0){
      setMsg('Enter a valid purchase amount.');
      return;
    }

    const points=purchase/100;

    setBusy(true);
    setMsg('');

    const {error:updateError}=await supabase
      .from('customers')
      .update({
        points:Number(customer.points||0)+points
      })
      .eq('id',customer.id);

    if(updateError){
      setMsg(updateError.message);
      setBusy(false);
      return;
    }

    const {error:transactionError}=await supabase
      .from('transactions')
      .insert({
        customer_id:customer.id,
        transaction_type:'purchase',
        points_earned:points
      });

    if(transactionError){
      setMsg(transactionError.message);
      setBusy(false);
      return;
    }

    setCustomer({
      ...customer,
      points:Number(customer.points||0)+points
    });

    setAmount('');

    setMsg(
      `Success! ${points.toFixed(2)} points added.`
    );

    setBusy(false);
  }

  if(checking){

    return (
      <div className="screen">
        <div className="loader">🍣</div>
        <p>Checking staff access...</p>
      </div>
    );
  }

  if(!staffSession){

    return (
      <div className="auth-wrap">

        <div className="brand">

          <img
            src={logo}
            className="logo"
            alt="At Home Sushi"
          />

          <h1>AT HOME SUSHI</h1>
          <p>STAFF ACCESS</p>

        </div>

        <div className="card auth-card">

          <h2>Staff Login</h2>

          <p className="muted">
            Sign in to manage customer points.
          </p>

          <form onSubmit={staffLogin}>

            <label>
              Email

              <input
                type="email"
                value={email}
                onChange={e=>setEmail(e.target.value)}
                required
                placeholder="Staff email"
              />

            </label>

            <label>
              Password

              <input
                type="password"
                value={password}
                onChange={e=>setPassword(e.target.value)}
                required
                placeholder="Password"
              />

            </label>

            {loginMsg && (
              <div className="notice">
                {loginMsg}
              </div>
            )}

            <button className="primary">
              Log in
            </button>

          </form>

        </div>

      </div>
    );
  }

  return (
    <div className="app">

      <header className="topbar">

        <div>
          <b>🍣 AT HOME SUSHI</b>
          <span>STAFF PANEL</span>
        </div>

        <button
          className="iconbtn"
          onClick={staffLogout}
        >
          <LogOut size={19}/>
        </button>

      </header>

      <main className="container">

        <div className="hero">

          <p>STAFF</p>

          <h1>
            Add Customer Points
          </h1>

        </div>

        <div
          className="card"
          style={{padding:20}}
        >

          <label>
            Customer QR / Code
          </label>

          <input
            value={customerCode}
            onChange={e=>setCustomerCode(e.target.value)}
            placeholder="Enter customer code"
          />

          <button
            className="primary"
            onClick={findCustomer}
          >
            <ScanLine size={18}/>
            Find Customer
          </button>

        </div>

        {customer && (

          <div
            className="card"
            style={{
              padding:20,
              marginTop:14
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
                {Number(customer.points||0).toFixed(2)}
              </b>
            </p>

            <label>
              Purchase Amount
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={e=>setAmount(e.target.value)}
              placeholder="₱0.00"
            />

            {amount && Number(amount)>0 && (

              <p className="muted">
                Points to add:{' '}
                <b>
                  {(Number(amount)/100).toFixed(2)}
                </b>
              </p>

            )}

            <button
              className="primary"
              onClick={addPoints}
              disabled={busy}
            >

              <PlusCircle size={18}/>

              {busy
                ?'Updating...'
                :'Add Points'}

            </button>

          </div>

        )}

        {msg && (
          <div
            className="notice"
            style={{marginTop:14}}
          >
            {msg}
          </div>
        )}

      </main>

    </div>
  );
}

const path=window.location.pathname;

createRoot(document.getElementById('root')).render(
  path==='/staff'
    ? <Staff/>
    : <App/>
);
