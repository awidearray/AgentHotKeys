import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/config';
import { supabaseAdmin, safeDbOperation } from '@/lib/supabase/client';
import { z } from 'zod';
import { SecureHotkeySchema, validateHotkeyContent, generateSecurityReport } from '@/lib/security/hotkey-validator';

const CreateHotkeySchema = SecureHotkeySchema.extend({
  price_crypto: z.record(z.string(), z.number()).optional(),
  preview_content: z.object({
    keybinding: z.string(),
    description: z.string(),
  }).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const creator_id = searchParams.get('creator_id');
    const demo = searchParams.get('demo');
    
    console.log('[API] GET /api/hotkeys', { category, search, creator_id, demo });
    
    // If demo mode is explicitly requested, return sample data
    if (demo === 'true') {
      console.log('[API] Demo mode explicitly requested');
      try {
        const { getDemoData } = await import('@/lib/demo/sample-data');
        const demoData = getDemoData();
        let filteredHotkeys = demoData.hotkeys;
        
        // Apply filters to demo data
        if (category && category !== 'all') {
          filteredHotkeys = filteredHotkeys.filter(h => h.category === category);
        }
        
        if (search) {
          const searchLower = search.toLowerCase();
          filteredHotkeys = filteredHotkeys.filter(h => 
            h.title.toLowerCase().includes(searchLower) ||
            h.description.toLowerCase().includes(searchLower) ||
            h.tags.some(tag => tag.toLowerCase().includes(searchLower))
          );
        }
        
        if (creator_id) {
          filteredHotkeys = filteredHotkeys.filter(h => h.creator.id === creator_id);
        }
        
        console.log(`[API] Demo mode: returning ${filteredHotkeys.length} sample hotkeys`);
        return NextResponse.json(filteredHotkeys, {
          headers: { 'X-Demo-Mode': 'true' }
        });
      } catch (demoError) {
        console.error('[API] Demo data failed:', demoError);
        return NextResponse.json([], {
          headers: { 'X-Demo-Mode': 'true', 'X-Demo-Error': 'Demo data unavailable' }
        });
      }
    }
    
    const result = await safeDbOperation(async () => {
      let query = supabaseAdmin
        .from('hotkeys')
        .select(`
          id,
          title,
          description,
          category,
          tags,
          price_usd,
          price_crypto,
          is_free,
          downloads,
          rating_average,
          rating_count,
          created_at,
          creator:users(id, name, avatar_url)
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }

      if (creator_id) {
        query = query.eq('creator_id', creator_id);
      }

      return await query;
    });

    if (!result.success) {
      console.error('[API] Database error:', result.error);
      return NextResponse.json(
        { 
          error: 'Database unavailable',
          message: 'Unable to fetch hotkeys at this time. Please try again later.',
          details: result.error
        }, 
        { status: 503 }
      );
    }

    console.log(`[API] Found ${result.data?.length || 0} hotkeys from database`);
    return NextResponse.json(result.data || []);
    
  } catch (error) {
    console.error('[API] Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'An unexpected error occurred'
      }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = CreateHotkeySchema.parse(body);

    // Perform security validation
    const securityValidation = validateHotkeyContent({
      title: validatedData.title,
      description: validatedData.description,
      keybinding: validatedData.content.keybinding,
      command: validatedData.content.command,
      instructions: validatedData.content.instructions,
    });

    // Log security report
    console.log('[SECURITY] Hotkey validation:', {
      userId: session.user.id,
      score: securityValidation.score,
      valid: securityValidation.isValid,
      errors: securityValidation.errors.length,
      warnings: securityValidation.warnings.length
    });

    // If security validation fails, reject the hotkey
    if (!securityValidation.isValid) {
      return NextResponse.json(
        { 
          error: 'Hotkey failed security validation',
          details: securityValidation.errors,
          warnings: securityValidation.warnings,
          score: securityValidation.score
        },
        { status: 400 }
      );
    }

    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('status')
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .single();

    if (!subscription && !validatedData.is_free) {
      return NextResponse.json(
        { error: 'Active subscription required to create paid hotkeys' },
        { status: 402 }
      );
    }

    // Determine status based on security score
    const status = securityValidation.score >= 90 ? 'approved' : 'pending_review';

    const { data, error } = await supabaseAdmin
      .from('hotkeys')
      .insert({
        ...validatedData,
        creator_id: session.user.id,
        status,
        compatibility: validatedData.content.compatibility,
        security_score: securityValidation.score,
        security_notes: securityValidation.warnings.length > 0 
          ? JSON.stringify({ warnings: securityValidation.warnings, validated_at: new Date().toISOString() })
          : null,
      })
      .select()
      .single();

    // Log successful creation
    console.log('[HOTKEY] Created:', {
      id: data?.id,
      userId: session.user.id,
      title: validatedData.title,
      status,
      securityScore: securityValidation.score
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create hotkey' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    const { data: hotkey } = await supabaseAdmin
      .from('hotkeys')
      .select('creator_id')
      .eq('id', id)
      .single();

    if (!hotkey || hotkey.creator_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('hotkeys')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update hotkey' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }

  const { data: hotkey } = await supabaseAdmin
    .from('hotkeys')
    .select('creator_id')
    .eq('id', id)
    .single();

  if (!hotkey || hotkey.creator_id !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error } = await supabaseAdmin
    .from('hotkeys')
    .update({ status: 'archived' })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}