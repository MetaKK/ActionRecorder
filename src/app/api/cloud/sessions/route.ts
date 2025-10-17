import { NextRequest, NextResponse } from "next/server";
import type { ChatSession } from "@/lib/hooks/use-ai-chat";

// 静态导出配置
export const dynamic = 'force-static';
export const revalidate = false;

// 模拟数据库 - 实际项目中应使用真实数据库
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
  
  // 实际项目中应验证JWT token
  // 这里简化为检查token格式
  if (token.length > 10) {
    return "user-" + token.slice(0, 8);
  }
  return null;
}

// GET /api/cloud/sessions - 获取用户的所有会话
export async function GET(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    const userId = validateUser(token);
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 从数据库获取用户的会话
    const userSessions = Array.from(mockDatabase.values())
      .filter(session => session.id.startsWith(userId));

    return NextResponse.json(userSessions);
  } catch (error) {
    console.error("Failed to get sessions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/cloud/sessions - 创建或更新会话
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

    const session: ChatSession = await request.json();
    
    // 验证会话数据
    if (!session.id || !session.title || !Array.isArray(session.messages)) {
      return NextResponse.json(
        { error: "Invalid session data" },
        { status: 400 }
      );
    }

    // 添加用户ID前缀确保数据隔离
    const userSession = {
      ...session,
      id: `${userId}-${session.id}`,
    };

    // 保存到数据库
    mockDatabase.set(userSession.id, userSession);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/cloud/sessions - 删除会话 (通过请求体传递ID)
export async function DELETE(request: NextRequest) {
  try {
    const token = getAuthToken(request);
    const userId = validateUser(token);
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { sessionId } = await request.json();
    const fullSessionId = `${userId}-${sessionId}`;
    
    if (mockDatabase.has(fullSessionId)) {
      mockDatabase.delete(fullSessionId);
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Failed to delete session:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
