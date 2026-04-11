import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://ebzrvmmyhqkzjivxasjj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVienJ2bW15aHFremppdnhhc2pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NTE0MTUsImV4cCI6MjA5MTQyNzQxNX0.kVBRJT5CQzwaHJjoNkMLJG8Uo0GNxhKtsTMjzZ_hNxw'
);