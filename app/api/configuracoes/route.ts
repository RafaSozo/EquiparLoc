import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { getCompanySettings, updateCompanySettings } from '@/lib/db';

export async function GET() {
  try {
    const settings = getCompanySettings();
    // Exclude adminPin from public return
    const { adminPin: _, ...publicSettings } = settings;
    return NextResponse.json(publicSettings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Erro ao obter configurações' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth({ adminOnly: true });
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const updated = updateCompanySettings(body);
    const { adminPin: _, ...publicSettings } = updated;
    return NextResponse.json(publicSettings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Erro ao atualizar configurações' }, { status: 500 });
  }
}
