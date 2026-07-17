import { NextRequest, NextResponse } from 'next/server';
import { listStates } from '@/lib/locations/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    const country = request.nextUrl.searchParams.get('country')?.trim();
    if (!country) {
        return NextResponse.json(
            { error: 'country query parameter is required' },
            { status: 400 }
        );
    }

    try {
        const states = await listStates(country);
        return NextResponse.json({ states });
    } catch (error) {
        console.error('Failed to load states', error);
        return NextResponse.json(
            { error: 'Failed to load states' },
            { status: 500 }
        );
    }
}
