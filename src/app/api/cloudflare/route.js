// For App Router: app/api/cloudflare/route.js
import { NextResponse } from 'next/server';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const days = searchParams.get('days');
    const country = searchParams.get('country');

    if (!days || !country) {
        return NextResponse.json(
            { message: 'Missing required query parameters: days and country' },
            { status: 400 }
        );
    }

    try {
        const apiToken = process.env.CLOUDFLARE_API_TOKEN; // Server-side only, no NEXT_PUBLIC

        if (!apiToken) {
            return NextResponse.json(
                { message: 'Missing API token configuration' },
                { status: 500 }
            );
        }

        const response = await fetch(
            `https://api.cloudflare.com/client/v4/radar/quality/speed/summary?dateRange=${days}d&location=${country}&format=json`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json(
                { message: 'Cloudflare API error', details: errorData },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('Error fetching Cloudflare data:', error);
        return NextResponse.json(
            { message: 'Internal server error', error: error.message },
            { status: 500 }
        );
    }
}
