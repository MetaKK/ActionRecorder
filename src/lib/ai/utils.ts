import { generateId } from "ai";

// 生成唯一ID
export const generateChatId = () => generateId();

// 格式化时间
export const formatMessageTime = (date: Date) => {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
};

// 格式化日期
export const formatMessageDate = (date: Date) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  if (messageDate.getTime() === today.getTime()) {
    return "今天";
  }
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (messageDate.getTime() === yesterday.getTime()) {
    return "昨天";
  }
  
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
  }).format(date);
};

// 截断文本
export const truncateText = (text: string, maxLength: number = 100) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
};

// 检查是否为有效的聊天ID
export const isValidChatId = (id: string) => {
  return typeof id === "string" && id.length > 0;
};
