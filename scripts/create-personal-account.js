const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createPersonalAccount() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Supabase configuration');
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'set' : 'NOT SET');
    console.error('SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? 'set' : 'NOT SET');
    rl.close();
    process.exit(1);
  }

  // Create admin client with service role key
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    console.log('\n👤 Creating your personal account...\n');

    // Ask for email and password
    const email = await question('📧 Enter your email address: ');
    const password = await question('🔐 Enter your password (min 8 chars, uppercase, number, special char): ');
    const confirmPassword = await question('🔐 Confirm password: ');

    if (password !== confirmPassword) {
      console.error('\n❌ Passwords do not match');
      rl.close();
      process.exit(1);
    }

    if (password.length < 8) {
      console.error('\n❌ Password must be at least 8 characters');
      rl.close();
      process.exit(1);
    }

    console.log('\n⏳ Creating account in Supabase...');

    // Create user with admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Auto-confirm email so you don't need to verify
    });

    if (error) {
      console.error('\n❌ Error creating user:', error.message);
      rl.close();
      process.exit(1);
    }

    if (data.user) {
      console.log('\n✅ Account created successfully!\n');
      console.log('═══════════════════════════════════════════════════════');
      console.log('📧 Email: ' + email);
      console.log('🔐 Password: ' + password);
      console.log('═══════════════════════════════════════════════════════\n');
      console.log('📝 Next steps:');
      console.log('1. Go to http://localhost:3000/login');
      console.log('2. Click "Anmelden" (Sign In)');
      console.log('3. Enter your credentials above');
      console.log('4. You\'ll be logged in and can start entering your data!\n');
      console.log('🎉 Your account is ready to use!\n');
    }

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    rl.close();
    process.exit(1);
  }
}

createPersonalAccount();
