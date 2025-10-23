'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AnalysisPage() {
  const router = useRouter();

  // 重定向逻辑
  useEffect(() => {
    const redirectToAnalysis = () => {
      // 尝试从 sessionStorage 获取当前会话
      const currentSession = localStorage.getItem('scene_practice_session');
      if (currentSession) {
        try {
          const sessionData = JSON.parse(currentSession);
          if (sessionData.id) {
            // 重定向到动态路由
            router.push(`/ai/scene-practice/analysis/${sessionData.id}`);
            return;
          }
        } catch (error) {
          console.error('Failed to parse session data:', error);
        }
      }
      
      // 如果没有会话数据，重定向到练习页面
      router.push('/ai/scene-practice');
    };

    redirectToAnalysis();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
          正在重定向到分析页面...
        </p>
      </div>
    </div>
  );
}