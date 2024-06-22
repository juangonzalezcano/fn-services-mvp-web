import { createClient } from "contentful";
import { auth } from "@/auth";
import { NextResponse } from "next/server";


//These tokens are OK to be public so have the fallbacks here, they're used to fetch public data from Contentful and can't retrieve any unpublished or private data
const contentfulClient = createClient({
    space: process.env.CONTENTFUL_SPACE_ID || "1p96mcpzbbp4",
    accessToken: process.env.CONTENTFUL_TOKEN || "j7OkwqIZoBp9fqP9DoTbGA6BLCcD_R_JWfQ9A2qrY6g",
});


export const GET = auth(async function GET(req) {
    if (req.auth) {

        try {
            const url = new URL(req.url);
            const requestedUserID = url.searchParams.get('userId');
            const countryCodeParam = url.searchParams.get('countryCode');

            if (!requestedUserID || !countryCodeParam) {
                return NextResponse.json({ error: 'Missing parameter' }, { status: 400 });
            }

            const countryCode = countryCodeParam.toUpperCase();

            const snackItems = await contentfulClient.getEntries({
                content_type: 'snackDetails',
                select: ['fields.name','fields.cravings','fields.calories', 'fields.protein', 'fields.countryCode', 'sys.id']
            });

            // Ensure snacks and items exist
            if (!snackItems || !snackItems.items) {
                console.error('No snacks or items found');
                return NextResponse.json({ error: 'No snacks found' }, { status: 404 });
            }

            // Filter snacks for the specified country code and handle the cravings field
            const filteredSnacks = snackItems.items.filter(snack =>
                //AU doesn't have a country code sometimes
                // @ts-ignore
                (!snack.fields.countryCode || snack.fields.countryCode.includes(countryCode)) &&
                (snack.fields.cravings === false || snack.fields.cravings === undefined)
            );


            if (!filteredSnacks.length) {
                return NextResponse.json({ error: 'No snacks found' }, { status: 404 });
            }


            // Map the filtered snacks to the desired format
            const snacks = filteredSnacks.map(snack => ({
                name: snack.fields.name,
                cravings: snack.fields.cravings,
                calories: snack.fields.calories,
                protein: snack.fields.protein,
                countryCode: snack.fields.countryCode || 'AU',
                contentful_id: snack.sys.id
            }));

            return NextResponse.json({ snacks }, { status: 200 });

        }

        catch (error) {
            console.error(`Server error: ${error}`);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    } else {
        return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }
})

