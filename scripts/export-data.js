#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.resolve('.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  if (line && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

// Create Supabase client with service role (full access)
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function listUsers() {
  console.log('📋 Fetching users from Supabase...\n');

  try {
    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('❌ Error fetching users:', error);
      process.exit(1);
    }

    if (data.users.length === 0) {
      console.log('⚠️  No users found in this Supabase project');
      process.exit(0);
    }

    console.log(`Found ${data.users.length} user(s):\n`);
    data.users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (ID: ${user.id})`);
    });

    return data.users;
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

async function exportUserData(userId) {
  console.log(`\n📤 Exporting data for user: ${userId}\n`);

  try {
    // Fetch therapy types
    const { data: therapyTypes, error: ttError } = await supabase
      .from('therapy_types')
      .select('*')
      .eq('user_id', userId);

    if (ttError) throw ttError;

    // Fetch monthly plans
    const { data: monthlyPlans, error: mpError } = await supabase
      .from('monthly_plans')
      .select('*')
      .eq('user_id', userId);

    if (mpError) throw mpError;

    // Fetch expenses
    const { data: expenses, error: expError } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId);

    if (expError) throw expError;

    // Fetch practice settings
    const { data: practiceSettings, error: psError } = await supabase
      .from('practice_settings')
      .select('*')
      .eq('user_id', userId);

    if (psError) throw psError;

    // Create export object
    const exportData = {
      exportDate: new Date().toISOString(),
      userId,
      therapyTypes: therapyTypes || [],
      monthlyPlans: monthlyPlans || [],
      expenses: expenses || [],
      practiceSettings: practiceSettings || [],
    };

    // Save to JSON file
    const filename = `export-${userId}-${Date.now()}.json`;
    const filepath = path.join('scripts', 'exports', filename);

    // Create exports directory if it doesn't exist
    const exportDir = path.join('scripts', 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2));

    console.log(`✅ Data exported successfully!\n`);
    console.log(`📊 Summary:`);
    console.log(`   - Therapy Types: ${therapyTypes?.length || 0}`);
    console.log(`   - Monthly Plans: ${monthlyPlans?.length || 0}`);
    console.log(`   - Expenses: ${expenses?.length || 0}`);
    console.log(`   - Practice Settings: ${practiceSettings?.length || 0}`);
    console.log(`\n💾 File saved to: ${filepath}`);

    return filepath;
  } catch (err) {
    console.error('❌ Error exporting data:', err.message);
    process.exit(1);
  }
}

async function main() {
  console.log('🚀 Wirtschaftlichkeitsplan Data Export Tool\n');
  console.log('=' .repeat(50) + '\n');

  const users = await listUsers();

  // If only one user, export automatically
  if (users.length === 1) {
    console.log(`\n✨ Only one user found, exporting automatically...\n`);
    await exportUserData(users[0].id);
  } else {
    // For multiple users, ask which one to export
    console.log('\nℹ️  To export a specific user, run:');
    console.log('   node scripts/export-data.js <user-id>\n');
    console.log('Example:');
    console.log(`   node scripts/export-data.js ${users[0].id}\n`);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args[0]) {
  exportUserData(args[0]).catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
} else {
  main();
}
