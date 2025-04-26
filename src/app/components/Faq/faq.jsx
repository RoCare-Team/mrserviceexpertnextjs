import { useState } from 'react';
import FaqImg from '../../assets/images/newFaqCon.webp';

export default function FaqAccordion({faqItems}) {
  const [openItem, setOpenItem] = useState(0);
  
  
  return (
    // <div className=" mx-auto bg-white rounded-xl shadow-md overflow-hidden">
      <div className=" bg-white common-spacing">
        <h2 className="text-4xl font-bold faqHeading mb-6">Frequently Asked Questions</h2>
        
      <div className="flex flex-wrap">
      <div className='lg:w-1/2  py-3.5 px-7'>
            <img src={FaqImg} alt='Faq Image Icon'  className=' w-full '  />
        </div>
        <div className="space-y-4 lg:w-1/2">
          {faqItems.map((item, index) => (
            <div 
              key={index}
              className={`border rounded-xl overflow-hidden transition-all duration-300 ${openItem === index ? 'border-purple-300 shadow-md' : 'border-gray-400'}`}
            >
              <button
                onClick={() => setOpenItem(openItem === index ? null : index)}
                className={`w-full p-4 text-left flex justify-between items-center ${openItem === index ? 'bg-purple-200' : 'hover:bg-gray-50'}`}
              >
                <span className="font-medium text-gray-800">{item.question}</span>
                <svg 
                  className={`w-5 h-5 text-purple-600 transform transition-transform ${openItem === index ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {openItem === index && (
                <div className="p-4 bg-white border-t border-purple-100">
                  <p className="text-gray-600">{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      </div>
    // </div>
  );
}