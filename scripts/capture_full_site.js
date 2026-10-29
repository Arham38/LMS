import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const outDir = path.resolve('docs/screenshots');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function loginApi(email, password) {
  const res = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(data)}`);
  }
  return data.data;
}

async function run() {
  console.log('Fetching admin and student sessions from API...');
  const adminAuth = await loginApi('admin@codecraft.academy', 'AdminSecurePass123!');
  const studentAuth = await loginApi('hamza.tariq@gmail.com', 'StudentPass123!');
  console.log('Authenticated successfully.');

  const browser = await chromium.launch({ headless: true });

  // -------------------------------------------------------------
  // 1. PUBLIC CONTEXT (Unauthenticated)
  // -------------------------------------------------------------
  const publicContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const publicPage = await publicContext.newPage();

  console.log('1. Capturing Landing Page with real courses...');
  await publicPage.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await publicPage.waitForTimeout(1000);
  await publicPage.screenshot({ path: path.join(outDir, '01_hero_landing.png') });

  console.log('2. Capturing Courses Catalog...');
  await publicPage.goto('http://localhost:5173/courses', { waitUntil: 'networkidle' });
  await publicPage.waitForTimeout(1000);
  await publicPage.screenshot({ path: path.join(outDir, '02_course_catalog.png') });

  console.log('3. Capturing Course Detail Page...');
  await publicPage.goto('http://localhost:5173/courses/mern-full-stack-engineering-batch-04', { waitUntil: 'networkidle' });
  await publicPage.waitForTimeout(1000);
  await publicPage.screenshot({ path: path.join(outDir, '03_course_detail.png') });

  console.log('4. Capturing Design System Styleguide...');
  await publicPage.goto('http://localhost:5173/styleguide', { waitUntil: 'networkidle' });
  await publicPage.waitForTimeout(800);
  await publicPage.screenshot({ path: path.join(outDir, '04_design_system_styleguide.png') });

  await publicContext.close();

  // -------------------------------------------------------------
  // 2. ADMIN CONTEXT (Logged in as Lead Instructor)
  // -------------------------------------------------------------
  const adminContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  // Pre-seed localStorage with admin auth token
  await adminContext.addInitScript(({ token, user }) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
  }, { token: adminAuth.token, user: adminAuth.user });

  const adminPage = await adminContext.newPage();

  console.log('5. Capturing Admin Dashboard...');
  await adminPage.goto('http://localhost:5173/admin/dashboard', { waitUntil: 'networkidle' });
  await adminPage.waitForTimeout(1200);
  await adminPage.screenshot({ path: path.join(outDir, '05_admin_dashboard.png') });

  console.log('6. Capturing Admin Courses Management...');
  await adminPage.goto('http://localhost:5173/admin/courses', { waitUntil: 'networkidle' });
  await adminPage.waitForTimeout(1000);
  await adminPage.screenshot({ path: path.join(outDir, '06_admin_courses.png') });

  console.log('7. Capturing Admin Operations Ledger & PKR Payments...');
  await adminPage.goto('http://localhost:5173/admin/ledger', { waitUntil: 'networkidle' });
  await adminPage.waitForTimeout(1200);
  await adminPage.screenshot({ path: path.join(outDir, '07_admin_ledger.png') });

  console.log('8. Capturing Admin Live Sessions & Scheduling...');
  await adminPage.goto('http://localhost:5173/admin/sessions', { waitUntil: 'networkidle' });
  await adminPage.waitForTimeout(1000);
  await adminPage.screenshot({ path: path.join(outDir, '08_admin_sessions.png') });

  await adminContext.close();

  // -------------------------------------------------------------
  // 3. STUDENT CONTEXT (Logged in as Hamza Tariq)
  // -------------------------------------------------------------
  const studentContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  await studentContext.addInitScript(({ token, user }) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));
  }, { token: studentAuth.token, user: studentAuth.user });

  const studentPage = await studentContext.newPage();

  console.log('9. Capturing Student Portal Dashboard...');
  await studentPage.goto('http://localhost:5173/student/dashboard', { waitUntil: 'networkidle' });
  await studentPage.waitForTimeout(1200);
  await studentPage.screenshot({ path: path.join(outDir, '09_student_dashboard.png') });

  console.log('10. Capturing Student Grades & Academic Performance...');
  await studentPage.goto('http://localhost:5173/student/grades', { waitUntil: 'networkidle' });
  await studentPage.waitForTimeout(1000);
  await studentPage.screenshot({ path: path.join(outDir, '10_student_grades.png') });

  await studentContext.close();
  await browser.close();

  console.log('🎉 All professional live screenshots captured successfully!');
}

run().catch((err) => {
  console.error('Fatal capture error:', err);
  process.exit(1);
});
