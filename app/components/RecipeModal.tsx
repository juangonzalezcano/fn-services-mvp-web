
import React from 'react';

interface Recipe {
    title?: string;
    notes: string;
    cravings_kit?: boolean;
    mealType?: string;
    day?: string;
    contentful_id: string;
    name: string;
    calories: number;
    protein: number;
    isSnack?: boolean;
}

interface IngredientDetail {
    fields: {
        title: string;
        quantity: string;
    };
}

interface Recipe {
    title?: string;
    notes: string;
    cravings_kit?: boolean;
    mealType?: string;
    day?: string;
    contentful_id: string;
    name: string;
    calories: number;
    protein: number;
    isSnack?: boolean;
    ingredientsDetailList?: IngredientDetail[];
    serves?: number;
    dietaryTags?: string[];
    dietaryRestrictions?: string[];
    proteinSource?: string[];
    url?: string;

}

interface RecipeModalProps {
    isOpen: boolean;
    recipe: Recipe | null;
    onClose: () => void;
}

const RecipeModal = ({ isOpen, recipe, onClose }:RecipeModalProps) => {
    if (!isOpen || !recipe) return null;


    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-5 rounded-lg shadow-lg w-1/3">
                <h2 className="text-2xl font-bold mb-3">{recipe.title}</h2>
                <p className="text-base mb-3">{recipe.notes}</p>
                <div className="mb-4">

                    <p className="text-sm"><strong>Calories:</strong> {recipe.calories || "N/A"}</p>
                    <p className="text-sm"><strong>Protein:</strong> {recipe.protein ? `${recipe.protein}g` : "N/A"}</p>
                    <p className="text-sm"><strong>Serves:</strong> {recipe.serves || "N/A"}</p>
                    <p className="text-sm"><strong>Dietary
                        Preferences:</strong> {recipe.dietaryTags ? JSON.stringify(recipe.dietaryTags) : "N/A"}
                    </p>
                    <p className="text-sm"><strong>Dietary
                        Restrictions:</strong> {recipe.dietaryRestrictions ? JSON.stringify(recipe.dietaryRestrictions) : "N/A"}
                    </p>
                    <p className="text-sm"><strong>Protein
                        Source:</strong> {recipe.proteinSource? JSON.stringify(recipe.proteinSource) : "N/A"}
                    </p>
                </div>
                {recipe.ingredientsDetailList ? (
                    <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-2">Ingredients</h3>
                        <ul className="list-disc pl-5">

                            {recipe.ingredientsDetailList.map((item : IngredientDetail, index: number) => (
                                <>
                                    <li key={index}>{item.fields.title + ": " + item.fields.quantity}</li>
                                </>

                            ))}
                        </ul>
                    </div>
                ) : (
                    <div className="mb-4">
                        <p className="text-sm text-gray-700">This is a snack.</p>
                        {recipe.url ? (
                            <a href={recipe.url} target="_blank" rel="noopener noreferrer"
                               className="text-blue-500 hover:underline">
                                Link to snack
                            </a>
                        ) : (
                            <p className="text-sm text-gray-500">No URL available for this snack.</p>
                        )}
                    </div>
                )}
                <div className="flex justify-end space-x-2">
                    <button
                        className="px-4 py-2 text-sm text-gray-700 bg-gray-300 rounded hover:bg-gray-400 focus:outline-none"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecipeModal;
