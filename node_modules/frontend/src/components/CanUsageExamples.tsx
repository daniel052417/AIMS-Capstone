import React from 'react';
import { Can } from './Can';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';

/**
 * Examples of proper Can component usage patterns
 * This file demonstrates the correct ways to use the Can component
 * to avoid nested button warnings and maintain clean code
 */

const CanUsageExamples: React.FC = () => {
  const handleAddUser = () => console.log('Add user clicked');
  const handleEditUser = () => console.log('Edit user clicked');
  const handleDeleteUser = () => console.log('Delete user clicked');
  const handleViewUser = () => console.log('View user clicked');

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Can Component Usage Examples</h1>

      {/* Example 1: Generic Permission Wrapper (Recommended for most cases) */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">1. Generic Permission Wrapper (Default)</h2>
        <p className="text-gray-600">
          Use this pattern when you want to conditionally render any content based on permissions.
          The Can component acts as a div wrapper by default.
        </p>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-2">Code:</h3>
          <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
{`<Can permission="users.create">
  <button 
    onClick={handleAddUser}
    className="px-4 py-2 bg-blue-600 text-white rounded"
  >
    Add User
  </button>
</Can>`}
          </pre>
          
          <h3 className="font-medium mb-2 mt-4">Result:</h3>
          <Can permission="users.create">
            <button 
              onClick={handleAddUser}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add User
            </button>
          </Can>
        </div>
      </section>

      {/* Example 2: As Button with Props (Recommended for buttons) */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">2. As Button with Props (Recommended for buttons)</h2>
        <p className="text-gray-600">
          Use this pattern when you want the Can component itself to be the button.
          This prevents nested button warnings and gives you full control over button props.
        </p>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-2">Code:</h3>
          <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
{`<Can 
  permission="users.create"
  as="button"
  buttonProps={{
    onClick: handleAddUser,
    className: "px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
  }}
>
  <Plus className="w-4 h-4 mr-2" />
  Add User
</Can>`}
          </pre>
          
          <h3 className="font-medium mb-2 mt-4">Result:</h3>
          <Can 
            permission="users.create"
            as="button"
            buttonProps={{
              onClick: handleAddUser,
              className: "px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add User
          </Can>
        </div>
      </section>

      {/* Example 3: Action Buttons in Table */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">3. Action Buttons in Table</h2>
        <p className="text-gray-600">
          Perfect for table action buttons where you need different permissions for each action.
        </p>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-2">Code:</h3>
          <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
{`<div className="flex items-center space-x-2">
  <Can
    permission="users.read"
    as="button"
    buttonProps={{
      onClick: handleViewUser,
      className: "text-blue-600 hover:text-blue-900 p-1"
    }}
    fallback={null}
  >
    <Eye className="w-4 h-4" />
  </Can>
  
  <Can
    permission="users.update"
    as="button"
    buttonProps={{
      onClick: handleEditUser,
      className: "text-green-600 hover:text-green-900 p-1"
    }}
    fallback={null}
  >
    <Edit className="w-4 h-4" />
  </Can>
  
  <Can
    permission="users.delete"
    as="button"
    buttonProps={{
      onClick: handleDeleteUser,
      className: "text-red-600 hover:text-red-900 p-1"
    }}
    fallback={null}
  >
    <Trash2 className="w-4 h-4" />
  </Can>
</div>`}
          </pre>
          
          <h3 className="font-medium mb-2 mt-4">Result:</h3>
          <div className="flex items-center space-x-2">
            <Can
              permission="users.read"
              as="button"
              buttonProps={{
                onClick: handleViewUser,
                className: "text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
              }}
              fallback={null}
            >
              <Eye className="w-4 h-4" />
            </Can>
            
            <Can
              permission="users.update"
              as="button"
              buttonProps={{
                onClick: handleEditUser,
                className: "text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
              }}
              fallback={null}
            >
              <Edit className="w-4 h-4" />
            </Can>
            
            <Can
              permission="users.delete"
              as="button"
              buttonProps={{
                onClick: handleDeleteUser,
                className: "text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
              }}
              fallback={null}
            >
              <Trash2 className="w-4 h-4" />
            </Can>
          </div>
        </div>
      </section>

      {/* Example 4: As Span Element */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">4. As Span Element</h2>
        <p className="text-gray-600">
          Use this for inline elements that need permission checks.
        </p>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-2">Code:</h3>
          <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
{`<Can 
  permission="users.read"
  as="span"
  spanProps={{ className: "text-blue-600 cursor-pointer" }}
>
  View Details
</Can>`}
          </pre>
          
          <h3 className="font-medium mb-2 mt-4">Result:</h3>
          <Can 
            permission="users.read"
            as="span"
            spanProps={{ className: "text-blue-600 cursor-pointer hover:underline" }}
          >
            View Details
          </Can>
        </div>
      </section>

      {/* Example 5: Complex Content with Fallback */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">5. Complex Content with Fallback</h2>
        <p className="text-gray-600">
          For complex content that needs permission checks with custom fallback UI.
        </p>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium mb-2">Code:</h3>
          <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
{`<Can
  permissions={['users.read', 'users.update']}
  fallback={
    <div className="text-gray-500 italic">
      You don't have permission to view this content
    </div>
  }
>
  <div className="bg-white p-4 rounded border">
    <h3 className="font-semibold">User Management Panel</h3>
    <p>This content is only visible to users with read and update permissions.</p>
  </div>
</Can>`}
          </pre>
          
          <h3 className="font-medium mb-2 mt-4">Result:</h3>
          <Can
            permissions={['users.read', 'users.update']}
            fallback={
              <div className="text-gray-500 italic p-4 border border-gray-200 rounded">
                You don't have permission to view this content
              </div>
            }
          >
            <div className="bg-white p-4 rounded border">
              <h3 className="font-semibold">User Management Panel</h3>
              <p>This content is only visible to users with read and update permissions.</p>
            </div>
          </Can>
        </div>
      </section>

      {/* Best Practices */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Best Practices</h2>
        <div className="bg-blue-50 p-4 rounded-lg">
          <ul className="space-y-2 text-sm">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              <span><strong>Use generic wrapper (default)</strong> for most cases where you're wrapping existing elements</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              <span><strong>Use as="button"</strong> when you want the Can component itself to be the button</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              <span><strong>Always provide fallback</strong> for better UX when permissions are denied</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-600 mr-2">✗</span>
              <span><strong>Avoid nested buttons</strong> - don't wrap &lt;button&gt; elements inside Can components that render buttons</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">✓</span>
              <span><strong>Use specific prop types</strong> - buttonProps for buttons, divProps for divs, spanProps for spans</span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default CanUsageExamples;
