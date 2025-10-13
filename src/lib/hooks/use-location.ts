/**
 * 地理位置 Hook
 * 获取用户当前位置
 */

import { useState, useCallback } from 'react';
import type { Location } from '@/lib/types';

interface UseLocationReturn {
  location: Location | null;
  isLoading: boolean;
  error: string | null;
  isEnabled: boolean;           // 是否启用位置记录
  toggleLocation: () => void;   // 切换启用状态
  getLocation: () => Promise<Location | null>;
}

export function useLocation(): UseLocationReturn {
  const [location, setLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);  // 默认不启用

  const getLocation = useCallback(async (): Promise<Location | null> => {
    // 检查浏览器是否支持地理位置
    if (!navigator.geolocation) {
      setError('浏览器不支持地理定位');
      return null;
    }

    setIsLoading(true);
    setError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          // 📍 LOG: 完整的原始位置数据
          console.group('🗺️ 地理定位数据');
          console.log('📍 完整 Position 对象:', position);
          console.log('📍 Coords 对象:', position.coords);
          console.log('📍 纬度 (latitude):', position.coords.latitude);
          console.log('📍 经度 (longitude):', position.coords.longitude);
          console.log('📍 精度 (accuracy):', position.coords.accuracy, '米');
          console.log('📍 海拔 (altitude):', position.coords.altitude, '米');
          console.log('📍 海拔精度 (altitudeAccuracy):', position.coords.altitudeAccuracy, '米');
          console.log('📍 方向 (heading):', position.coords.heading, '度');
          console.log('📍 速度 (speed):', position.coords.speed, '米/秒');
          console.log('📍 时间戳 (timestamp):', position.timestamp);
          console.log('📍 时间:', new Date(position.timestamp).toLocaleString('zh-CN'));
          console.groupEnd();
          
          const locationData: Location = {
            // GPS 坐标
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            
            // 精度信息（所有可用数据）
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            
            // 运动信息
            heading: position.coords.heading,
            speed: position.coords.speed,
            
            // 时间戳
            timestamp: position.timestamp,
          };

          // 尝试逆地理编码获取详细地址
          try {
            const address = await reverseGeocode(
              locationData.latitude,
              locationData.longitude
            );
            
            // 📍 LOG: 逆地理编码结果
            console.group('🏙️ 逆地理编码数据');
            console.log('🏙️ 完整地址对象:', address);
            if (address) {
              console.log('🏙️ 完整地址:', address.formatted_address);
              console.log('🏙️ 国家:', address.country);
              console.log('🏙️ 省份:', address.province);
              console.log('🏙️ 城市:', address.city);
              console.log('🏙️ 区县:', address.district);
              console.log('🏙️ 街道:', address.street);
              
              locationData.address = address.formatted_address;
              locationData.city = address.city;
              locationData.district = address.district;
              locationData.street = address.street;
              locationData.country = address.country;
              locationData.province = address.province;
            }
            console.groupEnd();
          } catch (err) {
            console.warn('❌ 逆地理编码失败:', err);
          }
          
          // 📍 LOG: 最终保存的位置数据
          console.group('💾 最终位置数据');
          console.log('💾 将要保存的完整 Location 对象:', locationData);
          console.table({
            '经度': locationData.longitude,
            '纬度': locationData.latitude,
            '精度(米)': locationData.accuracy,
            '海拔(米)': locationData.altitude,
            '海拔精度(米)': locationData.altitudeAccuracy,
            '方向(度)': locationData.heading,
            '速度(米/秒)': locationData.speed,
            '国家': locationData.country,
            '省份': locationData.province,
            '城市': locationData.city,
            '区县': locationData.district,
            '街道': locationData.street,
          });
          console.groupEnd();

          setLocation(locationData);
          setIsLoading(false);
          resolve(locationData);
        },
        (err) => {
          let errorMessage = '获取位置失败';
          
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMessage = '用户拒绝了位置权限';
              break;
            case err.POSITION_UNAVAILABLE:
              errorMessage = '位置信息不可用';
              break;
            case err.TIMEOUT:
              errorMessage = '获取位置超时';
              break;
          }
          
          setError(errorMessage);
          setIsLoading(false);
          resolve(null);
        },
        {
          enableHighAccuracy: true,  // 高精度模式（GPS）
          timeout: 15000,            // 15秒超时（高精度需要更多时间）
          maximumAge: 0,             // 不使用缓存，始终获取最新位置
        }
      );
    });
  }, []);

  // 切换位置记录启用状态
  const toggleLocation = useCallback(() => {
    setIsEnabled(prev => {
      const newState = !prev;
      
      if (newState) {
        // 启用时自动获取位置
        getLocation();
      } else {
        // 禁用时清除位置
        setLocation(null);
        setError(null);
      }
      
      return newState;
    });
  }, [getLocation]);

  return {
    location,
    isLoading,
    error,
    isEnabled,
    toggleLocation,
    getLocation,
  };
}

/**
 * 逆地理编码 - 坐标转地址
 * 使用高德地图 Web 服务 API（免费，无需 key 的备用方案）
 */
async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<{
  formatted_address: string;
  city: string;
  district: string;
  street: string;
  country: string;
  province: string;
} | null> {
  try {
    // 使用 OpenStreetMap 的 Nominatim API（完全免费，无需 key）
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=zh-CN`,
      {
        headers: {
          'User-Agent': 'LifeRecorder/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error('逆地理编码请求失败');
    }

    const data = await response.json();

    if (data && data.address) {
      const address = data.address;
      
      // 📍 LOG: 原始 OpenStreetMap 返回数据
      console.group('🌍 OpenStreetMap 原始数据');
      console.log('🌍 完整响应数据:', data);
      console.log('🌍 地址对象:', address);
      console.log('🌍 Display Name:', data.display_name);
      console.log('🌍 所有可用字段:', Object.keys(address));
      console.groupEnd();
      
      // 构建详细格式化地址
      const parts = [
        address.country,
        address.state || address.province,
        address.city || address.town || address.village,
        address.county || address.district,
        address.suburb || address.neighbourhood,
        address.road,
        address.house_number,
      ].filter(Boolean);

      return {
        formatted_address: data.display_name || parts.join(', '),
        city: address.city || address.town || address.village || '',
        district: address.county || address.district || address.suburb || '',
        street: address.road || '',
        country: address.country || '',
        province: address.state || address.province || '',
      };
    }

    return null;
  } catch (error) {
    console.error('逆地理编码失败:', error);
    return null;
  }
}

/**
 * 格式化位置信息为可读字符串
 */
export function formatLocation(location: Location | undefined): string {
  if (!location) return '';
  
  if (location.address) {
    return location.address;
  }
  
  if (location.city && location.country) {
    return `${location.city}, ${location.country}`;
  }
  
  return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
}

/**
 * 获取位置的简短描述
 */
export function getLocationShort(location: Location | undefined): string {
  if (!location) return '';
  
  if (location.city) {
    return location.city;
  }
  
  return `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`;
}

