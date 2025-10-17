import { NextRequest, NextResponse } from "next/server";
import type { ChatSession } from "@/lib/hooks/use-ai-chat";

// 静态导出配置
export const dynamic = 'force-static';
export const revalidate = false;

// 模拟数据库
const mockDatabase = new Map<string, ChatSession>();

// 获取认证信息
function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
}

// 验证用户身份
function validateUser(token: string | null): string | null {
  if (!token) return null;
  
  if (token.length > 10) {
    return "user-" + token.slice(0, 8);
  }
  return null;
}

// POST /api/cloud/sync - 批量同步会话
export async function POST(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    const userId = validateUser(token);
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { sessions }: { sessions: ChatSession[] } = await request.json();
    
    if (!Array.isArray(sessions)) {
      return NextResponse.json(
        { error: "Invalid sessions data" },
        { status: 400 }
      );
    }

    // 批量保存会话
    const results = [];
    for (const session of sessions) {
      try {
        const userSession = {
          ...session,
          id: `${userId}-${session.id}`,
        };
        
        mockDatabase.set(userSession.id, userSession);
        results.push({ id: session.id, success: true });
      } catch (error) {
        results.push({ id: session.id, success: false, error: error instanceof Error ? error.message : "Unknown error" });
      }
    }

    return NextResponse.json({
      success: true,
      results,
      synced: results.filter(r => r.success).length,
      total: results.length,
    });
  } catch (error) {
    console.error("Failed to sync sessions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
