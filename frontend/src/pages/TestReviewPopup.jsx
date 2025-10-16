import React, { useState } from 'react';
import ReviewPopup from '../components/reviews/ReviewPopup';

const TestReviewPopup = () => {
  const [showPopup, setShowPopup] = useState(false);
  
  // Mock data for testing
  const mockReviews = [
    {
      rating: 5,
      user: { firstName: 'John', lastName: 'Doe' },
      comment: 'Excellent service! Highly recommended.'
    },
    {
      rating: 4,
      user: { firstName: 'Jane', lastName: 'Smith' },
      comment: 'Great experience, would book again.'
    },
    {
      rating: 5,
      user: { firstName: 'Mike', lastName: 'Johnson' },
      comment: 'Outstanding guide and service.'
    }
  ];

  const mockUser = {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com'
  };

  const handleSubmit = async (reviewData) => {
    console.log('Review submitted:', reviewData);
    alert('Review submitted successfully!');
    setShowPopup(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Test Review Popup</h1>
        <p className="text-gray-600 mb-6">
          Click the button below to test the review popup functionality.
        </p>
        <button
          onClick={() => setShowPopup(true)}
          className="bg-orange-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
        >
          Open Review Popup
        </button>
      </div>

      <ReviewPopup
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        onSubmit={handleSubmit}
        title="Review Test Service"
        entityType="guide"
        entityName="Test Guide"
        existingReviews={Array.isArray(mockReviews) ? mockReviews : []}
        userInfo={mockUser}
      />
    </div>
  );
};

export default TestReviewPopup;
