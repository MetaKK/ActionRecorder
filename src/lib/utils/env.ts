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
 * 可以通过环境变量 NEXT_PUBLIC_DEBUG 来控制调试面板的显示
 */
export const isDebugEnabled = () => {
  // 如果明确设置了 NEXT_PUBLIC_DEBUG=false，则禁用调试面板
  if (process.env.NEXT_PUBLIC_DEBUG === 'false') {
    return false;
  }
  
  // 如果明确设置了 NEXT_PUBLIC_DEBUG=true，则启用调试面板
  if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
    return true;
  }
  
  // 默认禁用调试面板（无论开发还是生产环境）
  return false;
};

