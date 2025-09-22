import React from 'react';
import { Edit, Trash2, Eye, MoreHorizontal } from 'lucide-react';
import { usePermission } from '../hooks/usePermission';

interface DynamicTableActionsProps {
  itemId: string;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  viewPermission?: string;
  editPermission?: string;
  deletePermission?: string;
  className?: string;
}

export const DynamicTableActions: React.FC<DynamicTableActionsProps> = ({
  itemId,
  onView,
  onEdit,
  onDelete,
  viewPermission = 'read',
  editPermission = 'update',
  deletePermission = 'delete',
  className = ''
}) => {
  const { hasPermission: canView } = usePermission(viewPermission);
  const { hasPermission: canEdit } = usePermission(editPermission);
  const { hasPermission: canDelete } = usePermission(deletePermission);

  const actions = [];

  if (canView && onView) {
    actions.push(
      <button
        key="view"
        onClick={() => onView(itemId)}
        className="text-blue-600 hover:text-blue-800 p-1"
        title="View"
      >
        <Eye className="w-4 h-4" />
      </button>
    );
  }

  if (canEdit && onEdit) {
    actions.push(
      <button
        key="edit"
        onClick={() => onEdit(itemId)}
        className="text-green-600 hover:text-green-800 p-1"
        title="Edit"
      >
        <Edit className="w-4 h-4" />
      </button>
    );
  }

  if (canDelete && onDelete) {
    actions.push(
      <button
        key="delete"
        onClick={() => onDelete(itemId)}
        className="text-red-600 hover:text-red-800 p-1"
        title="Delete"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    );
  }

  if (actions.length === 0) {
    return null;
  }

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {actions}
    </div>
  );
};