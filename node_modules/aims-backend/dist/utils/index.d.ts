export declare const generateId: () => string;
export declare const formatDate: (date: Date) => string;
export declare const validateEmail: (email: string) => boolean;
export declare const hashPassword: (password: string) => Promise<string>;
export declare const comparePassword: (password: string, hash: string) => Promise<boolean>;
export declare const generateToken: (payload: any) => string;
export declare const verifyToken: (token: string) => any;
export declare const sanitizeInput: (input: string) => string;
export declare const formatCurrency: (amount: number, currency?: string) => string;
export declare const generateSlug: (text: string) => string;
export declare const parsePagination: (page: string, limit: string) => {
    page: number;
    limit: number;
};
export declare const calculateOffset: (page: number, limit: number) => number;
export declare const formatResponse: (success: boolean, data: any, message?: string) => {
    success: boolean;
    data: any;
    message: string | undefined;
};
export declare const handleError: (error: any) => {
    success: boolean;
    message: string;
};
//# sourceMappingURL=index.d.ts.map