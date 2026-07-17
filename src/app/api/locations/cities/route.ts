import { NextRequest, NextResponse } from 'next/server';
import { listCities } from '@/lib/locations/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    const country = request.nextUrl.searchParams.get('country')?.trim();
    const state = request.nextUrl.searchParams.get('state')?.trim();
    if (!country || !state) {
        return NextResponse.json(
            { error: 'country and state query parameters are required' },
            { status: 400 }
        );
    }

    try {
        const cities = await listCities(country, state);
        return NextResponse.json({ cities });
    } catch (error) {
        console.error('Failed to load cities', error);
        return NextResponse.json(
            { error: 'Failed to load cities' },
            { status: 500 }
        );
    }
}
