// @ts-nocheck

import React from 'react';

const ResponseSummary = ({ responses }) => {
    const qna = Array.isArray(responses.qna) ? responses.qna : JSON.parse(responses.qna || '[]');

    const half = Math.ceil(qna.length / 2);
    const firstHalf = qna.slice(0, half);
    const secondHalf = qna.slice(half);

    const highlightQuestion = (question, answer) => {
        const lowerAnswer = String(answer).toLowerCase();

        return (
            (question.toLowerCase().includes('dietary restrictions') || question.toLowerCase().includes('dietary preferences')) &&
            lowerAnswer !== 'none' && lowerAnswer.trim() !== '' && lowerAnswer !== ' '
        );
    };

    const renderQnA = (items) => {
        return items.map((item, index) => {
            const isHighlighted = highlightQuestion(item.question, item.answer);
            return (
                <div key={index} className={`mb-6 ${isHighlighted ? 'bg-yellow-100 p-3 rounded-lg' : ''}`}>
                    <div className={`text-sm font-semibold ${isHighlighted ? 'text-red-600' : 'text-gray-700'} mb-1`}>{item.question}</div>
                    <div className="text-base text-gray-900 bg-gray-50 p-3 rounded-lg shadow-sm">{item.answer}</div>
                </div>
            );
        });
    };

    return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    {renderQnA(firstHalf)}
                </div>
                <div>
                    {renderQnA(secondHalf)}
                </div>
            </div>
    );
};

export default ResponseSummary;
