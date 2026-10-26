declare namespace Cloudflare {
  interface Env {
    CLINIC_AUTH_MODE?: 'cloudflare-access';
    ACCESS_TEAM_DOMAIN?: string;
    ACCESS_AUD?: string;
    DB?: D1Database;
    BUCKET?: R2Bucket;
  }
}
