/**
 * 设备类型检测 Hook
 * 用于区分移动端(H5)和桌面端(PC)
 */

import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'desktop';

export function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');

  useEffect(() => {
    const checkDeviceType = () => {
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
      
      setDeviceType(mobileScore >= 2 ? 'mobile' : 'desktop');
    };

    // 初始检测
    checkDeviceType();

    // 监听窗口大小变化
    window.addEventListener('resize', checkDeviceType);
    
    return () => {
      window.removeEventListener('resize', checkDeviceType);
    };
  }, []);

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

