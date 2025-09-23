# Dynamic Rendering Testing Guide

## 🎯 **Overview**

This guide provides comprehensive testing instructions for the newly implemented dynamic rendering system based on user roles and permissions. The system now includes error handling, fallback UI, and permission-based component rendering.

## 🚀 **What's Been Implemented**

### ✅ **New Components Created**
1. **UnauthorizedPage.tsx** - Handles access denied scenarios
2. **ErrorBoundary.tsx** - Catches and handles permission errors
3. **FallbackUI.tsx** - Consistent error/loading states
4. **MainLayout.tsx** - Layout with dynamic sidebar integration
5. **useFeatureFlag.ts** - Feature flag system for advanced permissions

### ✅ **Enhanced Existing Components**
1. **UserAccounts.tsx** - Now uses DynamicButton and PermissionWrapper
2. **UserPermissions.tsx** - Protected with permission checks
3. **App.tsx** - Wrapped with error boundaries and unauthorized route
4. **routes.ts** - Added unauthorized route configuration

---

## 🧪 **Testing Instructions**

### **Phase 1: Basic Authentication & Error Handling**

#### **Test 1: Login Flow**
```bash
# Start your backend server
cd backend
npm run dev

# Start your frontend server
cd frontend
npm run dev
```

**Steps:**
1. Open browser to `http://localhost:3000` (or your frontend port)
2. **Expected**: Login form should appear
3. Try logging in with invalid credentials
4. **Expected**: Error message should display
5. Try logging in with valid credentials
6. **Expected**: Should redirect to dashboard

#### **Test 2: Unauthorized Access**
**Steps:**
1. Log in with a user that has limited permissions
2. Try to access `/admin/roles` directly in URL
3. **Expected**: Should redirect to `/unauthorized` page
4. **Expected**: Unauthorized page should show:
   - Shield icon
   - "Access Denied" message
   - "Go Back" and "Go to Dashboard" buttons
   - Attempted route information

#### **Test 3: Error Boundary**
**Steps:**
1. Open browser dev tools (F12)
2. Go to Console tab
3. Try to trigger a JavaScript error (you can add `throw new Error('Test error')` in a component)
4. **Expected**: Error boundary should catch the error and show:
   - Alert triangle icon
   - "Something went wrong" message
   - "Reload Page" and "Go to Dashboard" buttons
   - Error details in development mode

### **Phase 2: Dynamic Component Rendering**

#### **Test 4: PermissionWrapper in UserAccounts**
**Steps:**
1. Log in with a user that has `users.read` permission
2. Navigate to `/admin/users`
3. **Expected**: User table should load normally
4. Log out and log in with a user that lacks `users.read` permission
5. Navigate to `/admin/users`
6. **Expected**: Should see "You don't have permission to view users" message

#### **Test 5: DynamicButton in UserAccounts**
**Steps:**
1. Log in with a user that has `users.create` permission
2. Navigate to `/admin/users`
3. **Expected**: "Add User" button should be visible
4. Log out and log in with a user that lacks `users.create` permission
5. Navigate to `/admin/users`
6. **Expected**: "Add User" button should be replaced with permission message

#### **Test 6: Action Buttons in User Table**
**Steps:**
1. Log in with a user that has various user permissions
2. Navigate to `/admin/users`
3. **Expected**: Action buttons (Eye, Edit, Shield, Trash) should show based on permissions:
   - `users.read` → Eye button visible
   - `users.update` → Edit button visible
   - `users.manage_roles` → Shield button visible
   - `users.delete` → Trash button visible

### **Phase 3: PermissionWrapper in UserPermissions**

#### **Test 7: UserPermissions Access Control**
**Steps:**
1. Log in with a user that has `permissions.read` permission
2. Navigate to `/admin/user-permissions`
3. **Expected**: User permissions page should load normally
4. Log out and log in with a user that lacks `permissions.read` permission
5. Navigate to `/admin/user-permissions`
6. **Expected**: Should see "You don't have permission to manage user permissions" message

### **Phase 4: Feature Flags (Advanced)**

#### **Test 8: Feature Flag System**
**Steps:**
1. Open browser dev tools console
2. Run this code to test feature flags:
```javascript
// Test feature flag checking
import { useFeatureFlag } from './src/hooks/useFeatureFlag';

// In a React component, you can test:
const { isEnabled, isLoading } = useFeatureFlag('advanced_analytics');
console.log('Advanced Analytics enabled:', isEnabled);
```

### **Phase 5: Loading States**

#### **Test 9: Loading States**
**Steps:**
1. Open browser dev tools
2. Go to Network tab
3. Set throttling to "Slow 3G"
4. Navigate to `/admin/users`
5. **Expected**: Should see loading skeleton while permissions load
6. **Expected**: Table skeleton should show while user data loads

---

## 🔧 **Manual Testing Scenarios**

### **Scenario 1: Admin User**
**User**: Admin with all permissions
**Expected Behavior**:
- Can access all pages
- All buttons and actions visible
- No permission denied messages
- Full navigation available

### **Scenario 2: Limited User**
**User**: User with only `users.read` permission
**Expected Behavior**:
- Can view user list
- Cannot see "Add User" button
- Cannot see action buttons (Edit, Delete, etc.)
- Cannot access `/admin/roles` or `/admin/user-permissions`

### **Scenario 3: No Permission User**
**User**: User with no special permissions
**Expected Behavior**:
- Cannot access admin pages
- Redirected to unauthorized page
- Limited navigation options

### **Scenario 4: Error Handling**
**Test**: Simulate network errors or permission API failures
**Expected Behavior**:
- Error boundaries catch errors
- Fallback UI displays appropriate messages
- App doesn't crash

---

## 🐛 **Troubleshooting Common Issues**

### **Issue 1: Components Not Rendering**
**Symptoms**: Dynamic components show fallback UI even with correct permissions
**Solutions**:
1. Check browser console for errors
2. Verify permission names match between frontend and backend
3. Check if PermissionContext is properly loaded
4. Verify API endpoints are working

### **Issue 2: Unauthorized Redirects Not Working**
**Symptoms**: Users can access restricted pages
**Solutions**:
1. Check if ProtectedRoute is properly wrapping routes
2. Verify permission checks in backend
3. Check if user permissions are loaded correctly

### **Issue 3: Loading States Not Showing**
**Symptoms**: No loading indicators during permission checks
**Solutions**:
1. Check if `isLoading` state is properly managed
2. Verify loading components are passed to PermissionWrapper
3. Check network throttling in dev tools

### **Issue 4: Error Boundary Not Catching Errors**
**Symptoms**: App crashes instead of showing error boundary
**Solutions**:
1. Verify ErrorBoundary wraps the entire app
2. Check if error is thrown during render (not in event handlers)
3. Test with `throw new Error()` in component render

---

## 📊 **Testing Checklist**

### **Authentication & Authorization**
- [ ] Login form displays correctly
- [ ] Invalid credentials show error
- [ ] Valid credentials redirect to dashboard
- [ ] Logout clears session and redirects to login
- [ ] Unauthorized access redirects to `/unauthorized`
- [ ] Unauthorized page displays correctly

### **Dynamic Components**
- [ ] PermissionWrapper shows content with correct permissions
- [ ] PermissionWrapper shows fallback without permissions
- [ ] DynamicButton shows with correct permissions
- [ ] DynamicButton hides without permissions
- [ ] Loading states display during permission checks

### **Error Handling**
- [ ] Error boundary catches JavaScript errors
- [ ] Error boundary shows appropriate UI
- [ ] Network errors are handled gracefully
- [ ] Permission API failures show fallback UI

### **Feature Flags**
- [ ] Feature flags work with correct permissions
- [ ] Feature flags show fallback without permissions
- [ ] Multiple feature flags work together
- [ ] Feature flag loading states work

### **User Experience**
- [ ] Loading states provide good feedback
- [ ] Error messages are user-friendly
- [ ] Navigation reflects user permissions
- [ ] No broken UI elements

---

## 🚀 **Next Steps After Testing**

1. **Fix any issues** found during testing
2. **Add more permission checks** to other components
3. **Implement additional feature flags** as needed
4. **Add more comprehensive error handling**
5. **Create automated tests** for the dynamic rendering system

---

## 📝 **Test Data Setup**

To test different permission scenarios, you'll need users with different permission sets:

### **Test User 1: Admin**
- All permissions
- All roles

### **Test User 2: Manager**
- `users.read`, `users.update`
- `inventory.read`, `inventory.update`
- `sales.read`

### **Test User 3: Limited User**
- `users.read` only

### **Test User 4: No Permissions**
- No special permissions
- Basic user role only

---

## 🎯 **Success Criteria**

The dynamic rendering system is working correctly when:

1. ✅ Users can only see content they have permission for
2. ✅ Unauthorized access is properly handled
3. ✅ Error states are user-friendly
4. ✅ Loading states provide good feedback
5. ✅ The app doesn't crash on permission errors
6. ✅ All dynamic components work as expected
7. ✅ Feature flags control advanced features
8. ✅ The system is production-ready

---

**Happy Testing! 🎉**

If you encounter any issues during testing, check the browser console for errors and refer to the troubleshooting section above.







