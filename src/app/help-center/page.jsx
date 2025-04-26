"use client"
import React, { useState } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faCartPlus, faHeadphones, faPaperclip } from '@fortawesome/free-solid-svg-icons';
import Link from 'next/link';


function HelpCenter() {
  const [activeTab, setActiveTab] = useState('all');

  // Define all content sections in an array for easier management
  const contentSections = [
    {
      id: 'support',
      title: 'Customer Care',
      description: '24/7 Customer Service: +91 9311587744',
      icon: faHeadphones,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      id: 'purchasing',
      title: 'Purchasing',
      description: 'Resolve issues with promo codes, gift cards or booking services',
      icon: faCartPlus,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      id: 'guides',
      title: 'User Guides',
      description: 'Find complete instructions and manuals for it',
      icon: faBook,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600'
    }
  ];

  // Define tabs
  const tabs = [
    { id: 'all', label: 'All Topics' },
    { id: 'support', label: 'Customer Support' },
    { id: 'purchasing', label: 'Purchasing' },
    { id: 'guides', label: 'User Guides' }
  ];

  // Filter content sections based on active tab
  const filteredSections = contentSections.filter(section => 
    activeTab === 'all' || section.id === activeTab
  );

  return (
    <div className="flex justify-center items-center py-1 flex-col">
      {/* <div className="w-5/12  mx-auto py-8 px-4  sm:{px-3 py-2} "> */}
      <div className="w-full md:w-10/12 lg:w-5/12 xl:w-5/12 mx-auto py-4 md:py-8 px-4 md:px-6">
        {/* Breadcrumb */}
        <div className="flex items-center mb-3 text-sm">
          <Link href="/" className="text-black"><span className="text-black">Home</span></Link>
          <span className="mx-2">/</span>
          <span className="text-purple-600 font-medium">Help Center</span>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-purple-600 text-white p-3">
            <h3 className="queryHeading font-bold">Help Center</h3>
            <p className="querypara opacity-80">Find answers to your questions</p>
          </div>

          {/* Tabs */}
          <div className="border-b">
            <div className="flex">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-medium tabs-btn ${
                    activeTab === tab.id 
                      ? 'border-b-2 border-purple-600 text-purple-600 ' 
                      : 'text-gray-500'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="space-y-4">
              {filteredSections.map((section) => (
                <div key={section.id} className="p-3 border border-gray-200 rounded-lg services-section">
                  <div className="flex items-center">
                    <div className={`h-10 w-10 ${section.bgColor} rounded-full flex items-center justify-center`}>
                      <FontAwesomeIcon icon={section.icon} className={`${section.iconColor} text-xl`} />
                    </div>
                    <div className="ml-4">
                      <h5 className="font-semibold text-lg">{section.title}</h5>
                      <span className="text-gray-600 querySpan">{section.description}</span>
                    </div>
                    <div className="ml-auto">
                      <button className="text-purple-600 hover:text-purple-800">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HelpCenter;