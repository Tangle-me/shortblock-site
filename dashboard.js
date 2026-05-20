// Replace these two values after creating your Supabase project (see DEPLOY.md)
const SUPABASE_URL = 'https://kqaeghwjokneutaxrude.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_DTuYHXUtCex0lJ7L9Iu0QQ_dyHbOwM-';

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Views
const loginView    = document.getElementById('login-view');
const signupView   = document.getElementById('signup-view');
const dashView     = document.getElementById('dashboard-view');

// Login
document.getElementById('login-btn').addEventListener('click', async () => {
  const email = document.getElementById('email-input').value.trim();
  const pass  = document.getElementById('pass-input').value;
  const err   = document.getElementById('login-err');
  err.textContent = '';

  const { error } = await sb.auth.signInWithPassword({ email, password: pass });
  if (error) { err.textContent = error.message; return; }
  showDashboard();
});

document.getElementById('signup-link').addEventListener('click', (e) => {
  e.preventDefault();
  loginView.style.display  = 'none';
  signupView.style.display = 'block';
});

// Sign-up
document.getElementById('signup-btn').addEventListener('click', async () => {
  const email = document.getElementById('su-email').value.trim();
  const pass  = document.getElementById('su-pass').value;
  const err   = document.getElementById('signup-err');
  err.textContent = '';

  if (pass.length < 8) { err.textContent = 'Password must be at least 8 characters.'; return; }

  const { data, error } = await sb.auth.signUp({ email, password: pass });
  if (error) { err.textContent = error.message; return; }

  // Create family row
  if (data.user) {
    await sb.from('families').insert({ id: data.user.id, parent_email: email });
  }
  showDashboard();
});

document.getElementById('back-login-link').addEventListener('click', (e) => {
  e.preventDefault();
  signupView.style.display = 'none';
  loginView.style.display  = 'block';
});

// Sign-out
document.getElementById('signout-btn').addEventListener('click', async () => {
  await sb.auth.signOut();
  dashView.style.display  = 'none';
  loginView.style.display = 'block';
});

// Toggle change handler — saves immediately on toggle flip
['t-tiktok', 't-shorts', 't-reels', 't-snap'].forEach(id => {
  document.getElementById(id).addEventListener('change', saveSettings);
});

async function showDashboard() {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return;

  loginView.style.display  = 'none';
  signupView.style.display = 'none';
  dashView.style.display   = 'block';
  document.getElementById('user-email-label').textContent = `Signed in as ${user.email}`;

  // Load existing settings
  const { data } = await sb.from('settings').select('*').eq('family_id', user.id).single();
  if (data) {
    document.getElementById('t-tiktok').checked = data.block_tiktok;
    document.getElementById('t-shorts').checked = data.block_youtube_shorts;
    document.getElementById('t-reels').checked  = data.block_instagram_reels;
    document.getElementById('t-snap').checked   = data.block_snapchat_spotlight;
  }
}

async function saveSettings() {
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return;

  const updates = {
    family_id:               user.id,
    block_tiktok:            document.getElementById('t-tiktok').checked,
    block_youtube_shorts:    document.getElementById('t-shorts').checked,
    block_instagram_reels:   document.getElementById('t-reels').checked,
    block_snapchat_spotlight: document.getElementById('t-snap').checked,
    updated_at:              new Date().toISOString(),
  };

  await sb.from('settings').upsert(updates);

  const msg = document.getElementById('save-msg');
  msg.style.display = 'block';
  setTimeout(() => { msg.style.display = 'none'; }, 2000);
}

// Check if already logged in on page load
(async () => {
  const { data: { session } } = await sb.auth.getSession();
  if (session) showDashboard();
})();
