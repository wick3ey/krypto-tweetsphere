
/// <reference types="vite/client" />

// Add module declarations for Deno imports used in Edge Functions
declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(handler: (req: Request) => Response | Promise<Response>): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2.38.4" {
  export * from "@supabase/supabase-js";
}

// Add Deno environment declaration
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

