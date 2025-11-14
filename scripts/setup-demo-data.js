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

const { createClient } = require('@supabase/supabase-js');

async function setupDemoData() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const demoUserId = process.env.NEXT_PUBLIC_DEMO_USER_ID;

  if (!supabaseUrl || !supabaseKey || !demoUserId) {
    console.error('❌ Missing environment variables');
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'set' : 'NOT SET');
    console.error('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:', supabaseKey ? 'set' : 'NOT SET');
    console.error('NEXT_PUBLIC_DEMO_USER_ID:', demoUserId ? 'set' : 'NOT SET');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('🧪 Setting up demo data for testing...\n');

    // 1. Create therapy types
    console.log('1️⃣ Creating therapy types...');
    const { data: therapies, error: therapyError } = await supabase
      .from('therapy_types')
      .insert([
        {
          user_id: demoUserId,
          name: 'Physiotherapy',
          price_per_session: 80,
          variable_cost_per_session: 20
        },
        {
          user_id: demoUserId,
          name: 'Psychological Counseling',
          price_per_session: 100,
          variable_cost_per_session: 25
        },
        {
          user_id: demoUserId,
          name: 'Occupational Therapy',
          price_per_session: 90,
          variable_cost_per_session: 22
        }
      ])
      .select();

    if (therapyError) {
      console.log('   ⚠️ Error or already exists:', therapyError.message);
    } else {
      console.log('   ✅ Created therapy types');
    }

    // 2. Create practice settings
    console.log('2️⃣ Creating practice settings...');
    const { error: settingsError } = await supabase
      .from('practice_settings')
      .insert({
        user_id: demoUserId,
        practice_name: 'Demo Therapy Practice',
        practice_address: '123 Main Street, Demo City',
        practice_phone: '+43 1 234 5678',
        practice_email: 'info@demopractice.at',
        tax_id: 'ATU12345678'
      });

    if (settingsError && !settingsError.message.includes('duplicate')) {
      console.log('   ⚠️ Error:', settingsError.message);
    } else {
      console.log('   ✅ Created practice settings');
    }

    // 3. Create expenses
    console.log('3️⃣ Creating sample expenses...');
    const now = new Date();
    const expenses = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      expenses.push({
        user_id: demoUserId,
        name: `Office rent - Month ${12 - i}`,
        amount: 1200,
        expense_date: date.toISOString().split('T')[0],
        category: 'Rent'
      });
    }

    const { error: expenseError } = await supabase
      .from('expenses')
      .insert(expenses);

    if (expenseError) {
      console.log('   ⚠️ Error:', expenseError.message);
    } else {
      console.log('   ✅ Created sample expenses');
    }

    // 4. Create monthly plans
    console.log('4️⃣ Creating sample monthly plans...');
    const therapyIds = therapies?.map(t => t.id) || [];
    const plans = [];

    for (let month = 0; month < 3; month++) {
      const date = new Date();
      date.setMonth(date.getMonth() - month);
      const monthStr = date.toISOString().substring(0, 7) + '-01';

      for (const therapyId of therapyIds) {
        plans.push({
          user_id: demoUserId,
          month: monthStr,
          therapy_type_id: therapyId,
          planned_sessions: 4 + Math.floor(Math.random() * 4),
          actual_sessions: Math.floor(Math.random() * 4)
        });
      }
    }

    const { error: planError } = await supabase
      .from('monthly_plans')
      .insert(plans);

    if (planError) {
      console.log('   ⚠️ Error:', planError.message);
    } else {
      console.log('   ✅ Created sample monthly plans');
    }

    console.log('\n✅ Demo data setup complete!\n');
    console.log('You can now access the dashboard at: http://localhost:3000/login');
    console.log('Click "Zum Dashboard (Demo-Modus)" to access the demo dashboard.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

setupDemoData();
