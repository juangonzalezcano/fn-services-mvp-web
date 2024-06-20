import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getSessionFromNextRequest } from '@/lib/auth';

interface UserData {
    gender: string;
    height: number;
    age: number;
    calorie_target: number;
    protein_min: number;
    protein_max: number;
}

const predefinedUsers: Record<string, UserData> = {
    'clvydo7zx011gnq01e41hylre': {
        gender: 'FEMALE',
        height: 163,
        age: 33,
        calorie_target: 1174,
        protein_min: 84,
        protein_max: 112,
    },
    // Add other predefined users here
};

export async function GET(req: NextRequest) {
    try {
        const session = await getSessionFromNextRequest(req);
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const url = new URL(req.url);
        const requestedUserID = url.searchParams.get('userId');
        const action = url.searchParams.get('action');

        if (!requestedUserID) {
            return NextResponse.json({ error: 'Missing parameter' }, { status: 400 });
        }

        if (action === 'meal_plan') {
            const userDoc = await getDoc(doc(db, 'plans', requestedUserID));
            const planData = userDoc.exists() ? userDoc.data() : null;

            if (!planData) {
                return NextResponse.json({ error: 'Not found' }, { status: 404 });
            }

            const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            const completeMealPlan: Record<string, any> = {};

            for (const day of days) {
                if (planData[`plan_${day}`]) {
                    const dayPlanJson = JSON.parse(planData[`plan_${day}`]);
                    const dayPlan = dayPlanJson.weeklyMealPlan[Object.keys(dayPlanJson.weeklyMealPlan)[0]];

                    for (const mealType in dayPlan) {
                        const meal = dayPlan[mealType];
                        let recipeDetails;

                        if (mealType === 'snack') {
                            const snackDoc = await getDoc(doc(db, 'snacks', meal.contentfulId));
                            recipeDetails = snackDoc.exists() ? snackDoc.data() : null;
                        } else if (meal.contentfulId && meal.contentfulId.startsWith('CUSTOM_RECIPE')) {
                            const proxyId = meal.contentfulId;
                            const customRecipeDoc = await getDoc(doc(db, 'recipes_custom', proxyId));
                            recipeDetails = customRecipeDoc.exists() ? customRecipeDoc.data() : null;
                        } else if (meal.contentfulId) {
                            const recipeDoc = await getDoc(doc(db, 'recipes', meal.contentfulId));
                            recipeDetails = recipeDoc.exists() ? recipeDoc.data() : null;
                        }

                        if (recipeDetails) {
                            dayPlan[mealType] = { ...meal, ...recipeDetails };
                        }
                    }

                    completeMealPlan[day] = dayPlan;
                }
            }

            let userData: UserData | null = predefinedUsers[requestedUserID] || null;

            if (!userData) {
                const userDoc = await getDoc(doc(db, 'plans', requestedUserID));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    userData = {
                        gender: data.gender,
                        height: data.height,
                        age: data.age,
                        calorie_target: data.calorie_target,
                        protein_min: data.protein_min,
                        protein_max: data.protein_max,
                    };
                }
            }

            if (!userData) {
                return NextResponse.json({ error: 'User data not found' }, { status: 404 });
            }

            return NextResponse.json({
                weeklyMealPlan: completeMealPlan,
                userData,
            });
        } else {
            const userDoc = await getDoc(doc(db, 'plans', requestedUserID));
            const data = userDoc.exists() ? userDoc.data() : null;
            if (!data) {
                return NextResponse.json({ error: 'Not found' }, { status: 404 });
            }
            return NextResponse.json(data);
        }
    } catch (error) {
        console.error(`Server error: ${error}`);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
