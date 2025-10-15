import { redirect } from "next/navigation";
import { generateChatId } from "@/lib/ai/utils";

export default function AIPage() {
  // 重定向到新的聊天会话
  const chatId = generateChatId();
  redirect(`/ai/chat/${chatId}`);
}
