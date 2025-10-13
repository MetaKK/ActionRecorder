/**
 * 记录管理 Hook
 */

'use client';

import { useEffect } from 'react';
import { useRecordsStore } from '@/lib/stores/records-store';

export function useRecords() {
  const {
    records,
    addRecord,
    updateRecord,
    deleteRecord,
    getRecordsByDateRange,
    loadFromStorage,
  } = useRecordsStore();
  
  // 组件挂载时加载数据
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);
  
  return {
    records,
    addRecord,
    updateRecord,
    deleteRecord,
    getRecordsByDateRange,
  };
}

