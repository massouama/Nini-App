import { useState } from 'react';
import { supabase } from '../data/supabase';

/** Connexion (mode synchronisé) : e-mail + mot de passe, ou lien magique. */
export function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup' | 'magic'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setMsg(null);
    const redirect = window.location.origin + window.location.pathname;
    const res = mode === 'signin' ? await supabase.auth.signInWithPassword({ email, password })
      : mode === 'signup' ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirect } })
        : await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect } });
    setBusy(false);
    if (res.error) setMsg({ tone: 'err', text: /fetch|network/i.test(res.error.message) ? 'Serveur injoignable : vérifie la connexion ou l’adresse Supabase.' : res.error.message });
    else if (mode === 'magic') setMsg({ tone: 'ok', text: 'Lien de connexion envoyé : ouvre ta boîte mail.' });
    else if (mode === 'signup' && !res.data.session) setMsg({ tone: 'ok', text: 'Compte créé. Confirme ton adresse depuis le mail reçu.' });
  };

  return (
    <div className="login">
      <form className="login-card" onSubmit={submit}>
        <div className="brand lg"><span className="brand-mark" aria-hidden="true" />Nini</div>
        <h1>{mode === 'signup' ? 'Créer ton espace' : 'Connexion'}</h1>
        <p className="muted">Tes dossiers, synchronisés sur tous tes appareils.</p>
        <label className="field"><span>E-mail</span><input type="email" required autoFocus value={email} onChange={e => setEmail(e.target.value)} /></label>
        {mode !== 'magic' && (
          <label className="field"><span>Mot de passe</span><input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} /></label>
        )}
        {msg && <p className={`login-msg ${msg.tone}`}>{msg.text}</p>}
        <button className="btn primary block" disabled={busy}>
          {busy ? '…' : mode === 'signin' ? 'Se connecter' : mode === 'signup' ? 'Créer le compte' : 'Recevoir un lien'}
        </button>
        <div className="login-links">
          {mode !== 'signin' && <button type="button" onClick={() => setMode('signin')}>J’ai déjà un compte</button>}
          {mode !== 'signup' && <button type="button" onClick={() => setMode('signup')}>Créer un compte</button>}
          {mode !== 'magic' && <button type="button" onClick={() => setMode('magic')}>Connexion par lien e-mail</button>}
        </div>
      </form>
    </div>
  );
}
