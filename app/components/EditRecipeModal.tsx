// @ts-nocheck

import React, { useState } from 'react';

function EditRecipeModal({ isOpen, editRecipe, editForm, setEditForm, onClose, onSubmit }) {
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen || !editRecipe) return null;

    const handleSubmit = async (e) => {
        setIsLoading(true);
        await onSubmit(e, editRecipe);
        setIsLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-8 rounded-lg shadow-lg w-96">
                <h3 className="text-xl font-bold mb-4">Add Patient's Custom Recipe</h3>
                <p className="text-sm mb-6">NOTIFICATION: Only use if patient has a healthy recipe that they want to add
                    to their calendar.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="recipeName"
                               className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                            type="text"
                            id="recipeName"
                            value={editForm.name}
                            onChange={e => setEditForm({...editForm, name: e.target.value})}
                            placeholder="Name"
                            required
                            className="border border-gray-300 rounded-md p-2 w-full"
                        />
                    </div>
                    <div>
                        <label htmlFor="calories"
                               className="block text-sm font-medium text-gray-700 mb-1">Calories</label>
                        <input
                            type="number"
                            id="calories"
                            value={editForm.calories}
                            onChange={e => setEditForm({...editForm, calories: Number(e.target.value)})}
                            placeholder="Calories"
                            required
                            className="border border-gray-300 rounded-md p-2 w-full"
                        />
                    </div>
                    <div>
                        <label htmlFor="protein" className="block text-sm font-medium text-gray-700 mb-1">Protein
                            (grams)</label>
                        <input
                            type="number"
                            id="protein"
                            value={editForm.protein}
                            onChange={e => setEditForm({...editForm, protein: Number(e.target.value)})}
                            placeholder="Protein (grams)"
                            required
                            className="border border-gray-300 rounded-md p-2 w-full"
                        />
                    </div>
                    <div>
                        <label htmlFor="recipeUrl"
                               className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                        <input
                            type="url"
                            id="recipeUrl"
                            value={editForm.url}
                            onChange={e => setEditForm({...editForm, url: e.target.value})}
                            placeholder="URL"
                            required
                            className="border border-gray-300 rounded-md p-2 w-full"
                        />
                    </div>
                    <div className="flex space-x-4">
                        <button type="submit"
                                className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save'}
                        </button>
                        <button type="button" onClick={onClose}
                                className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
                                disabled={isLoading}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default EditRecipeModal;
