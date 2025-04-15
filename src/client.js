import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pitpougbnibmfrjykzet.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpdHBvdWdibmlibWZyanlremV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0NTA5NjcsImV4cCI6MjA1MDAyNjk2N30.ddXIz0yG_jzDHxL9wjj3fQJUQXOIPumHfPIlMbyJZQo';

export const supabase = createClient(supabaseUrl, supabaseKey);
