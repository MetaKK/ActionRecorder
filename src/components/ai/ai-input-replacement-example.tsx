"use client";

import { useState } from "react";
import { AIInputMinimal } from "./ai-input-minimal";

/**
 * 使用示例：替换原有的输入元素
 * 
 * 原来的元素：
 * <div class="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
 *   <div class="w-full max-w-4xl mx-auto">
 *     <div class="w-full max-w-4xl mx-auto">
 *       <div class="relative bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out shadow-lg" style="transform: none; height: auto;">
 *         <div class="flex items-end gap-2 p-3" style="padding-top: 12px; padding-bottom: 12px;">
 *           <button type="button" class="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 flex items-center justify-center transition-colors" tabindex="0">
 *             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus w-4 h-4 text-gray-600 dark:text-gray-400" aria-hidden="true">
 *               <path d="M5 12h14"></path>
 *               <path d="M12 5v14"></path>
 *             </svg>
 *           </button>
 *           <div class="flex-1 relative">
 *             <textarea placeholder="询问任何问题..." class="w-full resize-none border-0 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none leading-6" style="height: auto; min-height: 24px; max-height: 200px; overflow: hidden;"></textarea>
 *           </div>
 *         </div>
 *       </div>
 *     </div>
 *   </div>
 * </div>
 * 
 * 替换为：
 * <AIInputMinimal
 *   value={input}
 *   onChange={setInput}
 *   onSubmit={handleSubmit}
 *   isLoading={isLoading}
 *   onVoiceResult={handleVoiceResult}
 *   onVoiceError={handleVoiceError}
 *   lastMessage={lastMessage}
 *   placeholder="询问任何问题..."
 * />
 */

export function AIInputReplacementExample() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (value: string) => {
    if (!value.trim() || isLoading) return;
    
    setIsLoading(true);
    console.log("提交消息:", value);
    
    // 模拟API调用
    setTimeout(() => {
      setIsLoading(false);
      setInput("");
    }, 2000);
  };

  const handleVoiceResult = (text: string) => {
    setInput(prev => prev + text);
    console.log("语音识别结果:", text);
  };

  const handleVoiceError = (error: string) => {
    console.error("语音识别错误:", error);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 页面内容 */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-4">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            精致的AI输入组件
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            这是一个优化后的单行输入组件，集成了语音转文本功能，具有更精致的视觉效果。
          </p>
        </div>

        {/* 聊天区域 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-96 mb-4">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">对话区域</h2>
          </div>
          <div className="p-4 h-full overflow-y-auto">
            <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
              消息将显示在这里...
            </div>
          </div>
        </div>

        {/* 使用新的精致输入组件 */}
        <AIInputMinimal
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          onVoiceResult={handleVoiceResult}
          onVoiceError={handleVoiceError}
          placeholder="询问任何问题..."
        />
      </div>
    </div>
  );
}
