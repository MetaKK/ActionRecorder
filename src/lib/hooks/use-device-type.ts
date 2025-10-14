/**
 * 设备类型检测 Hook
 * 用于区分移动端(H5)和桌面端(PC)
 * ✅ SSR 安全：避免 Hydration 错误
 */

'use client';

import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'desktop';

/**
 * 检测设备类型（客户端）
 */
function detectDeviceType(): DeviceType {
  // ✅ SSR 安全检查
  if (typeof window === 'undefined') {
    return 'desktop';
  }
  
  // 方法1: 检测触摸屏
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // 方法2: 检测 User Agent
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = [
    'android',
    'webos',
    'iphone',
    'ipad',
    'ipod',
    'blackberry',
    'windows phone',
    'mobile'
  ];
  const isMobileUA = mobileKeywords.some(keyword => userAgent.includes(keyword));
  
  // 方法3: 检测屏幕宽度（小于 768px 视为移动端）
  const isMobileWidth = window.innerWidth < 768;
  
  // 综合判断：满足任意两个条件即为移动端
  const mobileScore = [isTouchDevice, isMobileUA, isMobileWidth].filter(Boolean).length;
  
  return mobileScore >= 2 ? 'mobile' : 'desktop';
}

export function useDeviceType(): DeviceType {
  // ✅ 使用初始检测结果作为默认值，避免 Hydration 不匹配
  const [deviceType, setDeviceType] = useState<DeviceType>(() => {
    // 在客户端立即检测，避免闪烁
    if (typeof window !== 'undefined') {
      return detectDeviceType();
    }
    return 'desktop';
  });
  
  // ✅ 标记是否已挂载，避免 Hydration 错误
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const checkDeviceType = () => {
      setDeviceType(detectDeviceType());
    };

    // 初始检测
    checkDeviceType();

    // 监听窗口大小变化
    window.addEventListener('resize', checkDeviceType);
    
    return () => {
      window.removeEventListener('resize', checkDeviceType);
    };
  }, []);

  // ✅ SSR 期间返回安全的默认值
  if (!mounted) {
    return 'desktop';
  }

  return deviceType;
}

/**
 * 检测是否为桌面端
 */
export function useIsDesktop(): boolean {
  return useDeviceType() === 'desktop';
}

/**
 * 检测是否为移动端
 */
export function useIsMobile(): boolean {
  return useDeviceType() === 'mobile';
}

