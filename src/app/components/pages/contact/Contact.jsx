import { useState } from 'react';
import { AccountCircle, Phone, Email, Message, LocationOn, Business, Language } from '@mui/icons-material';
import { TextField } from '@mui/material';
import { Typography, InputAdornment } from '@mui/material'
import { faContactCard, faEnvelope, faSms } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Contact from '../../../assets/images/Customer-Services.jpg';
import { toast, ToastContainer } from 'react-toastify';

export default function ContactPage() {
  const [activeTab, setActiveTab] = useState('contact');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    phone: '',
  });

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success('Your message has been sent. Our team will contact you soon.');
  };

  return (
    <div className="bg-purple-100 min-h-screen common-spacing ">
        <ToastContainer/>
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-8">
          <h1 className="text-4xl font-bold text-purple-600 mb-6">Contact Us</h1>
          
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left column - Contact Form */}
            <div className="md:w-1/2">
              <div className="bg-gray-100 inline-flex rounded-lg p-1 mb-6">
                <button 
                  className={`px-4 py-2  contact-btn-style ${activeTab === 'contact' ? 'bg-purple-500 text-white' : 'text-gray-700'}`}
                  onClick={() => setActiveTab('contact')}
                >
                  Send Message
                </button>
                <button 
                  className={`px-4 py-2 contact-btn-style ${activeTab === 'info' ? 'bg-purple-500 text-white' : 'text-gray-700'}`}
                  onClick={() => setActiveTab('info')}
                >
                  Contact Info
                </button>
              </div>
              
              {activeTab === 'contact' ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    {/* <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <AccountCircle className="text-gray-400" />
                    </div> */}
                    {/* <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Your Name *"
                      required
                      className="pl-10 w-full p-3 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                    /> */}
                     <TextField
                      className='w-full'
                        required
                        label="Name"
                        variant="outlined"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <AccountCircle />
                                    </InputAdornment>
                                )
                            }
                        }}
                    />
                  </div>
                  
                  <div className="relative">
                    {/* <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Phone Number *"
                      required
                      className="pl-10 w-full p-3 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                    /> */}
                     <TextField
                      className='w-full'
                        variant="outlined"
                        label="Phone Number"

                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                    />
                  </div>
                  
                  <div className="relative">
                    {/* <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Email className="text-gray-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Email Address *"
                      required
                      className="pl-10 w-full p-3 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                    /> */}
                     <TextField
                      className='w-full'
                        required
                        variant="outlined"
                        label="Email"
                        type='email'
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <FontAwesomeIcon icon={faEnvelope} />
                                    </InputAdornment>
                                )
                            }
                        }}
                    />
                  </div>
                  
                  <div className="relative ">
                    {/* <div className="absolute top-3 left-0 pl-3 pointer-events-none">
                      <Message className="text-gray-400" />
                    </div>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Your Message *"
                      required
                      rows="5"
                      className="pl-10 w-full p-3 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                    ></textarea> */}
                     <TextField
                        variant="outlined"
                        label="Message"
                        multiline
                        rows={5}
                        name="message"
                        required
                        value={formData.message}
                        onChange={handleChange}
                        className='w-full'
                    />
                  </div>

             
                  
                  <button 
                    type="submit" 
                    className="bg-purple-500 hover:bg-purple-700 contact-btn-style text-white py-3 px-6 rounded-md transition-colors"
                  >
                    Send Message
                  </button>
                </form>
              ) : (
                <div className="bg-purple-50 p-6 rounded-lg">
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-purple-700 flex items-center">
                      <LocationOn className="mr-2" /> Head Office
                    </h4>
                    <p className="text-gray-700 ml-6">
                      Unit No. 831, 8th Floor, JMD Megapolis, Sohna Road, Sector-48, Gurugram, Haryana 122018
                    </p>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-purple-700 flex items-center">
                      <Phone className="mr-2" /> Business Phone Numbers
                    </h4>
                    <p className="text-gray-700 ml-6">+91-9268887770</p>
                    <p className="text-gray-700 ml-6">+91-92 6666 8507</p>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-purple-700 flex items-center">
                      <Email className="mr-2" /> Email
                    </h4>
                    <p className="text-gray-700 ml-6">info@rocareindia.com</p>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-purple-700 flex items-center">
                      <Language className="mr-2" /> Website
                    </h4>
                    <p className="text-gray-700 ml-6">https://www.rocareindia.com</p>
                  </div>
                  
                </div>
              )}
            </div>
            
            {/* Right column - Image and Contact Details */}
            <div className="md:w-1/2">
              <div className="mb-6">
                <img 
                  src={Contact}
                  alt="Customer Support" 
                  className="w-full rounded-lg"
                />
              </div>
              
              <div className="bg-purple-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-purple-700 mb-4">Department Contacts</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="font-medium text-purple-600">Service Query</span>
                    <span className="text-gray-700">+91-9268887770</span>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="font-medium text-purple-600">Complaints</span>
                    <span className="text-gray-700">+91-965 498 9003</span>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="font-medium text-purple-600">Sales & Marketing</span>
                    <span className="text-gray-700">+91-954 038 4046</span>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="font-medium text-purple-600">Admin Manager</span>
                    <span className="text-gray-700">+91-991 129 5362</span>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="font-medium text-purple-600">VME Department</span>
                    <span className="text-gray-700">+91-850 600 0169</span>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="font-medium text-purple-600">HR Department</span>
                    <span className="text-gray-700">+91-7065050074</span>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="font-medium text-purple-600">Managing Director</span>
                    <span className="text-gray-700">+91-706 502 1273</span>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="font-medium text-purple-600">Purchase</span>
                    <span className="text-gray-700">+91-730 388 8097</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}