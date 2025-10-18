/**
 * 环境配置工具
 * 用于统一管理开发/生产环境的判断
 */

/**
 * 判断是否为开发环境
 */
export const isDev = () => {
  return process.env.NODE_ENV === 'development';
};

/**
 * 判断是否为生产环境
 */
export const isProd = () => {
  return process.env.NODE_ENV === 'production';
};

/**
 * 判断是否为测试环境
 */
export const isTest = () => {
  return process.env.NODE_ENV === 'test';
};

/**
 * 获取环境变量
 */
export const getEnv = (key: string, defaultValue: string = '') => {
  return process.env[key] || defaultValue;
};

/**
 * 是否启用调试模式
 * 可以通过环境变量 NEXT_PUBLIC_DEBUG 来强制启用调试（即使在生产环境）
 */
export const isDebugEnabled = () => {
  // 在开发环境默认启用
  if (isDev()) return true;
  
  // 在生产环境中，只有明确设置了 NEXT_PUBLIC_DEBUG=true 才启用
  return process.env.NEXT_PUBLIC_DEBUG === 'true';
};

