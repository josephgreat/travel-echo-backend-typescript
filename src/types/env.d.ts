declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: "development" | "production";
    APP_NAME?: string;
    BASE_URL: string;
    CLOUDINARY_API_KEY: string;
    CLOUDINARY_API_SECRET: string;
    CLOUDINARY_CLOUD_NAME: string;
    CLOUDINARY_URL: string;
    EMAIL_HOST: string;
    EMAIL_PASSWORD: string;
    EMAIL_USER: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    JWT_SECRET: string;
    MONGODB_URI: string;
    PORT: string;
  }
}
