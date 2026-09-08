import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigurado = Boolean(url && publishableKey);

export const supabase = supabaseConfigurado
  ? createClient(url, publishableKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    })
  : null;

export async function obterUsuarioAtual() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user ?? null;
}

export async function entrarComSenha({ email, senha }) {
  return supabase.auth.signInWithPassword({ email, password: senha });
}

export async function entrarComGoogle({ redirectTo }) {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  });
}

export async function cadastrarComSenha({ email, senha }) {
  return supabase.auth.signUp({ email, password: senha });
}

export async function recuperarSenha({ email, redirectTo }) {
  return supabase.auth.resetPasswordForEmail(email, { redirectTo });
}

export async function atualizarSenha({ senha }) {
  return supabase.auth.updateUser({ password: senha });
}

export async function sair() {
  return supabase.auth.signOut();
}
