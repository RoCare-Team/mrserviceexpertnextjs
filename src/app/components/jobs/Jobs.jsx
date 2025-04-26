import React from 'react';

function Jobs() {
  return (
    <div className='bg-white py-13'>
      <div className='container mx-auto px-3'>
        <div className='flex flex-col gap-6 mb-10'>
          <div className='border-t-2 border-dashed border-gray-200'></div>
          <h2 className='text-3xl font-bold text-center text-gray-800'>Career Opportunities</h2>
          <div className='border-t-2 border-dashed border-gray-200'></div>
          
          <p className='text-lg text-gray-600 text-center max-w-4xl mx-auto'>
           Join our dynamic team and be part of something extraordinary. We're looking for talented individuals ready to transform ideas into reality and make a meaningful impact.
          </p>
        </div>
        
        {/* Design 1: Modern Cards with Shadow */}
        {/* <h3 className='text-xl font-semibold mb-6 text-gray-700'>Design 1: Modern Cards with Shadow</h3> */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-lg shadow-lg  relative">
            <div className="absolute  oldNewStyle">
              <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">NEW</span>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Sales Executive</h3>
              <div className="flex items-center text-gray-600 mb-4">
                <span className="mr-2">📍</span>
                <span>Location: Gurgaon</span>
              </div>
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  <span className="mr-1">👥</span>
                  Vacancy: 03
                </div>
                <div className="flex items-center text-gray-500 text-sm">
                  <span className="mr-1">🕒</span>
                  Posted: 10/Mar/2023
                </div>
              </div>
              <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded transition duration-300">
                Apply Now
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg  relative">
            <div className="absolute oldNewStyle">
              <span className="bg-gray-500 text-white text-xs font-bold px-3 py-1 rounded-full">EXPIRED</span>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Franchise Sales Executive</h3>
              <div className="flex items-center text-gray-600 mb-4">
                <span className="mr-2">📍</span>
                <span>Location: Gurgaon</span>
              </div>
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  <span className="mr-1">👥</span>
                  Vacancy: 03
                </div>
                <div className="flex items-center text-gray-500 text-sm">
                  <span className="mr-1">🕒</span>
                  Posted: 10/Mar/2023
                </div>
              </div>
              <button className="w-full bg-gray-400 text-white font-medium py-2 px-4 rounded cursor-not-allowed" disabled>
                Position Filled
              </button>
            </div>
          </div>
          
          <div className="bg-gray-100 rounded-lg shadow border border-dashed border-gray-300 flex items-center justify-center p-8">
            <p className="text-lg text-gray-500 font-medium text-center">
              And many more coming soon...
            </p>
          </div>
        </div>
        
        {/* Design 2: Gradient Cards */}
        {/* <h3 className='text-xl font-semibold mb-6 text-gray-700'>Design 2: Gradient Cards</h3> */}
        {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg overflow-hidden relative">
            <div className="absolute top-4 right-4 ">
              <span className="bg-green-400 text-white text-xs font-bold px-3 py-1 rounded-md">NEW</span>
            </div>
            <div className="p-6 text-white">
              <h3 className="text-2xl font-bold mb-3">Sales Executive</h3>
              <div className="flex items-center mb-2">
                <span className="mr-2">📍</span>
                <span>Gurgaon</span>
              </div>
              <div className="flex items-center justify-between mb-6">
                <div className="bg-white bg-opacity-20 px-3 py-1 rounded-md text-sm  text-gray-400">
                  Vacancy: 03
                </div>
                <div className="text-sm">
                  10/Mar/2023
                </div>
              </div>
              <button className="flex items-center justify-center w-full bg-white text-purple-600 font-medium py-2 px-4 rounded-md hover:bg-purple-50 transition duration-300">
                Apply Now →
              </button>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl shadow-lg overflow-hidden relative">
            <div className="absolute top-0 left-2">
           
              <span className="bg-gray-700 text-white text-xs font-bold px-3 py-1 rounded-md">EXPIRED</span>
            </div>
            <div className="p-6 text-white">
              <h3 className="text-2xl font-bold mb-3">Franchise Sales Executive</h3>
              <div className="flex items-center mb-2">
                <span className="mr-2">📍</span>
                <span>Gurgaon</span>
              </div>
              <div className="flex items-center justify-between mb-6">
                <div className="bg-white bg-opacity-20 px-3 py-1 rounded-md text-sm text-gray-400">
                  Vacancy: 03
                </div>
                <div className="text-sm">
                  10/Mar/2023
                </div>
              </div>
              <button className="flex items-center justify-center w-full bg-white text-gray-500 font-medium py-2 px-4 rounded-md cursor-not-allowed" disabled>
                Position Filled
              </button>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-200 to-indigo-200 rounded-xl shadow-lg border border-dashed border-purple-300 flex items-center justify-center p-8">
            <p className="text-xl text-purple-600 font-medium text-center">
              And many more coming soon...
            </p>
          </div>
        </div> */}
        
        {/* Design 3: Bordered Cards with Accent */}
        {/* <h3 className='text-xl font-semibold mb-6 text-gray-700'>Design 3: Bordered Cards with Accent</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white border-l-4 border-purple-500 rounded-lg shadow hover:shadow-md transition-shadow duration-300 overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-800">Sales Executive</h3>
                <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">NEW</span>
              </div>
              <div className="border-b border-gray-200 pb-4 mb-4">
                <div className="flex items-center text-gray-600 mb-2">
                  <span className="mr-2">📍</span>
                  <span>Location: Gurgaon</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-purple-600 font-medium">
                    Vacancy: 03
                  </div>
                  <div className="text-sm text-gray-500">
                    Posted: 10/Mar/2023
                  </div>
                </div>
              </div>
              <button className="w-full bg-white border border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white font-medium py-2 px-4 rounded transition duration-300">
                Apply Now
              </button>
            </div>
          </div>
          
          <div className="bg-white border-l-4 border-gray-400 rounded-lg shadow hover:shadow-md transition-shadow duration-300 overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-800">Franchise Sales Executive</h3>
                <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded">EXPIRED</span>
              </div>
              <div className="border-b border-gray-200 pb-4 mb-4">
                <div className="flex items-center text-gray-600 mb-2">
                  <span className="mr-2">📍</span>
                  <span>Location: Gurgaon</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 font-medium">
                    Vacancy: 03
                  </div>
                  <div className="text-sm text-gray-500">
                    Posted: 10/Mar/2023
                  </div>
                </div>
              </div>
              <button className="w-full bg-white border border-gray-300 text-gray-400 font-medium py-2 px-4 rounded cursor-not-allowed" disabled>
                Position Filled
              </button>
            </div>
          </div>
          
          <div className="bg-white border-l-4 border-purple-300 border border-dashed border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 flex items-center justify-center p-8">
            <p className="text-lg text-gray-500 font-medium text-center">
              And many more coming soon...
            </p>
          </div>
        </div> */}
        
        {/* Design 4: Minimalist Card Layout */}
        {/* <h3 className='text-xl font-semibold mb-6 mt-16 text-gray-700'>Design 4: Minimalist Card Layout</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors duration-300">
            <div className="flex justify-between items-center mb-4">
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">NEW</span>
              <span className="text-sm text-gray-500">10/Mar/2023</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Sales Executive</h3>
            <p className="text-gray-600 mb-4">Location: Gurgaon</p>
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm bg-purple-50 text-purple-700 px-3 py-1 rounded-full">Vacancy: 03</span>
            </div>
            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-full transition duration-300">
              Apply Now
            </button>
          </div>
          
          <div className="bg-white p-6 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors duration-300">
            <div className="flex justify-between items-center mb-4">
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">EXPIRED</span>
              <span className="text-sm text-gray-500">10/Mar/2023</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Franchise Sales Executive</h3>
            <p className="text-gray-600 mb-4">Location: Gurgaon</p>
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full">Vacancy: 03</span>
            </div>
            <button className="w-full bg-gray-200 text-gray-500 font-medium py-2 px-4 rounded-full cursor-not-allowed" disabled>
              Position Filled
            </button>
          </div>
          
          <div className="bg-gray-50 p-6 border border-dashed border-gray-300 rounded-lg flex items-center justify-center">
            <p className="text-lg text-gray-500 font-medium text-center">
              And many more coming soon...
            </p>
          </div>
        </div> */}
      </div>
    </div>
  );
}

export default Jobs;