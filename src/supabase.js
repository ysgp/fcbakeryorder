// File: src/supabase.js (已修正為使用環境變數)

import { createClient } from '@supabase/supabase-js';

// 1. 透過 import.meta.env 讀取環境變數
// ❗ 必須使用 VITE_ 前綴才能在 Vite/React 中被公開存取
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL; 
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 2. 檢查變數是否確實載入
if (!supabaseUrl || !supabaseAnonKey) {
  // 如果在開發或部署環境中缺少金鑰，則拋出錯誤
  // 這樣能避免應用程式在無法連線資料庫的情況下啟動
  throw new Error('Supabase 環境變數 VITE_SUPABASE_URL 或 VITE_SUPABASE_ANON_KEY 遺失。請檢查 .env 檔案或 Vercel/Netlify 的環境變數設定。');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);