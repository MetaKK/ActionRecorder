/**
 * 插件系统功能测试
 * 运行: npx tsx test-plugin-system.ts
 */

import { pluginRegistry, registerPresetPlugins, pluginLogger, pluginManager } from './src/lib/plugins';

console.log('🚀 测试插件系统...\n');

// 1. 注册预设插件
console.log('📦 注册预设插件...');
registerPresetPlugins();

// 2. 获取所有插件
const allPlugins = pluginRegistry.getAll();
console.log(`✅ 已注册 ${allPlugins.length} 个插件：`);
allPlugins.forEach(plugin => {
  console.log(`   ${plugin.metadata.icon} ${plugin.metadata.name} (${plugin.metadata.id})`);
});

// 3. 测试按类别获取
console.log('\n🏷️  按类别获取：');
import { PluginCategory } from './src/lib/plugins';
const productivity = pluginRegistry.getByCategory(PluginCategory.PRODUCTIVITY);
console.log(`   效率工具: ${productivity.length} 个`);

// 4. 测试激活
console.log('\n⚡ 测试激活插件...');
(async () => {
  const result = await pluginManager.activate('focus');
  console.log(`   激活结果: ${result ? '✅ 成功' : '❌ 失败'}`);
  
  // 5. 查看日志
  const logs = pluginLogger.getLogs();
  console.log(`\n📝 日志系统: ${logs.length} 条日志`);
  logs.slice(-3).forEach(log => {
    console.log(`   [${log.level}] ${log.message}`);
  });
  
  console.log('\n🎉 插件系统测试完成！');
})();

