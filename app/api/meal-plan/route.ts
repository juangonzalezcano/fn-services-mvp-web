// pages/api/meal-plan.ts (or route.ts depending on your file structure)
import { NextResponse } from 'next/server';
import { createClient } from 'contentful';
import { auth } from '@/auth';
import { db } from '@/lib/firebase/firebaseAdmin';

interface UserData {
    gender: string;
    height: number;
    age: number;
    calorie_target: number;
    protein_min: number;
    protein_max: number;
}

interface MealPlan {
    [day: string]: {
        [mealType: string]: Recipe;
    };
}

interface Recipe {
    title?: string;
    notes: string;
    cravings_kit?: boolean;
    mealType?: string;
    day?: string;
    contentful_id: string;
    contentfulId?: string;
    name: string;
    calories: number;
    protein: number;
    isSnack?: boolean;
}

interface Responses {
    question: string;
    answer: string;
}

interface Snack {
    title?: string;
    cravings_kit?: boolean;
    contentful_id: string;
    contentfulId?: string;
    name: string;
    calories: number;
    protein: number;
}

interface Changes {
    [day: string]: {
        [mealType: string]: Recipe;
    };
}

const contentfulClient = createClient({
    space: process.env.CONTENTFUL_SPACE_ID || '1p96mcpzbbp4',
    accessToken: process.env.CONTENTFUL_TOKEN || 'j7OkwqIZoBp9fqP9DoTbGA6BLCcD_R_JWfQ9A2qrY6g',
});

export const GET = auth(async function GET(req) {
    if (req.auth) {
        try {
            const url = new URL(req.url);
            const requestedUserID = url.searchParams.get('userId');
            const action = url.searchParams.get('action');

            if (!requestedUserID || !action) {
                return NextResponse.json({ error: 'Missing parameter' }, { status: 400 });
            }

            const planDocRef = db.collection('plans').doc(requestedUserID);
            const plan = await planDocRef.get();

            if (!plan.exists) {
                return NextResponse.json({ error: 'Not found' }, { status: 404 });
            }

            const planData = plan.data();
            if (!planData) {
                return NextResponse.json({ error: 'No plan data found' }, { status: 404 });
            }

            if (action === 'meal_plan') {
                const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                const completeMealPlan: Record<string, any> = {};
                const recipeDetails: Recipe[] = [];

                for (const day of days) {
                    const dayPlan = planData[`plan_${day}`];
                    if (dayPlan) {
                        for (const mealType in dayPlan) {
                            const meal = dayPlan[mealType];
                            let recipeDetails;

                            if (mealType == 'breakfast' || mealType == 'lunch' || mealType == 'dinner') {

                                // TODO Check if it's a custom recipe
                                // custom recipes have a proxy value in the contentful_id field in this format CUSTOM_RECIPE-<recipe_name>
                                // if (meal.contentfulId.startsWith('CUSTOM_RECIPE')) {
                                //     const recipeName = meal.contentfulId.split('-')[1];
                                //     recipeDetails = {
                                //         name: recipeName,
                                //         contentful_id: meal.contentfulId,
                                //         notes: meal.notes,
                                //         calories: meal.calories,
                                //         protein: meal.protein,
                                //         url:meal.url,
                                //         mealType: mealType,
                                //         day: day
                                //     };
                                // }
                                //


                                try {
                                    const recipe = await contentfulClient.getEntry(meal.contentfulId);
                                    const detailsOfRecipe = await contentfulClient.getEntries({
                                        content_type: 'recipeDetails',
                                        'fields.recipe.sys.id': meal.contentfulId
                                    });

                                    delete detailsOfRecipe.items[0].fields.recipe;

                                    recipeDetails = { ...recipe.fields, ...detailsOfRecipe.items[0].fields };
                                } catch (error) {
                                    console.error(`Error fetching snack details from Contentful for meal ${meal.contentfulId}: ${error}`);
                                    continue;
                                }
                            } else if (mealType === 'snack') {
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

                return NextResponse.json({
                    weeklyMealPlan: completeMealPlan as MealPlan,
                    userData: {
                        gender: planData.gender,
                        height: planData.height,
                        age: planData.age,
                        calorie_target: planData.calorie_target,
                        protein_min: planData.protein_min,
                        protein_max: planData.protein_max
                    } as UserData,
                    responses: planData.qna as Responses[],
                    recipes: recipeDetails,
                    cookingDays: planData.cooking_days as String[],
                    shoppingDays: planData.shopping_days as String[],
                    eatOutDays: planData.eat_out_days as String[]
                });
            } else {
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
            }
        } catch (error) {
            console.error(`Server error: ${error}`);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    } else {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
});

export const POST = auth(async function POST(req) {
    if (req.auth) {
        try {
            const { userId, changes }: { userId: string, changes: Changes } = JSON.parse(await req.text());

            if (!userId || !changes || Object.keys(changes).length === 0) {
                return NextResponse.json({ error: 'Missing or empty parameter' }, { status: 400 });
            }

            await updatePlan(changes, userId);

            return NextResponse.json({ message: 'Meal plan updated successfully' }, { status: 200 });
        } catch (error) {
            console.error(`Server error: ${error}`);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    } else {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }
});

const pickRequiredFields = (meal: Recipe | Snack | null): Partial<Recipe> | null => {
    if (!meal) return null;

    const { contentful_id, calories, protein } = meal;
    const notes = "";
    return { contentful_id, calories, protein, notes };
};

const transformChanges = (changes: Changes): Record<string, any> => {
    const transformed: Record<string, any> = {};

    for (const day in changes) {
        const dayKey = `plan_${day.toLowerCase()}`;
        if (!transformed[dayKey]) {
            transformed[dayKey] = {};
        }
        for (const mealType in changes[day]) {
            const requiredFields = pickRequiredFields(changes[day][mealType]);
            if (requiredFields) {
                const { contentful_id, ...rest } = requiredFields;
                transformed[dayKey][mealType] = {
                    ...rest,
                    contentfulId: contentful_id,
                };
            }
        }
    }

    return transformed;
};

const updatePlan = async (changes: Changes, userId: string) => {
    const transformedChanges = transformChanges(changes);

    try {
        const planDocRef = db.collection('plans').doc(userId);

        // Perform a batch update to ensure atomicity
        const batch = db.batch();

        // Update the meal plans
        for (const dayKey in transformedChanges) {
            batch.set(planDocRef, { [dayKey]: transformedChanges[dayKey] }, { merge: true });
        }

        // Prepare the top-level updates
        const topLevelUpdates: Record<string, any> = {
            plan_status: 'coach_saved',
            updated_at: new Date().toISOString(),
        };

        // Clear the plan_${day}_webflow_field for the changed days
        for (const day in changes) {
            const webflowFieldKey = `plan_${day.toLowerCase()}_webflow_field`;
            topLevelUpdates[webflowFieldKey] = [];
        }

        // Update the top-level fields
        batch.set(planDocRef, topLevelUpdates, { merge: true });

        // Commit the batch
        await batch.commit();

        console.log('Meal plan updated successfully');
    } catch (error) {
        console.error('Error updating meal plan:', error);
    }
};