import { NextResponse } from 'next/server';
import { listCountries } from '@/lib/locations/server';

export const runtime = 'nodejs';

export async function GET() {
    try {
        const countries = await listCountries();
        return NextResponse.json({ countries });
    } catch (error) {
        console.error('Failed to load countries', error);
        return NextResponse.json(
            { error: 'Failed to load countries' },
            { status: 500 }
        );
    }
}
