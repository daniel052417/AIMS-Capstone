export declare const config: {
    port: number;
    nodeEnv: string;
    frontendUrl: string;
    supabase: {
        url: string;
        anonKey: string;
        serviceRoleKey: string;
    };
    jwt: {
        secret: string;
        expiresIn: string;
        refreshExpiresIn: string;
    };
    upload: {
        maxFileSize: number;
        allowedImageTypes: string[];
        uploadPath: string;
    };
    rateLimit: {
        windowMs: number;
        max: number;
    };
    database: {
        connectionString: string;
        ssl: boolean;
    };
};
export default config;
//# sourceMappingURL=env.d.ts.map