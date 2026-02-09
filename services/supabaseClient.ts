
import { createClient } from '@supabase/supabase-js';

// Fallback to keys provided in the user's prompt if process.env is missing
const supabaseUrl = (process.env as any).SUPABASE_URL;
const supabaseAnonKey = (process.env as any).SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase credentials are missing. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const saveDiagnosticReport = async (report: {
  mode: string;
  history: any[];
  timestamp: string;
  userId?: string;
}) => {
  if (!supabase) throw new Error("Supabase configuration missing.");

  const { data, error } = await supabase
    .from('diagnostic_reports')
    .insert([
      {
        mode: report.mode,
        content: JSON.stringify(report.history),
        created_at: report.timestamp,
        user_id: report.userId
      },
    ]);

  if (error) throw error;
  return data;
};
