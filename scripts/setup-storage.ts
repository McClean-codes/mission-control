import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupStorage() {
  try {
    console.log('Checking for task-images bucket...');
    
    // List existing buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      console.log('Note: Bucket creation may require admin key via Supabase dashboard');
      process.exit(0);
    }

    const taskImagesBucket = buckets?.find(b => b.name === 'task-images');
    
    if (taskImagesBucket) {
      console.log('✓ task-images bucket exists');
      process.exit(0);
    }

    console.log('task-images bucket not found. Create it via Supabase dashboard:');
    console.log('1. Go to Storage section');
    console.log('2. Create new bucket named "task-images"');
    console.log('3. Enable public access');
    process.exit(0);
  } catch (error) {
    console.error('Setup error:', error);
    process.exit(1);
  }
}

setupStorage();
