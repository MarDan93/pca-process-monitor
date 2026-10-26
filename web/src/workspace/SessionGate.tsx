import { useEffect, useState } from 'react';
import { api } from '../api';
import { initialLanguage, translate, type Language } from '../i18n';
import { Icon } from '../ui/Icon';
import { WorkspaceShell } from './WorkspaceShell';

export function SessionGate() {
  const [status, setStatus] = useState<{ required: boolean; authenticated: boolean; public_origin?: string | null } | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [username, setUsername] = useState('owner');
  const [password, setPassword] = useState('');
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const t = (text: string) => translate(language, text);
  async function check() {
    setError('');
    try { setStatus(await api.authStatus()); } catch { setError(t('The workspace could not be reached. Please retry.')); }
  }
  useEffect(() => {
    void check();
    const expired = () => { setStatus(old => ({ ...old, required: true, authenticated: false })); setPassword(''); };
    window.addEventListener('mould-auth-required', expired);
    return () => window.removeEventListener('mould-auth-required', expired);
  }, []);
  async function signIn(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try { await api.login(username, password); setPassword(''); await check(); }
    catch (e) { setError((e as Error).message); setPassword(''); }
    finally { setBusy(false); }
  }
  async function signOut() {
    setBusy(true);
    try { await api.logout(); setStatus(old => ({ ...old, required: true, authenticated: false })); }
    catch { await check(); }
    finally { setBusy(false); }
  }
  const secureAddress = status?.required && status.public_origin && status.public_origin !== window.location.origin ? status.public_origin : null;
  if (status?.authenticated && !secureAddress) return <WorkspaceShell hosted={status.required} onSignOut={() => { void signOut(); }}/>;
  return <main className="sign-in-page"><section className="sign-in-card"><div className="sign-in-brand"><span className="brand-mark"><img src="/brand/fabrivra-mark.svg" alt=""/></span><strong>FABRIVRA</strong><select className="language-picker" aria-label="Language" value={language} onChange={e => { const value = e.target.value as Language; setLanguage(value); document.documentElement.lang = value; try { localStorage.setItem('mould-studio-language', value); } catch { /* Preference only. */ } }}><option value="en">English</option><option value="it">Italiano</option><option value="fr">Français</option><option value="es">Español</option></select></div><p className="eyebrow">{t('Online workspace')}</p><h1>{t('Your engineering workspace.')}</h1><p className="help">{t('Sign in to access your projects, geometry and AI copilot.')}</p>{error && <p className="inline-error" role="alert">{t(error)}</p>}{secureAddress ? <div className="workspace-address-help"><p className="inline-error" role="alert">{t('Open the secure workspace address to sign in.')}</p><a className="primary full" id="secure-workspace-link" href={secureAddress}>{t('Open secure workspace')}</a></div> : status?.required ? <form onSubmit={signIn}><label className="field"><span>{t('Username')}</span><input id="sign-in-username" autoComplete="username" maxLength={64} value={username} onChange={e => setUsername(e.target.value)} required autoFocus/></label><label className="field"><span>{t('Password')}</span><input id="sign-in-password" type="password" autoComplete="current-password" maxLength={512} value={password} onChange={e => setPassword(e.target.value)} required/></label><button id="sign-in-submit" className="primary full" disabled={busy || !username || !password}><Icon name="lock" size={17}/>{t('Sign in')}</button></form> : <button className="secondary full" disabled={busy} onClick={() => { void check(); }}>{t(error ? 'Retry' : 'Connecting to workspace…')}</button>}<p className="sign-in-note"><Icon name="save" size={14}/>{t('Projects are saved on the server. No installation required.')}</p></section></main>;
}
