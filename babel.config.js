const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '.env');

function readEnvVars() {
  try {
    if (!fs.existsSync(envPath)) {
      console.warn('[babel] .env file not found at:', envPath);
      return {};
    }
    let content = fs.readFileSync(envPath, 'utf8');
    content = content.replace(/^\uFEFF/, '');
    const parsed = dotenv.parse(content);
    const clean = (key) =>
      String(parsed[key] ?? '')
        .trim()
        .replace(/^['"]|['"]$/g, '');
    const result = {
      ANTHROPIC_API_KEY: clean('ANTHROPIC_API_KEY'),
      SUPABASE_URL: clean('SUPABASE_URL'),
      SUPABASE_ANON_KEY: clean('SUPABASE_ANON_KEY'),
    };
    if (process.env.DEBUG_BABEL) {
      console.log('[babel] Loaded env vars:', {
        SUPABASE_URL: result.SUPABASE_URL ? '✓' : '✗',
        SUPABASE_ANON_KEY: result.SUPABASE_ANON_KEY ? '✓' : '✗',
      });
    }
    return result;
  } catch (e) {
    console.warn('[babel] Could not read .env:', e.message);
    return {};
  }
}

module.exports = function (api) {
  api.cache.using(() => {
    try {
      return fs.statSync(envPath).mtimeMs;
    } catch {
      return 'no-env-file';
    }
  });

  const env = readEnvVars();

  const definePlugin = [
    'babel-plugin-transform-define',
    {
      'process.env.ANTHROPIC_API_KEY': env.ANTHROPIC_API_KEY ? JSON.stringify(env.ANTHROPIC_API_KEY) : '""',
      'process.env.SUPABASE_URL': env.SUPABASE_URL ? JSON.stringify(env.SUPABASE_URL) : '""',
      'process.env.SUPABASE_ANON_KEY': env.SUPABASE_ANON_KEY ? JSON.stringify(env.SUPABASE_ANON_KEY) : '""',
    },
  ];

  return {
    presets: ['module:@react-native/babel-preset'],
    plugins: [
      definePlugin,
      // ✅ MUST BE LAST
      'react-native-reanimated/plugin',
    ],
  };
};