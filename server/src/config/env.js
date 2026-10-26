import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required').default('mongodb://localhost:27017/lms_dev'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters').default('development_super_secret_jwt_key_with_at_least_32_chars'),
  JWT_EXPIRE: z.string().default('7d'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  ADMIN_NAME: z.string().default('Admin Instructor'),
  ADMIN_EMAIL: z.string().email().default('admin@codecraft.academy'),
  ADMIN_PASSWORD: z.string().min(8).default('AdminSecurePass123!'),
  // Supabase Storage (Small files only: pdf, image, zip)
  SUPABASE_URL: z.string().url().default('https://rhphhmpardsfkrtrpqfk.supabase.co'),
  SUPABASE_ANON_KEY: z.string().default('development_supabase_anon_key'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default('development_supabase_service_role_key'),
  SUPABASE_BUCKET: z.string().default('uploads'),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Environment configuration error:');
    result.error.issues.forEach((issue) => {
      console.error(` - ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
  }
  return result.data;
};

export const env = parseEnv();
export default env;
