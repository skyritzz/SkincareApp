// babel-plugin-transform-define inlines process.env.ANTHROPIC_API_KEY from .env at build time.
declare namespace NodeJS {
  interface ProcessEnv {
    ANTHROPIC_API_KEY?: string;
    SUPABASE_URL?: string;
    SUPABASE_ANON_KEY?: string;
  }
}

// Metro provides `process` at runtime; avoid pulling in all @types/node for RN.
declare const process: {
  env: NodeJS.ProcessEnv;
};
