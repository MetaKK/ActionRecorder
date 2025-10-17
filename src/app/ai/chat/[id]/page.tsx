import { ChatGPTEnhancedChat } from "@/components/ai/chatgpt-enhanced-chat";
import { isValidChatId } from "@/lib/ai/utils";
import { notFound } from "next/navigation";

interface AIChatPageProps {
  params: Promise<{ id: string }>;
}

// 静态导出配置
export const dynamic = 'force-static';
export const revalidate = false;

// 为静态导出生成参数
export async function generateStaticParams() {
  return [];
}

export default async function AIChatPage({ params }: AIChatPageProps) {
  const { id } = await params;

  if (!isValidChatId(id)) {
    notFound();
  }

  return <ChatGPTEnhancedChat chatId={id} />;
}
