const { createClient } = require("@supabase/supabase-js");
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listBrandingFiles() {
  const { data, error } = await supabase.storage
    .from("branding")
    .list("", { limit: 100 });

  if (error) {
    console.log("Error listing files:", error.message);
    return;
  }

  console.log("Files in branding bucket:");
  if (data && data.length > 0) {
    data.forEach(file => {
      const { data: urlData } = supabase.storage.from("branding").getPublicUrl(file.name);
      console.log("  -", file.name, "->", urlData.publicUrl);
    });
  } else {
    console.log("  (no files found)");
  }
}

listBrandingFiles();
