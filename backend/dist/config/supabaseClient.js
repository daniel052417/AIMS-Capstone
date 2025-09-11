"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupabaseClient = exports.supabaseClient = exports.supabaseAdmin = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const env_1 = require("./env");
exports.supabaseAdmin = (0, supabase_js_1.createClient)(env_1.config.supabase.url, env_1.config.supabase.serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
exports.supabaseClient = (0, supabase_js_1.createClient)(env_1.config.supabase.url, env_1.config.supabase.anonKey);
const getSupabaseClient = (accessToken) => {
    if (!accessToken) {
        return exports.supabaseClient;
    }
    return (0, supabase_js_1.createClient)(env_1.config.supabase.url, env_1.config.supabase.anonKey, {
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }
    });
};
exports.getSupabaseClient = getSupabaseClient;
exports.default = exports.supabaseAdmin;
//# sourceMappingURL=supabaseClient.js.map