import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/clientApp';
import { doc, getDoc } from 'firebase/firestore';
import {createClient} from "contentful";
import {auth} from "@/auth";


const contentfulClient = createClient({
    space: process.env.CONTENTFUL_SPACE_ID || "1p96mcpzbbp4",
    accessToken: process.env.CONTENTFUL_TOKEN || "j7OkwqIZoBp9fqP9DoTbGA6BLCcD_R_JWfQ9A2qrY6g",
});

export const GET = auth(async function GET(req) {

    if (req.auth)

        try {
            const url = new URL(req.url);
            const requestedUserID = url.searchParams.get('userId');
            const action = url.searchParams.get('action');

            if (!requestedUserID) {
                return NextResponse.json({ error: 'Missing parameter' }, { status: 400 });
            }

            const userDocRef = doc(db, 'plans', requestedUserID);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                return NextResponse.json({ error: 'Not found' }, { status: 404 });
            }

            const planData = userDoc.data();
            if (!planData) {
                return NextResponse.json({ error: 'No plan data found' }, { status: 404 });
            }

            if (action === 'meal_plan') {
                const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                const completeMealPlan: Record<string, any> = {};

                for (const day of days) {
                    const dayPlan = planData[`plan_${day}`];
                    if (dayPlan) {
                        for (const mealType in dayPlan) {
                            const meal = dayPlan[mealType];
                            let recipeDetails;

                            if(mealType !== 'snack') {

                                try {
                                    const recipe = await contentfulClient.getEntry(meal.contentfulId);
                                    console.log(recipe.fields)
                                    recipeDetails = recipe.fields;
                                } catch (error) {
                                    console.error(`Error fetching snack details from Contentful for meal ${meal.contentfulId}: ${error}`);
                                    continue;
                                }

                            }

                                // else if (meal.contentfulId && meal.contentfulId.startsWith('CUSTOM_RECIPE')) {
                                //      console.log(`custom recipes Not supported yet: ${meal.contentfulId}`)
                                //     const proxyId = meal.contentfulId;
                                //     const customRecipeDoc = await getDoc(doc(db, 'recipes_custom', proxyId));
                                //     recipeDetails = customRecipeDoc.exists() ? customRecipeDoc.data() : null;
                            // }

                            else if (mealType === 'snack') {
                                try {
                                    const recipeDoc = await contentfulClient.getEntry(meal.contentfulId);
                                    recipeDetails = recipeDoc.fields;
                                } catch (error) {
                                    console.error(`Error fetching recipe details from Contentful for meal ${meal.contentfulId}: ${error}`);
                                    continue;
                                }
                            }

                            if (recipeDetails) {
                                dayPlan[mealType] = { ...meal, ...recipeDetails };
                            }
                        }

                        completeMealPlan[day] = dayPlan;
                    }
                }

                return NextResponse.json({ weeklyMealPlan: completeMealPlan, userData: planData});
            } else {
                return NextResponse.json(planData);
            }
        } catch (error) {
            console.error(`Server error: ${error}`);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }

    else {
        return NextResponse.json({ message: "Not authenticated" }, { status: 401 })

    }
})

