import React, { useState } from 'react';
import Ac from '../../assets/images/serviceBrands/Ac.png';

function ProblemModal({ onAddToCart, service }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedProblems, setSelectedProblems] = useState([]);
  const [validationError, setValidationError] = useState('');

  // Available data
  const brands = ['Sony', 'Samsung', 'Sansui', 'LG', 'Daikin', 'Mitsubishi', 'Carrier', 'Hitachi'];
  const types = ['Split', 'Window'];
  const problems = [
    'Not cooling properly',
    'Strange noise',
    'Water leakage',
    'Remote not working',
    'Display not working',
    'Unit not turning on',
    'Uneven cooling',
    'Bad smell',
    'Freezing up',
    'Weak airflow',
    'Thermostat issues',
    'Fan not working',
    'Compressor problems',
    'Circuit board failure',
    'Electrical issues'
  ];
  

  const openModal = () => {
    setIsOpen(true);
    // Reset all selections when opening modal
    setStep(1);
    setSelectedBrand('');
    setSelectedType('');
    setSelectedProblems([]);
    setValidationError('');
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const handleBrandSelect = (brand) => {
    setSelectedBrand(brand);
    console.log('Selected Brand:', brand);
    setStep(2);
  };

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    console.log('Selected Type:', type);
    setStep(3);
    setValidationError('');
  };

  const handleProblemToggle = (problem) => {
    setSelectedProblems(prev => {
      if (prev.includes(problem)) {
        return prev.filter(p => p !== problem);
      } else {
        return [...prev, problem];
      }
    });
    setValidationError('');
  };

  const handleSubmit = () => {
    if (selectedProblems.length === 0) {
      setValidationError('Please select at least one problem');
      return;
    }
    
    console.log('Selected Problems:', selectedProblems);
    
    // Create enhanced service with selections
    const enhancedService = {
      ...service,
      acDetails: {
        brand: selectedBrand,
        type: selectedType,
        problems: selectedProblems
      }
    };
    
    // Add to cart using the function passed as prop
    onAddToCart(enhancedService);
    closeModal();
  };

  return (
    <div>
      <button 
        className="IncrementDcrementBtn2"
        onClick={openModal}
      >
       Add
      </button>

      {isOpen && (
        <div className="fixed inset-0 flex justify-center items-center z-50" style={{
            background:'#000c'
        }}>
          <div className="bg-white p-6 rounded-lg shadow-lg modalWith max-w-full max-h-90vh">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {step === 1 ? "Brand" : step === 2 ? "Type" : "Problems"}
              </h2>
              <button 
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              {step === 1 && (
                <div>
                  <div className="grid grid-cols-3 gap-4">
                    {brands.map(brand => (
                      <div 
                        key={brand}
                        onClick={() => handleBrandSelect(brand)}
                        className="flex flex-col items-center cursor-pointer p-2"
                      >
                        <div className="w-24 h-24 flex items-center justify-center brandServiceStyle">
                          <img src={Ac} alt={brand} className="w-20" />
                        </div>
                        <span className="mt-2 text-center text-gray-400">{brand}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {types.map(type => (
                      <div
                        key={type}
                        onClick={() => handleTypeSelect(type)}
                        className="flex flex-col items-center cursor-pointer"
                      >
                        <div className="w-32 h-32 flex items-center justify-center brandServiceStyle">
                          <img src={Ac} alt={type} className="w-28" />
                        </div>
                        <span className="mt-2 text-center font-medium text-gray-400">{type}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <button 
                      onClick={() => setStep(1)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      ← Back
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  {/* Add max-height and make it scrollable */}
                  <div className="space-y-2 overflow-y-auto" style={{ maxHeight: '50vh' }}>
                    {problems.map(problem => (
                      <div key={problem} className="problemsList flex justify-between items-center py-2 border-b">
                        <div className='flex flex-row items-center'>
                          <div className='problemIcon mr-3'>
                            <img src={Ac} alt="" className='w-100 ' />
                          </div>
                          <label htmlFor={problem} className="cursor-pointer">{problem}</label>
                        </div>
                        <div>
                          <input
                            type="checkbox"
                            id={problem}
                            checked={selectedProblems.includes(problem)}
                            onChange={() => handleProblemToggle(problem)}
                            className="w-5 h-5 cursor-pointer"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Validation error message */}
                  {validationError && (
                    <div className="mt-3 text-red-500 text-sm font-medium">
                      {validationError}
                    </div>
                  )}
                  
                  <div className="mt-4 flex justify-between">
                    <button 
                      onClick={() => setStep(2)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      ← Back
                    </button>
                    
                    <button 
                      onClick={handleSubmit}
                      className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-4 rounded"
                    >
                      Proceed
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="text-sm text-gray-500">
              {step > 1 && (
                // <p>Selected Brand: {selectedBrand}</p>
                <p>Brand: {selectedBrand}</p>
              )}
              {step > 2 && (
                <p>Type: {selectedType}</p>
                // <p>Selected Type: {selectedType}</p>
              )}
              {step === 3 && selectedProblems.length > 0 && (
                <p>Problems: {selectedProblems.length}</p>
                // <p>Selected Problems: {selectedProblems.length}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProblemModal;