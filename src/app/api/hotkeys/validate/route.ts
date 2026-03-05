import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { supabaseAdmin } from '@/lib/supabase/client';
import { validateHotkeyContent, generateSecurityReport } from '@/lib/security/validator';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { hotkey_id, content } = body;

    if (hotkey_id) {
      const { data: hotkey } = await supabaseAdmin
        .from('hotkeys')
        .select('*')
        .eq('id', hotkey_id)
        .single();

      if (!hotkey) {
        return NextResponse.json({ error: 'Hotkey not found' }, { status: 404 });
      }

      const isOwner = hotkey.creator_id === session.user.id;
      const isAdmin = session.user.role === 'admin';

      if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const result = await validateHotkeyContent(hotkey.content);
      const report = generateSecurityReport(result);

      await supabaseAdmin
        .from('hotkeys')
        .update({
          security_score: result.score,
          security_report: result,
          status: result.passed ? 'approved' : 'rejected',
        })
        .eq('id', hotkey_id);

      await supabaseAdmin
        .from('security_audits')
        .insert({
          hotkey_id,
          audit_type: 'automated',
          severity: result.findings.some(f => f.severity === 'critical') 
            ? 'critical' 
            : result.findings.some(f => f.severity === 'warning')
            ? 'warning'
            : 'info',
          findings: result.findings,
          resolved: false,
        });

      return NextResponse.json({
        score: result.score,
        passed: result.passed,
        report,
        findings: result.findings,
      });
    } else if (content) {
      const result = await validateHotkeyContent(content);
      const report = generateSecurityReport(result);

      return NextResponse.json({
        score: result.score,
        passed: result.passed,
        report,
        findings: result.findings,
      });
    } else {
      return NextResponse.json(
        { error: 'Either hotkey_id or content required' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate hotkey' },
      { status: 500 }
    );
  }
}