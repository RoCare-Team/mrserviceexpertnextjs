
// export default ProblemModal2;
import React, { useState } from 'react';
// Import images directly at the top level

function ProblemModal2({ onAddToCart, service, serviceConfig ,isAdded}) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedProblems, setSelectedProblems] = useState([]);
  const [validationError, setValidationError] = useState('');

  // Determine what data to use based on serviceConfig or service category
  const { brands, types, problems, icon } = serviceConfig || getDefaultConfig(service.category);

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
    
    // Create enhanced service with selections using a generic details field
    const enhancedService = {
      ...service,
      details: {
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
      {/* <button 
        className="IncrementDcrementBtn2"
        onClick={openModal}
      >
       Add
      </button> */}
      {isAdded ? (
        <button 
          className="bg-violet-300 px-2 py-1.5 cursor-not-allowed rounded"
          disabled
        >
          Added
        </button>
      ) : (
        <button 
          className="IncrementDcrementBtn2"
          onClick={openModal}
        >
          Add
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 flex justify-center items-center z-50" style={{
            background:'#000c'
        }}>
          <div className="bg-white p-6 rounded-lg shadow-lg modalWith max-w-full max-h-90vh">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {service.name} - {step === 1 ? "Brand" : step === 2 ? "Type" : "Problems"}
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
                          <img src={icon} alt={brand} className="w-20" />
                        </div>
                        <span className="mt-2 text-center text-gray-400">{brand}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <div className="grid grid-cols-3 gap-4 mb-4 typeProblem">
                    {types.map(type => (
                      <div
                        key={type}
                        onClick={() => handleTypeSelect(type)}
                        className="flex flex-col items-center cursor-pointer"
                      >
                        <div className="w-32 h-32 flex items-center justify-center brandServiceStyle">
                          <img src={icon} alt={type} className="w-28" />
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
                  <div className="space-y-2 overflow-y-auto" style={{ maxHeight: '50vh' }}>
                    {problems.map(problem => (
                      <div key={problem} className="problemsList flex justify-between items-center py-2 border-b">
                        <div className='flex flex-row items-center'>
                          <div className='problemIcon mr-3'>
                            <img src={icon} alt="" className='w-100 ' />
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
                <p>Brand: {selectedBrand}</p>
              )}
              {step > 2 && (
                <p>Type: {selectedType}</p>
              )}
              {step === 3 && selectedProblems.length > 0 && (
                <p>Problems: {selectedProblems.length}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to get config based on service category - now with added geyser config
function getDefaultConfig(category) {
  const configs = {
    'ac': {
      brands: ['Sony', 'Samsung', 'Sansui', 'LG', 'Daikin', 'Mitsubishi', 'Carrier', 'Hitachi'],
      types: ['Split', 'Window'],
      problems: [
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
      ],
      icon: "/assets/images/serviceBrands/WaterPurifier.png"
    },
    'refrigerator': {
      brands: ['Samsung', 'LG', 'Whirlpool', 'Godrej', 'Haier', 'Bosch', 'Hitachi', 'Panasonic'],
      types: ['Single Door', 'Double Door', 'Side by Side', 'French Door'],
      problems: [
        'Not cooling properly',
        'Excessive frost buildup',
        'Water leakage',
        'Strange noise',
        'Display not working',
        'Ice maker issues',
        'Door seal problems',
        'Temperature fluctuations',
        'Compressor not working',
        'Light not working',
        'Bad odor',
        'Circuit board failure',
        'Freezer not freezing',
        'Power issues',
        'Electrical problems'
      ],
      icon: "/assets/images/serviceBrands/WaterPurifier.png"
    },
    'chimney': {
      brands: ['Elica', 'Faber', 'Glen', 'Hindware', 'Kaff', 'Bosch', 'IFB', 'Sunflame'],
      types: ['Wall Mounted', 'Island', 'Built-in', 'Corner'],
      problems: [
        'Poor suction',
        'Noisy operation',
        'Light not working',
        'Remote not working',
        'Display issues',
        'Button malfunctions',
        'Filter clogging',
        'Oil dripping',
        'Motor not working',
        'Auto-clean not working',
        'Smoke clearance issues',
        'Vibration problems',
        'Installation issues',
        'Electrical problems',
        'Chimney not turning on'
      ],
      icon: "/assets/images/serviceBrands/WaterPurifier.png"
    },
    'washing-machine': {
      brands: ['Samsung', 'LG', 'IFB', 'Whirlpool', 'Bosch', 'Haier', 'Godrej', 'Panasonic'],
      types: ['Top Load', 'Front Load', 'Semi-Automatic', 'Fully-Automatic'],
      problems: [
        'Not spinning',
        'Leaking water',
        'Noisy operation',
        'Not draining properly',
        'Door not locking',
        'Water not filling',
        'Control panel issues',
        'Display not working',
        'Drum not rotating',
        'Timer problems',
        'Excessive vibration',
        'Strange smell',
        'Cycle not completing',
        'Soap dispenser issues',
        'Motor problems'
      ],
      icon: "/assets/images/serviceBrands/WaterPurifier.png"
    },
    'geyser': {
      brands: ['Havells', 'Bajaj', 'Crompton', 'V-Guard', 'AO Smith', 'Racold', 'Venus', 'Orient'],
      types: ['Instant', 'Storage', 'Gas', 'Solar'],
      problems: [
        'No hot water',
        'Water not heating enough',
        'Water too hot',
        'Leaking',
        'Strange noise',
        'Pressure issues',
        'Pilot light not working',
        'Thermostat problems',
        'Tripping circuit breaker',
        'Rusty water',
        'Heating element failure',
        'Tank corrosion',
        'Sediment buildup',
        'Electrical issues',
        'Gas supply problems'
      ],
      icon: "/assets/images/serviceBrands/WaterPurifier.png"
    },
    'water-purifier':{
      brands: ['Kent','Bajaj','Pureit','Rk Aqua','AO Smith','Tata Swach'],
      types: ['RO','UV','UF','Activated Carbon',' Gravity-Based','Alkaline','Ion Exchange'],
      problems: ['Low water flow',
        'Bad Taste',
        'Water leakage',
        'Auto shut off may stop working',
        'Excessive filter changes',
        'Tank not filling up',
        'Noisy drain flow',
        'RO not working',
        'Replacing filter elements',
        'Slow water purification'],
      icon: "/assets/images/serviceBrands/WaterPurifier.png"
    },
  };

  return configs[category] || configs['ac']; // Default to AC if category not found
}

export default ProblemModal2;