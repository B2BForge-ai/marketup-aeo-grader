import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { convertMarkdownToPdfHtml } from '@/lib/pdf-template'; // 替换为最新的高保真 PDF 模版
import fs from 'fs';
import path from 'path';

// 提取验证安全口令的复用函数
function validateAdminToken(request: Request): boolean {
  const { searchParams } = new URL(request.url);
  const queryToken = searchParams.get('token');
  
  const authHeader = request.headers.get('Authorization');
  const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  
  const expectedToken = process.env.ADMIN_SECRET_TOKEN;
  
  if (!expectedToken) {
    console.error('[ERROR] ADMIN_SECRET_TOKEN is not configured in environment variables.');
    return false;
  }
  
  return queryToken === expectedToken || headerToken === expectedToken;
}

/**
 * GET 接口
 * 用于审核后台获取所有状态为 "PENDING_REVIEW" 的线索记录
 */
export async function GET(request: Request) {
  try {
    if (!validateAdminToken(request)) {
      return NextResponse.json({ error: 'Unauthorized: 凭证无效或缺失' }, { status: 401 });
    }

    // 从 SQLite 查询所有待审核的记录
    const pendingRequests = await prisma.auditRequest.findMany({
      where: {
        status: 'PENDING_REVIEW',
        hasRequestedDeepReport: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ success: true, data: pendingRequests });
  } catch (error: any) {
    console.error('[GET pending requests error]:', error);
    return NextResponse.json({ error: '获取审核列表失败: ' + error.message }, { status: 500 });
  }
}

/**
 * POST 接口
 * 确认核准并模拟生成本地高保真 PDF-HTML 报告
 */
export async function POST(request: Request) {
  try {
    if (!validateAdminToken(request)) {
      return NextResponse.json({ error: 'Unauthorized: 凭证无效或缺失' }, { status: 401 });
    }

    const { id, action, editedReport, adminNotes } = await request.json();

    if (!id || !action) {
      return NextResponse.json({ error: 'Missing required parameters: id, action' }, { status: 400 });
    }

    // 1. 查找数据库中对应的线索记录
    const auditRequest = await prisma.auditRequest.findUnique({
      where: { id }
    });

    if (!auditRequest) {
      return NextResponse.json({ error: '未找到对应的诊断记录' }, { status: 404 });
    }

    if (action === 'REJECT') {
      // 驳回逻辑
      await prisma.auditRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          adminNotes: adminNotes || '不合规企业，已拒绝生成报告'
        }
      });
      return NextResponse.json({ success: true, message: '报告申请已成功拒绝' });
    }

    if (action === 'APPROVE') {
      // 确认核准并模拟在本地生成 PDF
      const finalReportMarkdown = editedReport || auditRequest.rawAiReport;
      
      if (!finalReportMarkdown) {
        return NextResponse.json({ error: '没有可以生成的报告文本内容' }, { status: 400 });
      }

      // 2. 将最终修改过的 Markdown 报告渲染为高保真 PDF 专用的现代 HTML (已内置 30天路线图表格解析)
      const htmlBody = convertMarkdownToPdfHtml(
        finalReportMarkdown,
        auditRequest.companyName,
        auditRequest.initialScore
      );

      // 3. 【本地模拟 PDF 部署】：将 HTML 写入本地静态目录 public/reports/ 中
      const reportsDir = path.join(process.cwd(), 'public', 'reports');
      
      // 确保目标文件夹存在
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      // 写入物理静态 HTML 文件 (用户在浏览器直接打印即可获得完美 PDF)
      const reportFileName = `${id}.html`;
      const reportFilePath = path.join(reportsDir, reportFileName);
      fs.writeFileSync(reportFilePath, htmlBody, 'utf8');

      // 4. 更新 SQLite 数据库状态为已发送 (SENT)
      await prisma.auditRequest.update({
        where: { id },
        data: {
          status: 'SENT',
          rawAiReport: finalReportMarkdown, // 保存最终管理员微调过的内容
          adminNotes: adminNotes || '人工审核通过，高保真 PDF HTML 已生成'
        }
      });

      // 返回生成好的本地静态报告访问路径
      const reportUrl = `/reports/${reportFileName}`;
      return NextResponse.json({ 
        success: true, 
        message: '核准成功，高保真 PDF 报告已在本地渲染生成！',
        reportUrl: reportUrl
      });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });

  } catch (error: any) {
    console.error('[POST admin action error]:', error);
    return NextResponse.json({ error: '处理审核请求失败: ' + error.message }, { status: 500 });
  }
}