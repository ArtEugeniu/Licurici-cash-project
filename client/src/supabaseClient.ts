import { createClient } from "@supabase/supabase-js";

const supabaseUrl = 'https://sgutxiwyegggkmraizex.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNndXR4aXd5ZWdnZ2ttcmFpemV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MTkxNjYsImV4cCI6MjA2NzE5NTE2Nn0.XUwQij4VIXm8GXRFuNuZV21cX09wJpQ9Uo4fMiYPRz8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey);