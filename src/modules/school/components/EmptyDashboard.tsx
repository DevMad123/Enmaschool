// ===== src/modules/school/components/EmptyDashboard.tsx =====

import { BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface EmptyDashboardProps {
  message: string;
  action?: { label: string; href: string };
}

export function EmptyDashboard({ message, action }: EmptyDashboardProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <BarChart2 className="h-8 w-8 text-gray-400" />
      </div>
      <p className="text-lg font-medium text-gray-700">{message}</p>
      <p className="mt-1 text-sm text-gray-400">
        Les données apparaîtront ici une fois saisies.
      </p>
      {action && (
        <button
          className="mt-4 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          onClick={() => navigate(action.href)}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
