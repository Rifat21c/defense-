import "server-only";

import { createClient } from "@supabase/supabase-js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { isRealSupabaseConfig } from "@/lib/supabaseClient";
import type { AppData } from "@/lib/types";
import { buildSeedData, normalizeData, now } from "@/lib/seedData";

type AppStateRow = {
  id: string;
  data: AppData;
  updated_at?: string;
};

const STORE_ID = "default";
const STORE_PATH = join(process.cwd(), ".data", "app-store.json");

const globalStore = globalThis as typeof globalThis & {
  assessNovaAppData?: AppData;
  assessNovaBackendMode?: "supabase" | "local-json";
};

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!isRealSupabaseConfig(url, key)) return null;
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function readDiskStore() {
  try {
    if (!existsSync(STORE_PATH)) return null;
    return normalizeData(JSON.parse(readFileSync(STORE_PATH, "utf8")) as AppData);
  } catch {
    return null;
  }
}

function writeDiskStore(data: AppData) {
  try {
    mkdirSync(join(process.cwd(), ".data"), { recursive: true });
    writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
  } catch {
    // The in-memory cache still keeps the demo running if the filesystem is unavailable.
  }
}

async function readSupabaseStore() {
  const client = supabaseAdmin();
  if (!client) return null;

  const { data, error } = await client
    .from("app_state")
    .select("id,data,updated_at")
    .eq("id", STORE_ID)
    .maybeSingle<AppStateRow>();

  if (error || !data?.data) return null;
  return normalizeData(data.data);
}

async function writeSupabaseStore(data: AppData) {
  const client = supabaseAdmin();
  if (!client) return false;

  const { error } = await client.from("app_state").upsert({
    id: STORE_ID,
    data,
    updated_at: now(),
  });

  return !error;
}

export function backendMode() {
  return globalStore.assessNovaBackendMode || (supabaseAdmin() ? "supabase" : "local-json");
}

export async function readAppData() {
  const supabaseData = await readSupabaseStore();
  if (supabaseData) {
    globalStore.assessNovaBackendMode = "supabase";
    globalStore.assessNovaAppData = supabaseData;
    writeDiskStore(supabaseData);
    return supabaseData;
  }

  if (globalStore.assessNovaAppData) return normalizeData(globalStore.assessNovaAppData);

  const diskData = readDiskStore();
  if (diskData) {
    globalStore.assessNovaBackendMode = "local-json";
    globalStore.assessNovaAppData = diskData;
    return diskData;
  }

  const seed = buildSeedData();
  await writeAppData(seed);
  return seed;
}

export async function writeAppData(input: AppData) {
  const data = normalizeData(input);
  globalStore.assessNovaAppData = data;
  writeDiskStore(data);
  globalStore.assessNovaBackendMode = (await writeSupabaseStore(data)) ? "supabase" : "local-json";
  return data;
}

export async function resetAppData() {
  const seed = buildSeedData();
  return writeAppData(seed);
}
