import { createClient } from "contentful";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { db } from '@/lib/firebase/firebaseAdmin';
import slugify from "slugify";


//These tokens are OK to be public so have the fallbacks here, they're used to fetch public data from Contentful and can't retrieve any unpublished or private data
const contentfulClient = createClient({
    space: process.env.CONTENTFUL_SPACE_ID || "1p96mcpzbbp4",
    accessToken: process.env.CONTENTFUL_TOKEN || "j7OkwqIZoBp9fqP9DoTbGA6BLCcD_R_JWfQ9A2qrY6g",
});

interface CustomRecipe {
    slug: string;
    name: string;
    calories: number;
    protein: number;
    url?: string;
    contentful_id: string;
    country_code: string;
}


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

            let recipes = await contentfulClient.getEntries({
                content_type: 'recipeDetails',
                select: ['fields.calories', 'fields.proteinContent', 'fields.countryCode', 'fields.recipe', 'sys.id']
            });

            // Ensure recipes and items exist
            if (!recipes || !recipes.items) {
                console.error('No recipes or items found');
                return NextResponse.json({ error: 'No recipes found' }, { status: 404 });
            }


            // Fetch related entries
            //@ts-ignore
            const recipeIds = recipes.items.map(recipe => recipe.fields.recipe?.sys.id).filter(Boolean);
           //@ts-ignore
            const relatedEntries = await contentfulClient.getEntries({'sys.id[in]': recipeIds.join(',')});

            const relatedEntriesMap = new Map();
            relatedEntries.items.forEach(entry => {
                relatedEntriesMap.set(entry.sys.id, entry);
            });


            // Filter recipes for the specified country code and resolve references
            // @ts-ignore
            recipes.items = recipes.items.filter(recipe =>
                // @ts-ignore
                recipe.fields.countryCode && recipe.fields.countryCode.includes(countryCode)
            ).map(recipe => {
                //@ts-ignore
                const relatedRecipe = relatedEntriesMap.get(recipe.fields.recipe?.sys.id);
                return {
                    title: relatedRecipe.fields.title,
                    name: relatedRecipe.fields.title,
                    contentful_id: relatedRecipe.sys.id,
                    calories: Number(recipe.fields.calories),
                    protein: Number(recipe.fields.proteinContent),
                    servings: Number(relatedRecipe.fields.serves),
                };
            });

            if (!recipes.items.length) {
                return NextResponse.json({ error: 'No recipes found' }, { status: 404 });
            }


            return NextResponse.json({ recipes: recipes.items }, { status: 200 });

        } catch (error) {
            console.error(`Server error: ${error}`);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    } else {
        return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }
})

export const POST = auth(async function POST(req) {

    if (req.auth) {
        try {
            const { userId, country_code, name, calories, protein, contentful_id, url } = await req.json();

            if (!contentful_id || contentful_id !== 'CUSTOM_RECIPE' || !userId || !country_code || !name || !calories || !protein) {
                return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
            }

            const slug = `CUSTOM_RECIPE-${slugify(name, { lower: true, strict: true })}`;
            const customContentfulId = slug;

            const customRecipesRef = db.collection('custom_recipes').doc(userId);
            const customRecipesDoc = await customRecipesRef.get();

            let customRecipes: { [key: string]: CustomRecipe } = {};

            if (customRecipesDoc.exists) {
                const data = customRecipesDoc.data();
                if (data) {
                    customRecipes = data as { [key: string]: CustomRecipe };
                }
            }

            const customRecipe = {
                slug,
                name,
                calories: Number(calories),
                protein: Number(protein),
                contentful_id: customContentfulId,
                country_code: country_code,
                url: url,
            };

            customRecipes[customRecipe.contentful_id] = customRecipe;
            await customRecipesRef.set(customRecipes);

            return NextResponse.json({ message: 'Custom recipe added successfully', recipe: customRecipe }, { status: 200 });

        } catch (error) {
            console.error(`Server error: ${error}`);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    } else {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
});