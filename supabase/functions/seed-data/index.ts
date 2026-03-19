import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const results: string[] = [];

  // Helper to create user + profile
  const createUser = async (email: string, name: string, role: string, approvalStatus: string, password = "Test@1234") => {
    const { data: existing } = await supabaseAdmin.from("profiles").select("id").eq("email", email).maybeSingle();
    if (existing) {
      results.push(`Skipped ${email} (exists)`);
      return existing.id;
    }
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role },
    });
    if (error) {
      results.push(`Error creating ${email}: ${error.message}`);
      return null;
    }
    // Update profile to correct role/status (trigger may have set it)
    await supabaseAdmin.from("profiles").update({ name, role, approval_status: approvalStatus }).eq("id", data.user.id);
    results.push(`Created ${email} (${role}/${approvalStatus})`);
    return data.user.id;
  };

  // Students
  const s1 = await createUser("24cs101@mgits.ac.in", "Arjun Krishnan", "student", "approved");
  const s2 = await createUser("24ec215@mgits.ac.in", "Meera Nair", "student", "approved");
  const s3 = await createUser("23me310@mgits.ac.in", "Vishnu Prasad", "student", "approved");
  const s4 = await createUser("24cy434@mgits.ac.in", "Anjali Thomas", "student", "approved");
  const s5 = await createUser("23cs205@mgits.ac.in", "Rahul Menon", "student", "approved");
  const s6 = await createUser("24ee118@mgits.ac.in", "Devika S", "student", "approved");

  // Approved faculty
  const f1 = await createUser("sureshk@mgits.ac.in", "Dr. Suresh Kumar", "faculty", "approved");
  const f2 = await createUser("lakshmir@mgits.ac.in", "Prof. Lakshmi R", "faculty", "approved");
  const f3 = await createUser("anandp@mgits.ac.in", "Dr. Anand Pillai", "faculty", "approved");

  // Pending faculty
  await createUser("rajanv@mgits.ac.in", "Prof. Rajan Varma", "faculty", "pending");
  await createUser("priyam@mgits.ac.in", "Dr. Priya Mohan", "faculty", "pending");

  // Categories
  const catData = [
    { name: "Plumbing", description: "Water leaks, pipe issues, drainage problems" },
    { name: "Electrical", description: "Power outages, faulty wiring, switch repairs" },
    { name: "Housekeeping", description: "Cleanliness, waste disposal, sanitation" },
    { name: "IT & Network", description: "WiFi issues, lab equipment, projector problems" },
    { name: "Infrastructure", description: "Building maintenance, furniture, classroom facilities" },
  ];

  const catIds: string[] = [];
  for (const cat of catData) {
    const { data: existingCat } = await supabaseAdmin.from("categories").select("id").eq("name", cat.name).maybeSingle();
    if (existingCat) {
      catIds.push(existingCat.id);
      continue;
    }
    const { data: newCat } = await supabaseAdmin.from("categories").insert(cat).select("id").single();
    if (newCat) catIds.push(newCat.id);
  }
  results.push(`Categories: ${catIds.length} ready`);

  // Category-faculty assignments
  if (f1 && f2 && f3 && catIds.length === 5) {
    const assignments = [
      { category_id: catIds[0], faculty_id: f1 },
      { category_id: catIds[1], faculty_id: f1 },
      { category_id: catIds[2], faculty_id: f2 },
      { category_id: catIds[3], faculty_id: f3 },
      { category_id: catIds[4], faculty_id: f2 },
    ];
    for (const a of assignments) {
      const { data: ex } = await supabaseAdmin.from("category_faculty").select("id").eq("category_id", a.category_id).eq("faculty_id", a.faculty_id).maybeSingle();
      if (!ex) await supabaseAdmin.from("category_faculty").insert(a);
    }
    results.push("Category-faculty assignments done");

    // Complaints from students
    const studentComplaints = [
      { user_id: s1!, category_id: catIds[0], title: "Water leak in S4 CS classroom", description: "There is a continuous water leak from the ceiling near the last row of benches in S4 CS classroom. It gets worse when it rains and damages notebooks.", visibility: "public", status: "pending", assigned_to: f1 },
      { user_id: s2!, category_id: catIds[1], title: "Power socket not working in ECE Lab", description: "Multiple power sockets on bench 4 and 5 in ECE Lab 2 are not working. We cannot charge our laptops during lab hours.", visibility: "public", status: "processing", assigned_to: f1 },
      { user_id: s3!, category_id: catIds[2], title: "Washroom near ME block unhygienic", description: "The washroom on the 2nd floor of ME block has not been cleaned for days. No water supply and dustbin overflowing.", visibility: "public", status: "done", assigned_to: f2 },
      { user_id: s4!, category_id: catIds[3], title: "WiFi not working in Library", description: "The campus WiFi has been extremely slow in the library for the past week. Cannot access online journals or submit assignments.", visibility: "public", status: "pending", assigned_to: f3 },
      { user_id: s5!, category_id: catIds[4], title: "Broken chair in S6 CS classroom", description: "Three chairs in the back row of S6 CS classroom are broken. One collapsed while a student was sitting.", visibility: "public", status: "processing", assigned_to: f2 },
      { user_id: s6!, category_id: catIds[0], title: "Drainage overflow near EEE block entrance", description: "The drain near EEE block main entrance overflows during rain causing waterlogging.", visibility: "public", status: "undone", assigned_to: f1 },
      { user_id: s1!, category_id: catIds[1], title: "Flickering lights in seminar hall", description: "The tube lights in the main seminar hall keep flickering during presentations.", visibility: "private", status: "pending", assigned_to: f1 },
      { user_id: s4!, category_id: catIds[2], title: "Canteen area not cleaned properly", description: "Dining tables in the canteen are sticky and not wiped after lunch hours. Flies are a major issue.", visibility: "public", status: "pending", assigned_to: f2 },
    ];

    // Complaints from faculty
    const facultyComplaints = [
      { user_id: f2!, category_id: catIds[3], title: "Projector malfunction in CS Dept", description: "The projector in Room 301 CS department shows yellow tint and overheats after 30 minutes. Urgent replacement needed.", visibility: "public", status: "pending", assigned_to: f3 },
      { user_id: f3!, category_id: catIds[4], title: "AC not working in faculty cabin", description: "The AC unit in IT faculty cabin (Room 204) has stopped working completely. Temperature unbearable during afternoon.", visibility: "private", status: "processing", assigned_to: f2 },
    ];

    const allComplaints = [...studentComplaints, ...facultyComplaints];
    for (const c of allComplaints) {
      const { data: ex } = await supabaseAdmin.from("complaints").select("id").eq("title", c.title).maybeSingle();
      if (!ex) await supabaseAdmin.from("complaints").insert(c);
    }
    results.push(`Inserted ${allComplaints.length} complaints`);
  }

  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
