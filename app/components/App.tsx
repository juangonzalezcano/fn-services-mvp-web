//@ts-nocheck
'use client'
import React, { useState, useEffect, useRef } from 'react';
import RecipeModal from './RecipeModal';
import EditRecipeModal from './EditRecipeModal';
import ResponseSummary from "./ResponseSummary";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt, faPlus } from '@fortawesome/free-solid-svg-icons';


interface Recipe {
    mealType?: string;
    day?: string;
    contentful_id: string;
    name: string;
    calories: number;
    protein: number;
    isSnack?: boolean;
}

interface MealPlan {
    [day: string]: {
        [mealType: string]: Recipe;
    };
}

interface Changes {
    [day: string]: {
        [mealType: string]: Recipe;
    };
}


interface UserData {
    gender: string;
    height: number;
    age: number;
    calorie_target: number;
    protein_min: number;
    protein_max: number;
}

interface Responses {
    hidden: object;
    calculated: object;
    answers: object[];
    questions: object[];
    qna: object[];
}

interface AverageDailyValues {
    calories: number;
    protein: number;
}


const App = () => {
    const [mealPlan, setMealPlan] = useState<MealPlan>({});
    const [changes, setChanges] = useState<Changes>({});
    const [patientUserId, setPatientUserId] = useState<string>("");
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [modalOpen, setModalOpen] = useState<boolean>(false);
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [showDropdown, setShowDropdown] = useState<{ day: string; meal: string }>({ day: '', meal: '' });
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [editRecipe, setEditRecipe] = useState<Recipe | null>(null);
    const [editForm, setEditForm] = useState<{
        name: string;
        calories: number;
        protein: number;
    }>({
        name: "",
        calories: 0,
        protein: 0
    });
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [responses, setResponses] = useState<Responses | {}>({});
    const [userData, setUserData] = useState<UserData | null>(null);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [averageDailyValues, setAverageDailyValues] = useState<AverageDailyValues>({ calories: 0, protein: 0 });
    const [duplicateDays, setDuplicateDays] = useState<string[]>([]);
    const [resetConfirmOpen, setResetConfirmOpen] = useState<boolean>(false);
    const [isResetting, setIsResetting] = useState<boolean>(false);
    const [cookingDays, setCookingDays] = useState<string[]>([]);
    const [shoppingDays, setShoppingDays] = useState<string[]>([]);
    const [eatingOutDays, setEatingOutDays] = useState<string[]>([]);

    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadInitialData = async (userId:string) => {
            try {
                await Promise.all([
                    fetchData(userId),
                    fetchRecipes(userId),
                    fetchResponses(userId)
                ]);
            } catch (error) {
                console.error("Error loading initial data:", error);
                setIsLoading(false);
            } finally {
                setIsLoading(false);
            }
        };

        const userId = new URLSearchParams(window.location.search).get('userId');
        if (userId) {
            setPatientUserId(userId);
            loadInitialData(userId);
        } else {
            console.log('No userId found in URL');
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown({ day: '', meal: '' });
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const fetchData = async (userId: string) => {
        try {
            const response = await fetch(`/api/meal-plan/?userId=${userId}&action=meal_plan`);
            const data = await response.json();

            if (data && data.weeklyMealPlan) {
                const normalizedMealPlan = normalizeData(data.weeklyMealPlan);
                setMealPlan(normalizedMealPlan);
                console.log(normalizedMealPlan);
                calculateAverageDailyValues(normalizedMealPlan, changes);
            }

            if (data && data.userData) {
                setUserData(data.userData);
            }
            if (data && data.keyDays) {
                setCookingDays(data.keyDays.cooking);
                setShoppingDays(data.keyDays.shopping);
                if (data.keyDays.eat_out) {
                    setEatingOutDays(data.keyDays.eat_out);
                } else {
                    setEatingOutDays([]);
                    console.warn('data.keyDays.eat_out is null or undefined');
                }
                console.log(data.keyDays.cooking);
                console.log(data.keyDays.shopping);
                console.log(data.keyDays.eat_out);
            }
            setIsLoading(false);
        } catch (error) {
            handleError(error);
            setIsLoading(false);
        }
    };

    const normalizeData = (data: MealPlan): MealPlan => {
        Object.keys(data).forEach(day => {
            Object.keys(data[day]).forEach(mealType => {
                const meal = data[day][mealType];

                if (!meal.contentful_id && meal.contentfulId) {
                    meal.contentful_id = meal.contentfulId;
                }
            });
        });
        return data;
    };

    const fetchRecipes = async (userId: string) => {
        try {
            const defaultRecipesResp = await fetch('/api/recipes/');
            const defaultRecipes = await defaultRecipesResp.json();
            const customRecipesResp = await fetch(`/api/recipes?table=recipes_custom&user_id=${userId}`);
            const customRecipes = await customRecipesResp.json();

            const defaultSnacksResp = await fetch('/api/snacks/');
            const defaultSnacks = await defaultSnacksResp.json();

            const filteredSnacks = defaultSnacks.filter((snack: Recipe) => !snack.cravings_kit);

            const combinedRecipes: Recipe[] = [
                ...defaultRecipes,
                ...filteredSnacks.map(snack => ({
                    ...snack,
                    isSnack: true
                }))
            ];

            setRecipes(combinedRecipes);
        } catch (error) {
            handleError(error);
        }
    };

    const fetchResponses = async (userId: string) => {
        try {
            const response = await fetch(`/api/responses?user_id=${userId}`);
            const data = await response.json();
            if (response.ok) {
                if (data.length > 0) {
                    const firstResponse = data[0];
                    try {
                        firstResponse.hidden = JSON.parse(firstResponse.hidden || '{}');
                        firstResponse.calculated = JSON.parse(firstResponse.calculated || '{}');
                        firstResponse.answers = JSON.parse(firstResponse.answers || '[]');
                        firstResponse.questions = JSON.parse(firstResponse.questions || '[]');
                        firstResponse.qna = JSON.parse(firstResponse.qna || '[]');
                    } catch (error) {
                        console.error('Error parsing response data:', error);
                    }
                    setResponses(firstResponse);
                } else {
                    console.log('No responses found for the given userId.');
                    setResponses({});
                }
            } else {
                throw new Error(data.error || 'Failed to fetch responses');
            }
        } catch (error) {
            handleError(error);
        }
    };

    const handleError = (error: unknown) => {
        if (error instanceof Error) {
            console.error('Failed to fetch data:', error.message);
        } else {
            console.error('An unknown error occurred:', error);
        }
    };
    const handleViewClick = (recipe:Recipe) => {
        setSelectedRecipe(recipe);
        setModalOpen(true);
    };

    const handleSelectRecipe = (contentfulId: string, day: string, meal: string) => {
        const recipe = recipes.find(r => r.contentful_id === contentfulId);
        if (recipe) {
            handleRecipeChange(day, meal, recipe);
            setShowDropdown({ day: '', meal: '' });
        }
    };

    const handleRecipeChange = (day: string, mealType: string, newRecipe: Recipe) => {
        setChanges(prevChanges => {
            const updatedDayChanges = {
                ...prevChanges[day],
                [mealType]: newRecipe
            };

            const updatedChanges = {
                ...prevChanges,
                [day]: updatedDayChanges
            };

            calculateAverageDailyValues(mealPlan, updatedChanges);

            return updatedChanges;
        });

        const newDayMeals = { ...mealPlan[day], [mealType]: newRecipe };
        const newTotals = calculateTotals(newDayMeals);

        // Update totals separately if needed
        // setTotals(prevTotals => ({
        //   ...prevTotals,
        //   [day]: newTotals
        // }));
    };

    const handleClose = () => {
        setModalOpen(false);
        setEditRecipe(null);
        setEditForm({
            name: "",
            calories: 0,
            protein: 0
        });
    };

    const handleDropdown = (day: string, meal: string) => {
        setShowDropdown(prev => {
            if (prev.day === day && prev.meal === meal) {
                return { day: '', meal: '' };
            } else {
                return { day, meal };
            }
        });
    };

    const handleEditClick = (recipe: Recipe, day: string, mealType: string) => {
        setEditRecipe({ ...recipe, day, mealType });
        setModalOpen(true);
    };

    const handleUndo = (day: string, mealType: string) => {
        setChanges(prevChanges => {
            const updatedChanges = { ...prevChanges };
            if (updatedChanges[day] && updatedChanges[day][mealType]) {
                delete updatedChanges[day][mealType];
                if (Object.keys(updatedChanges[day]).length === 0) {
                    delete updatedChanges[day];
                }
            }

            const newChanges = { ...updatedChanges };

            calculateAverageDailyValues(mealPlan, newChanges);

            return newChanges;
        });
        setShowDropdown({ day: '', meal: '' });
    };

    const handleEditSubmit = async (e: React.FormEvent, recipe: Recipe) => {
        e.preventDefault();

        const isNewRecipe = !recipe.contentful_id;

        const updatedRecipe = {
            ...recipe,
            name: editForm.name,
            calories: editForm.calories,
            protein: editForm.protein,
            contentful_id: isNewRecipe ? 'CUSTOM_RECIPE' : recipe.contentful_id
        };

        try {
            const response = await fetch('/api/recipes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: patientUserId,
                    name: updatedRecipe.name,
                    calories: updatedRecipe.calories,
                    protein: updatedRecipe.protein,
                    contentful_id: updatedRecipe.contentful_id
                })
            });

            const data = await response.json();

            if (response.ok) {
                handleRecipeChange(recipe.day, recipe.mealType, updatedRecipe);
                setModalOpen(false);
                setEditRecipe(null);
                setEditForm({ name: "", calories: 0, protein: 0 });
                // await fetchRecipes(patientUserId); // Fetch the list of recipes again to include the newly created recipe

            } else {
                throw new Error(data.error || 'Failed to save the recipe');
            }
        } catch (error ) {
            console.error('Error saving recipe:', error.message || error);
        }
    };

    const getMealDisplayData = (day: string, mealType: string) => {
        return changes[day] && changes[day][mealType] ? changes[day][mealType] : mealPlan[day][mealType];
    };

    const calculateTotals = (meals: { [key: string]: Recipe }): { calories: number; protein: number } => {
        const totals = { calories: 0, protein: 0 };
        ['breakfast', 'lunch', 'dinner', 'snack'].forEach(mealType => {
            if (meals[mealType]) {
                totals.calories += meals[mealType].calories || 0;
                totals.protein += meals[mealType].protein || 0;
            }
        });
        return totals;
    };

    const calculateAverageDailyValues = (mealPlan: MealPlan, changes: Changes) => {
        const days = Object.keys(mealPlan).filter(day => day !== 'Totals');
        let totalCalories = 0;
        let totalProtein = 0;
        let daysCount = 0;

        days.forEach(day => {
            const mealsForDay = changes[day] ? { ...mealPlan[day], ...changes[day] } : mealPlan[day];
            const totals = calculateTotals(mealsForDay);
            totalCalories += totals.calories;
            totalProtein += totals.protein;
            daysCount += 1;
        });

        setAverageDailyValues({
            calories: daysCount > 0 ? totalCalories / daysCount : 0,
            protein: daysCount > 0 ? totalProtein / daysCount : 0
        });
    };

    const validateMealPlan = () => {
        const combinedPlan = { ...mealPlan };

        Object.keys(changes).forEach(day => {
            combinedPlan[day] = {
                ...combinedPlan[day],
                ...changes[day]
            };
        });

        // Exclude the 'totals' key
        delete combinedPlan['totals'];

        const duplicateDays: string[] = [];
        const invalidDays = [];

        for (const day in combinedPlan) {
            const daySet = new Set();
            const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
            let isValidDay = true;

            mealTypes.forEach(mealType => {
                const meal = combinedPlan[day][mealType];
                if (meal && meal.contentful_id) {
                    const key = meal.contentful_id;
                    if (daySet.has(key)) {
                        duplicateDays.push(day);
                    }
                    daySet.add(key);
                } else {
                    isValidDay = false;
                }
            });

            if (!isValidDay) {
                invalidDays.push(day);
            }
        }

        return {
            hasDuplicates: duplicateDays.length > 0,
            hasInvalidDays: invalidDays.length > 0,
            duplicateDays,
            invalidDays
        };
    };

    const saveAndPublishChanges = async () => {
        const { hasDuplicates, hasInvalidDays, duplicateDays, invalidDays } = validateMealPlan();

        if (hasDuplicates) {
            alert(`Duplicate meals detected on the following days: ${duplicateDays.join(', ')}. Please resolve the duplicates before saving.`);
            return;
        }

        if (hasInvalidDays) {
            alert(`Invalid meal structure on the following days: ${invalidDays.join(', ')}. Ensure each day has breakfast, lunch, dinner, and snack.`);
            return;
        }

        setIsSaving(true);
        const updatedPlan = Object.keys(changes).reduce((acc, day) => {
            acc[day] = { ...mealPlan[day], ...changes[day] };
            return acc;
        }, { ...mealPlan });

        delete updatedPlan['totals'];

        const response = await fetch('/api/update_meal_plan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: patientUserId,
                changes: changes,
                updatedPlan: updatedPlan
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('Meal plan updated successfully:', data.message);
            setMealPlan(updatedPlan);
            setChanges({});
            calculateAverageDailyValues(updatedPlan, {});

        } else {
            console.error('Failed to update meal plan:', data.error);
        }

        setIsSaving(false);
    };

    const handleResetMealPlan = async () => {
        setIsResetting(true);
        try {
            const response = await fetch('/api/reset_meal_plan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId: patientUserId })
            });

            if (response.ok) {
                alert('Meal plan has been reset. The page will now refresh.');
                setResetConfirmOpen(false);
                window.location.reload(); // Refresh the page
            } else {
                const data = await response.json();
                alert(`Failed to reset meal plan: ${data.error}`);
            }
        } catch (error) {
            console.error('Failed to reset meal plan:', error);
            alert('An error occurred while resetting the meal plan. Please try again later.');
        } finally {
            setIsResetting(false);
        }
    };


    if (isLoading) return <p>Loading...</p>;

    const isDuplicateMeal = (day: string, mealType: string, meal: Recipe) => {
        const key = `${day}-${meal.contentful_id}`;
        const seen = new Set();

        for (const mealType in mealPlan[day]) {
            const m = mealPlan[day][mealType];
            if (m && m.contentful_id) {
                const k = `${day}-${m.contentful_id}`;
                if (k !== key && seen.has(k)) {
                    return true;
                }
                seen.add(k);
            }
        }

        for (const mealType in changes[day]) {
            const m = changes[day][mealType];
            if (m && m.contentful_id) {
                const k = `${day}-${m.contentful_id}`;
                if (k !== key && seen.has(k)) {
                    return true;
                }
                seen.add(k);
            }
        }

        return false;
    };

    return (<>Hello, world!</>);

    // return (
    //     <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center">
    //         <h1 className="text-4xl font-bold text-blue-600 mb-4">Welcome, health coach 🫡</h1>
    //         <div className="container mx-auto px-4 py-4">
    //             <div
    //                 className="bg-white shadow mx-auto rounded-lg p-6 mb-6 w-full max-w-screen-xl grid grid-cols-1 gap-6">
    //                 <div className="flex flex-col space-y-4">
    //                     {userData && (
    //                         <div className="bg-white shadow rounded-lg p-4 mb-4 w-full">
    //                             <h2 className="text-2xl font-bold text-gray-800 mb-4">Patient Information</h2>
    //                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    //                                 <div className="space-y-1">
    //                                     <p><strong>Gender:</strong> {userData.gender}</p>
    //                                     <p><strong>Height:</strong> {userData.height}</p>
    //                                     <p><strong>Age:</strong> {userData.age}</p>
    //                                 </div>
    //                                 <div className="space-y-1">
    //                                     <p><strong>Calorie Target:</strong> {userData.calorie_target}</p>
    //                                     <p><strong>Protein Minimum:</strong> {userData.protein_min}</p>
    //                                     <p><strong>Protein Maximum:</strong> {userData.protein_max}</p>
    //                                 </div>
    //                             </div>
    //                         </div>
    //                     )}
    //                     <div className="bg-white shadow rounded-lg p-4 mb-4 w-full">
    //                         <h2 className="text-2xl font-bold text-gray-800 mb-4">Response Details</h2>
    //                         <ResponseSummary responses={responses}/>
    //                     </div>
    //                     <div className="bg-white shadow rounded-lg p-4 mb-4 w-full">
    //                         <h2 className="text-2xl font-bold text-gray-800 mb-4">Daily avg. in plan</h2>
    //                         <p><strong>Calories:</strong> {averageDailyValues.calories.toFixed(2)}
    //                             <small> (Target: {userData.calorie_target})</small></p>
    //                         <p>
    //                             <strong>Protein:</strong> {averageDailyValues.protein.toFixed(2)}g <small>(Target: {userData.protein_min}-{userData.protein_max})</small>
    //                         </p>
    //                     </div>
    //                 </div>
    //             </div>
    //             <div className="flex flex-wrap justify-center gap-6">
    //                 {Object.keys(mealPlan).map(day => {
    //                     if (day === 'Totals') return null;
    //
    //                     const mealsForDay = changes[day] ? {...mealPlan[day], ...changes[day]} : mealPlan[day];
    //                     const totals = calculateTotals(mealsForDay);
    //                     const isDuplicateDay = duplicateDays.includes(day);
    //
    //                     return day !== 'Totals' && (
    //                         <div key={day}
    //                              className={`bg-white shadow rounded-lg p-4 w-96 ${isDuplicateDay ? 'bg-red-100' : ''}`}>
    //                             <h2 className="text-xl font-bold text-gray-800 mb-3 text-center">{day.charAt(0).toUpperCase() + day.slice(1).toLowerCase()}</h2>
    //                             {['breakfast', 'lunch', 'dinner', 'snack'].map(mealType => {
    //                                 const mealData = getMealDisplayData(day, mealType);
    //                                 const isChanged = changes[day] && changes[day][mealType];
    //
    //                                 return mealData && (
    //                                     <div key={`${day}-${mealType}`}
    //                                          className={`p-2 border-b last:border-b-0 ${isChanged ? 'bg-yellow-100' : ''} ${!mealData.name ? 'bg-red-100' : ''}`}>
    //                                         <h3 className="text-lg font-semibold text-gray-900 truncate cursor-pointer"
    //                                             onClick={() => handleViewClick(mealData)}>
    //                                             {mealData.name ? mealData.name :  'Please update manually'}                                            </h3>
    //                                         <div className="flex justify-between items-center">
    //                                             {mealData.name && (
    //                                                 <span className="text-sm text-gray-500">
    //                                                     Cal: {mealData.calories} | Pro: {mealData.protein}g
    //                                                 </span>
    //                                             )}
    //                                             {!mealData.name && (
    //                                                 <span className="text-sm text-gray-500">
    //                                                     {mealData.notes ? `${mealData.notes}` : ""}
    //                                                 </span>
    //                                             )}
    //
    //                                             <div>
    //                                                 <div className="flex space-x-2">
    //                                                     {isChanged ? (
    //                                                         <button
    //                                                             className="p-2 text-gray-600 bg-gray-200 rounded hover:bg-gray-300 focus:outline-none"
    //                                                             onClick={() => handleUndo(day, mealType)}>
    //                                                             <FontAwesomeIcon icon={faPencilAlt}/>
    //                                                         </button>
    //                                                     ) : (
    //                                                         <button
    //                                                             className="p-2 text-gray-600 bg-gray-200 rounded hover:bg-gray-300 focus:outline-none"
    //                                                             onClick={() => handleDropdown(day, mealType)}>
    //                                                             <FontAwesomeIcon icon={faPencilAlt}/>
    //                                                         </button>
    //                                                     )}
    //                                                     {mealType !== 'snack' ? (
    //                                                         <button
    //                                                             className="p-2 text-gray-600 bg-gray-200 rounded hover:bg-gray-300 focus:outline-none"
    //                                                             onClick={() => handleEditClick(mealData, day, mealType)}>
    //                                                             <FontAwesomeIcon icon={faPlus}/>
    //                                                         </button>
    //                                                     ) : null}
    //                                                 </div>
    //                                                 {showDropdown.day === day && showDropdown.meal === mealType && (
    //                                                     <div ref={dropdownRef}
    //                                                          className="absolute mt-2 w-full rounded-md bg-white shadow-lg z-10">
    //                                                         <input
    //                                                             type="text"
    //                                                             placeholder="Search recipes..."
    //                                                             value={searchQuery}
    //                                                             onChange={(e) => setSearchQuery(e.target.value)}
    //                                                             className="p-2 w-full"
    //                                                         />
    //                                                         {recipes
    //                                                             .filter(recipe => {
    //                                                                 if (mealType === 'snack') {
    //                                                                     return recipe.isSnack && recipe.name.toLowerCase().includes(searchQuery.toLowerCase());
    //                                                                 }
    //                                                                 return (!recipe.isSnack && recipe.name.toLowerCase().includes(searchQuery.toLowerCase())) || (recipe.isSnack === undefined && recipe.name.toLowerCase().includes(searchQuery.toLowerCase()));
    //                                                             })
    //                                                             .map(recipe => (
    //                                                                 <div key={recipe.contentful_id} onClick={() => {
    //                                                                     handleSelectRecipe(recipe.contentful_id, day, mealType);
    //                                                                     setSearchQuery("");
    //                                                                     setShowDropdown({day: '', meal: ''});
    //                                                                 }} className="p-2 hover:bg-gray-100 cursor-pointer">
    //                                                                     <span
    //                                                                         className="text-lg font-medium">{recipe.name}
    //                                                                     </span>
    //                                                                     <span>
    //                                                                         <small
    //                                                                             className="text-gray-600"> {recipe.calories}cal, {recipe.protein}g
    //                                                                         </small>
    //                                                                     </span>
    //                                                                 </div>
    //                                                             ))}
    //                                                     </div>
    //                                                 )}
    //                                             </div>
    //                                         </div>
    //                                     </div>
    //                                 );
    //                             })}
    //                             <div className="p-3 mt-4 bg-gray-100 rounded">
    //                                 <h4 className="text-sm font-semibold text-gray-800">Totals:</h4>
    //                                 <div className="flex justify-between items-center">
    //                                     <div>
    //                                         <p className="text-sm text-gray-600">Calories: {totals.calories}</p>
    //                                         <p className="text-sm text-gray-600">Protein: {totals.protein}g</p>
    //                                     </div>
    //                                     <div className="flex space-x-2">
    //                                         {cookingDays && cookingDays.map(cookingDay => cookingDay.toLowerCase()).includes(day.toLowerCase()) && (
    //                                             <span role="img" aria-label="Cooking" className="text-2xl">👨‍🍳</span>
    //                                         )}
    //                                         {shoppingDays && shoppingDays.map(shoppingDay => shoppingDay.toLowerCase()).includes(day.toLowerCase()) && (
    //                                             <span role="img" aria-label="Shopping" className="text-2xl">🛒</span>
    //                                         )}
    //                                         {/*{console.log('eatingOutDays:', eatingOutDays)}*/}
    //                                         {/*{console.log('current day:', day)}*/}
    //                                         {eatingOutDays && eatingOutDays.length > 0 && eatingOutDays.map(eatingOutDay => {
    //                                             // console.log('eatingOutDay:', eatingOutDay);
    //                                             // console.log('day:', day);
    //                                             // console.log('comparison:', eatingOutDay.toLowerCase() === day.toLowerCase());
    //                                             return eatingOutDay.toLowerCase();
    //                                         }).includes(day.toLowerCase()) && (
    //                                             <span role="img" aria-label="Eating Out" className="text-2xl">🥡</span>
    //                                         )}
    //                                     </div>
    //                                 </div>
    //                             </div>
    //                         </div>
    //                     );
    //                 })}
    //             </div>
    //         </div>
    //         <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-1.5"
    //                 onClick={saveAndPublishChanges} disabled={isSaving}>
    //             {isSaving ? 'Saving... please wait' : 'Save and Publish'}
    //         </button>
    //
    //         {/*<button*/}
    //         {/*    className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mb-1.5"*/}
    //         {/*    onClick={() => setResetConfirmOpen(true)}*/}
    //         {/*    disabled={isResetting}*/}
    //         {/*>*/}
    //         {/*    {isResetting ? 'Resetting...' : 'Reset Meal Plan'}*/}
    //         {/*</button>*/}
    //
    //         {resetConfirmOpen && (
    //             <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
    //                 <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
    //                     {!isResetting ? <h2 className="text-2xl font-bold mb-4">Confirm Reset</h2> :
    //                         <h2 className="text-2xl font-bold mb-4">Resetting...</h2>
    //                     }
    //                     {!isResetting ?
    //                         <p className="mb-4">Are you sure you want to reset the meal plan? This action will overwrite
    //                             the existing plan. The process can take a few minutes (you can navigate away and return
    //                             later).</p>
    //                         : <p className="mb-4">Resetting the meal plan... This will take a few minutes. Feel free to navigate away and come back later.</p>
    //                     }
    //                     <div className="flex justify-end space-x-4">
    //                         { !isResetting??<button
    //                             className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
    //                             onClick={() => setResetConfirmOpen(false)}
    //                         >
    //                             Cancel
    //                         </button>}
    //                         <button
    //                             className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
    //                             onClick={handleResetMealPlan}
    //                             disabled={isResetting}
    //                         >
    //                             {isResetting ? 'Resetting...' : 'Confirm'}
    //                         </button>
    //                     </div>
    //                 </div>
    //             </div>
    //         )}
    //
    //
    //
    //         <EditRecipeModal
    //             isOpen={modalOpen && editRecipe !== null}
    //             editRecipe={editRecipe}
    //             editForm={editForm}
    //             setEditForm={setEditForm}
    //             onClose={handleClose}
    //             onSubmit={handleEditSubmit}
    //         />
    //         <RecipeModal isOpen={modalOpen && !editRecipe} recipe={selectedRecipe} onClose={handleClose}/>
    //     </div>
    // );
};

export default App;
