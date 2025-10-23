import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color?: string;
  trend?: 'up' | 'down' | 'stable';
  subtitle?: string;
}

export function MetricCard({ 
  icon: Icon, 
  label, 
  value, 
  color = 'from-blue-500 to-cyan-500',
  trend,
  subtitle 
}: MetricCardProps) {
  return (
    <div className="relative overflow-hidden bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-4 border border-gray-200/50 dark:border-gray-700/50">
      <div className="flex items-start justify-between mb-2">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        
        {trend && (
          <div className="flex items-center gap-1 text-xs font-medium">
            {trend === 'up' && (
              <span className="text-green-600 dark:text-green-400 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trending-up w-3 h-3">
                  <path d="M16 7h6v6"></path>
                  <path d="m22 7-8.5 8.5-5-5L2 17"></path>
                </svg>
              </span>
            )}
            {trend === 'down' && (
              <span className="text-red-600 dark:text-red-400 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trending-down w-3 h-3">
                  <path d="M16 17h6v-6"></path>
                  <path d="m22 17-8.5-8.5-5 5L2 7"></path>
                </svg>
              </span>
            )}
            {trend === 'stable' && (
              <span className="text-gray-600 dark:text-gray-400 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-minus w-3 h-3">
                  <path d="M5 12h14"></path>
                </svg>
              </span>
            )}
          </div>
        )}
      </div>
      
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</div>
      {subtitle && (
        <div className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</div>
      )}
    </div>
  );
}
