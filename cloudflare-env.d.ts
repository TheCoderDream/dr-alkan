declare namespace Cloudflare {
  interface Env {
    CLINIC_AUTH_MODE?: 'cloudflare-access'|'password';
    STAFF_USERNAME?: string;
    STAFF_PASSWORD?: string;
    STAFF_EMAIL?: string;
    ACCESS_TEAM_DOMAIN?: string;
    ACCESS_AUD?: string;
    DB?: D1Database;
    BUCKET?: R2Bucket;
  }
}
