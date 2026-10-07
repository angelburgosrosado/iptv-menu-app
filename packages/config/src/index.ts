import dotenv from 'dotenv';
dotenv.config();

export interface AppEnvConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  APP_ENV: 'dev' | 'staging' | 'prod';
  GOOGLE_CLOUD_PROJECT: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_CLIENT_EMAIL: string;
  FIREBASE_PRIVATE_KEY: string;
  FIREBASE_WEB_API_KEY: string;
  FIREBASE_AUTH_DOMAIN: string;
  FIREBASE_STORAGE_BUCKET: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_PRICE_PRO_MONTHLY?: string;
  STRIPE_PRICE_PRO_YEARLY?: string;
  STRIPE_PRICE_PRO_LIFETIME?: string;
  STRIPE_PRICE_BUILDER_MONTHLY?: string;
  STRIPE_PRICE_BUILDER_YEARLY?: string;
  STRIPE_PRICE_BUILDER_LIFETIME?: string;
  GCS_UPLOAD_BUCKET: string;
  GCS_OUTPUT_BUCKET: string;
  GCS_BUILD_BUCKET: string;
  INTERNAL_WORKER_URL: string;
  ADMIN_ALLOWED_EMAILS: string[];
  EXPO_ACCESS_TOKEN?: string;
  EXPO_ACCOUNT_NAME?: string;
  EXPO_PROJECT_ID?: string;
  JWT_SECRET: string;
}

export const config: AppEnvConfig = {
  NODE_ENV: (process.env.NODE_ENV as any) || 'development',
  APP_ENV: (process.env.APP_ENV as any) || 'dev',
  JWT_SECRET: process.env.JWT_SECRET || 'iptv_menu_default_jwt_signing_key_replace_in_production',
  GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT || 'iptv-menu-dev',
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'iptv-menu-dev',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',
  FIREBASE_PRIVATE_KEY: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  FIREBASE_WEB_API_KEY: process.env.FIREBASE_WEB_API_KEY || '',
  FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN || `${process.env.FIREBASE_PROJECT_ID}.firebaseapp.com`,
  FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  STRIPE_PRICE_PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_1UHwUyKXruwBPCzFT7aMvpJ6',
  STRIPE_PRICE_PRO_YEARLY: process.env.STRIPE_PRICE_PRO_YEARLY || 'price_1UHwUzKXruwBPCzF2iAGrzwY',
  STRIPE_PRICE_PRO_LIFETIME: process.env.STRIPE_PRICE_PRO_LIFETIME || 'price_1UHwUzKXruwBPCzFk6J0hUie',
  STRIPE_PRICE_BUILDER_MONTHLY: process.env.STRIPE_PRICE_BUILDER_MONTHLY || 'price_1UHwUzKXruwBPCzFCGewmHQf',
  STRIPE_PRICE_BUILDER_YEARLY: process.env.STRIPE_PRICE_BUILDER_YEARLY || 'price_1UHwUzKXruwBPCzF4WJ4W6hQ',
  STRIPE_PRICE_BUILDER_LIFETIME: process.env.STRIPE_PRICE_BUILDER_LIFETIME || 'price_1UHwUzKXruwBPCzFfophCqlM',
  GCS_UPLOAD_BUCKET: process.env.GCS_UPLOAD_BUCKET || 'iptv-menu-prod-user-uploads',
  GCS_OUTPUT_BUCKET: process.env.GCS_OUTPUT_BUCKET || 'iptv-menu-prod-generated-assets',
  GCS_BUILD_BUCKET: process.env.GCS_BUILD_BUCKET || 'iptv-menu-prod-build-artifacts',
  INTERNAL_WORKER_URL: process.env.INTERNAL_WORKER_URL || 'http://iptv-worker:3000',
  ADMIN_ALLOWED_EMAILS: Array.from(new Set([
    'angelburgosrosado@gmail.com',
    ...(process.env.ADMIN_ALLOWED_EMAILS || '')
      .split(',')
      .map(email => email.trim().toLowerCase())
      .filter(Boolean)
  ])),
  EXPO_ACCESS_TOKEN: process.env.EXPO_ACCESS_TOKEN || '',
  EXPO_ACCOUNT_NAME: process.env.EXPO_ACCOUNT_NAME || '',
  EXPO_PROJECT_ID: process.env.EXPO_PROJECT_ID || '',
};

export const features = {
  enableStripeBilling: !!config.STRIPE_SECRET_KEY,
  enableHeavyWorkers: config.NODE_ENV === 'production',
  enableExpoBuildOrchestration: false, // Flag for future Expo/mobile integration
};
