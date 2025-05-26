// Conexion con supabase aqui va el api key y la url

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zfiabhnqifmyzpveqifp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmaWFiaG5xaWZteXpwdmVxaWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5NzAxMDUsImV4cCI6MjA2MzU0NjEwNX0.h0lQD849Luw7hlGUmqHwadtR-4z0-G_hQRRkFowCBqs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
