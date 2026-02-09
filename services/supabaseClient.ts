
import { createClient } from '@supabase/supabase-js';

// Fallback to keys provided in the user's prompt if process.env is missing
const supabaseUrl = (process.env as any).SUPABASE_URL || 'https://uotsojonglujymvjggbv.supabase.co';
const supabaseAnonKey = (process.env as any).SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvdHNvam9uZ2x1anltdmpnZ2J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2MTYzNzEsImV4cCI6MjA4NjE5MjM3MX0.UoyaPGK_qXy1KrhI7roy6tJ6FkXU7BG0Fi-OlsbsYZo';

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
