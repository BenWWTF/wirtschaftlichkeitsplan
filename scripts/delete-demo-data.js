const fs = require('fs');
const path = require('path');

// Load .env.local manually
const envFile = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    }
  });
}

const { createClient } = require('@supabase/supabase-js');

async function deleteDemo() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'set' : 'NOT SET');
    console.error('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:', process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? 'set' : 'NOT SET');
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'NOT SET');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000';

  try {
    console.log('Starting deletion of demo data...\n');

    console.log('1. Deleting monthly_plans...');
    const result1 = await supabase.from('monthly_plans').delete().eq('user_id', DEMO_USER_ID);
    if (result1.error) {
      console.error('  Error:', result1.error.message);
    } else {
      console.log('  ✓ Deleted successfully');
    }

    console.log('2. Deleting expenses...');
    const result2 = await supabase.from('expenses').delete().eq('user_id', DEMO_USER_ID);
    if (result2.error) {
      console.error('  Error:', result2.error.message);
    } else {
      console.log('  ✓ Deleted successfully');
    }

    console.log('3. Deleting therapy_types...');
    const result3 = await supabase.from('therapy_types').delete().eq('user_id', DEMO_USER_ID);
    if (result3.error) {
      console.error('  Error:', result3.error.message);
    } else {
      console.log('  ✓ Deleted successfully');
    }

    console.log('4. Deleting practice_settings...');
    const result4 = await supabase.from('practice_settings').delete().eq('user_id', DEMO_USER_ID);
    if (result4.error) {
      console.error('  Error:', result4.error.message);
    } else {
      console.log('  ✓ Deleted successfully');
    }

    console.log('\n✅ Demo data deleted successfully!\n');
    console.log('The dashboard will be clean after you refresh the page.');
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

deleteDemo();
