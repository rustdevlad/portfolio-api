interface EnvConfig {
  supabase: {
    url: string;
    anonKey: string;
    serviceKey?: string;
  };
  spotify: {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
  };
  lastfm: {
    apiKey: string;
    username: string;
  };
  statsfm: {
    username: string;
  };
  steam: {
    apiKey: string;
    steamId: string;
  };
  osu: {
    clientId: string;
    clientSecret: string;
    username: string;
  };
  github: {
    token: string;
    username: string;
  };
  yandex: {
    apiToken?: string;
  };
  discord: {
    userId: string;
  };
}

function getEnvVar(name: string, required: boolean = true): string {
  const value = process.env[name];
  if (!value && required) {
    console.warn(`Warning: Missing environment variable: ${name}`);
    return '';
  }
  return value || '';
}

function loadConfig(): EnvConfig {
  return {
    supabase: {
      url: getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
      anonKey: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
      serviceKey: getEnvVar('SUPABASE_SERVICE_ROLE_KEY', false),
    },
    spotify: {
      clientId: getEnvVar('SPOTIFY_CLIENT_ID'),
      clientSecret: getEnvVar('SPOTIFY_CLIENT_SECRET'),
      refreshToken: getEnvVar('SPOTIFY_REFRESH_TOKEN'),
    },
    lastfm: {
      apiKey: getEnvVar('LASTFM_API_KEY'),
      username: getEnvVar('LASTFM_USERNAME'),
    },
    statsfm: {
      username: getEnvVar('STATSFM_USERNAME'),
    },
    steam: {
      apiKey: getEnvVar('STEAM_API_KEY'),
      steamId: getEnvVar('STEAM_ID'),
    },
    osu: {
      clientId: getEnvVar('OSU_CLIENT_ID'),
      clientSecret: getEnvVar('OSU_CLIENT_SECRET'),
      username: getEnvVar('OSU_USERNAME'),
    },
    github: {
      token: getEnvVar('GITHUB_TOKEN'),
      username: 'onlive1337',
    },
    yandex: {
      apiToken: getEnvVar('YANDEX_API_TOKEN', false),
    },
    discord: {
      userId: '1139593105969000449',
    },
  };
}

export const env = loadConfig();

export function validateEnv(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

