const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local
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

async function setupAccount() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Supabase configuration');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const email = 'b.missbach@gmail.com';
  const password = 'bayern2025';

  try {
    console.log('\n👤 Creating your personal account...\n');
    console.log('📧 Email: ' + email);
    console.log('🔐 Password: ••••••••\n');

    // Create user with admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Auto-confirm email
    });

    if (error) {
      console.error('❌ Error creating user:', error.message);
      process.exit(1);
    }

    if (data.user) {
      console.log('✅ Account created successfully!\n');
      console.log('═══════════════════════════════════════════════════════');
      console.log('📧 Email: ' + email);
      console.log('🔐 Password: bayern2025');
      console.log('═══════════════════════════════════════════════════════\n');
      console.log('📝 Next steps:');
      console.log('1. Go to http://localhost:3000/login');
      console.log('2. Click "Anmelden" (Sign In)');
      console.log('3. Enter your credentials above');
      console.log('4. You\'ll be logged in to YOUR dashboard!\n');
      console.log('🎉 Your account is ready to use with your own data!\n');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

setupAccount();
