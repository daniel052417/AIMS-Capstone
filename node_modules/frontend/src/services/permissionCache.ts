class PermissionCache {
    private cache = new Map<string, { data: any; timestamp: number }>();
    private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  
    set(key: string, data: any): void {
      this.cache.set(key, {
        data,
        timestamp: Date.now()
      });
    }
  
    get(key: string): any | null {
      const cached = this.cache.get(key);
      if (!cached) return null;
  
      if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
        this.cache.delete(key);
        return null;
      }
  
      return cached.data;
    }
  
    clear(): void {
      this.cache.clear();
    }
  
    clearUserData(userId: string): void {
      const keysToDelete = Array.from(this.cache.keys()).filter(key => 
        key.includes(userId)
      );
      keysToDelete.forEach(key => this.cache.delete(key));
    }
  }
  
  export const permissionCache = new PermissionCache();