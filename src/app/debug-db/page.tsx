/**
 * 数据库调试页面
 * 用于测试 IndexedDB 功能
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  debugDatabase, 
  clearDatabase, 
  getAllDiaries, 
  getDiaryStats,
  isIndexedDBAvailable 
} from '@/lib/storage/diary-db';

export default function DebugDBPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleDebug = async () => {
    setIsLoading(true);
    addLog('🔍 Starting database debug...');
    try {
      await debugDatabase();
      addLog('✅ Debug completed');
    } catch (error) {
      addLog(`❌ Debug failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    setIsLoading(true);
    addLog('🗑️ Clearing database...');
    try {
      await clearDatabase();
      addLog('✅ Database cleared');
    } catch (error) {
      addLog(`❌ Clear failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetAll = async () => {
    setIsLoading(true);
    addLog('📖 Getting all diaries...');
    try {
      const diaries = await getAllDiaries();
      addLog(`✅ Found ${diaries.length} diaries`);
      console.log('Diaries:', diaries);
    } catch (error) {
      addLog(`❌ Get all failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStats = async () => {
    setIsLoading(true);
    addLog('📊 Getting stats...');
    try {
      const stats = await getDiaryStats();
      addLog(`✅ Stats: ${JSON.stringify(stats)}`);
    } catch (error) {
      addLog(`❌ Stats failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckAvailability = () => {
    const available = isIndexedDBAvailable();
    addLog(`🔍 IndexedDB available: ${available}`);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Database Debug Tool</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <div className="space-y-3">
              <Button 
                onClick={handleCheckAvailability}
                disabled={isLoading}
                className="w-full"
              >
                Check IndexedDB Availability
              </Button>
              
              <Button 
                onClick={handleDebug}
                disabled={isLoading}
                className="w-full"
                variant="outline"
              >
                Debug Database
              </Button>
              
              <Button 
                onClick={handleGetAll}
                disabled={isLoading}
                className="w-full"
                variant="outline"
              >
                Get All Diaries
              </Button>
              
              <Button 
                onClick={handleStats}
                disabled={isLoading}
                disabled={isLoading}
                className="w-full"
                variant="outline"
              >
                Get Stats
              </Button>
              
              <Button 
                onClick={handleClear}
                disabled={isLoading}
                className="w-full"
                variant="destructive"
              >
                Clear Database
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Logs</h2>
              <Button onClick={clearLogs} size="sm" variant="outline">
                Clear
              </Button>
            </div>
            
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-gray-500">No logs yet...</p>
              ) : (
                <div className="space-y-1">
                  {logs.map((log, index) => (
                    <div key={index} className="text-sm font-mono">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>1. Click "Check IndexedDB Availability" to verify IndexedDB is supported</p>
            <p>2. Click "Debug Database" to see database status and sample records</p>
            <p>3. Click "Get All Diaries" to test the getAllDiaries function</p>
            <p>4. Click "Get Stats" to test statistics function</p>
            <p>5. If there are errors, try "Clear Database" to reset</p>
            <p>6. Check browser console for detailed error messages</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
