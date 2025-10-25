// RBAC policy configuration (draft)
// Evaluation order: first match wins. Use RegExp for flexibility.
// Roles: 'USER' | 'TRAINER' | 'ADMIN'
// Plans: 'FREE' | 'PREMIUM'

const policy = {
  rules: [
    // Admin area
    { pattern: /^\/api\/admin\//, roles: ['ADMIN'] },

    // Trainer area
    { pattern: /^\/api\/trainer\//, roles: ['TRAINER', 'ADMIN'] },

    // Premium-only features
    { pattern: /^\/api\/premium\//, plans: ['PREMIUM'] },

    // Authenticated common endpoints
    { pattern: /^\/api\/auth\/me$/, roles: ['USER', 'TRAINER', 'ADMIN'] },

    // Public endpoints (list here for clarity; middleware may skip them)
    { pattern: /^\/api\/auth\/register$/, public: true },
    { pattern: /^\/api\/auth\/login$/, public: true },
    { pattern: /^\/api\/auth\/refresh$/, public: true },
    { pattern: /^\/api\/auth\/check-(username|email|phone)$/, public: true },
  ],
};

export default policy;

