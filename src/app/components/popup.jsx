'use client';
import { useState, useEffect } from 'react';
import { Camera, Clock, MapPin, Phone, Mail, Home, CheckCircle2, ChevronDown, ChevronRight, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';

export default function ServiceRequestForm() {
    const [currentStep, setCurrentStep] = useState('basic_details');
    const [isLoading, setIsLoading] = useState(false);

    const [showAllBrands, setShowAllBrands] = useState(false);


    // Form data state
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        email: '',
        lead_type: '',
        pincode: '',
        state: '',
        city: '',
        city_id: '', // Added city_id
        house_no: '',
        area: '',
        near_by: '',
        complain_type: '2',
        service_type: '2',
        new_type: 'product',
        domcom: '1',
        brand: '',
        meeting_date: new Date().toISOString().split('T')[0],
        time_slot: '',
        time_slots: '',
        service: '',
        otp: ''
    });

    const [categories, setCategories] = useState([]);
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    const [brands, setBrands] = useState([]);
    const [timeSlots, setTimeSlots] = useState([]);
    const [services, setServices] = useState([]);
    const [selectedBrandName, setSelectedBrandName] = useState('');
    const [selectedService, setSelectedService] = useState(null);
    const [availableTimeShifts, setAvailableTimeShifts] = useState([]);
    // const [otpSent, setOtpSent] = useState(false);
    // const [otpError, setOtpError] = useState('');
    // Add these to your existing state variables
    const [otpSent, setOtpSent] = useState(false);
    const [otpError, setOtpError] = useState('');
    const [otpVerified, setOtpVerified] = useState(false);

    // Initialize form data and load initial data
    useEffect(() => {
        loadInitialData();
        updateAvailableTimeShifts();
    }, []);

    const loadInitialData = async () => {
        try {
            // Load categories
            const categoriesRes = await fetch('https://www.waterpurifierservicecenter.in/wizard/app/getLeadType.php');
            const categoriesData = await categoriesRes.json();
            setCategories(categoriesData.AvailableCategory || []);

            // Load states
            const statesRes = await fetch('https://www.waterpurifierservicecenter.in/wizard/app/getState.php');
            const statesData = await statesRes.json();
            setStates(statesData.AvailableState || []);
        } catch (error) {
            // console.error('Error loading initial data:', error);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        if (field === 'pincode' && value.length === 6) {
            getPincode(value);
        }

        if (field === 'state' && value) {
            getCities(value);
        }
    };

    const getPincode = async (pincode) => {
        if (pincode.length === 6) {
            try {
                const response = await fetch(
                    `https://inet.waterpurifierservicecenter.in/include/ajax/get_city_with_pincode.php?pincode=${pincode}`
                );
                const data = await response.json();

                // console.log('Pincode API response:', data);
                // console.log('City ID from pincode:', data.city_id);

                if (data && data.state) {
                    // Fetch the list of cities for that state
                    await getCities(data.state);

                    // Wait a little to ensure cities are loaded, then set the formData
                    setTimeout(() => {
                        setFormData((prev) => ({
                            ...prev,
                            state: data.state,
                            city: data.city,
                            city_id: data.city_id, // Set city_id from API response
                        }));
                        toast.success('Location auto-filled!');
                    }, 300);
                } else {
                    toast.error('No location found for this pincode.');
                }
            } catch (error) {
                // console.error('Error fetching pincode data:', error);
            }
        }
    };

    const getState = async () => {
        const stateInLocal = localStorage.getItem('state_in_local');
        if (stateInLocal && stateInLocal !== "null") {
            const statesInLocal = JSON.parse(stateInLocal);
            setStates(statesInLocal);
        } else {
            try {
                const response = await fetch(
                    "https://www.waterpurifierservicecenter.in/wizard/app/getState.php"
                );
                const data = await response.json();
                const availableStates = data.AvailableState || [];
                setStates(availableStates);
                localStorage.setItem('state_in_local', JSON.stringify(availableStates));
            } catch (error) {
                // console.error('Error fetching states:', error);
            }
        }
    };

    const getCities = async (state) => {
        try {
            const response = await fetch(
                `https://www.waterpurifierservicecenter.in/wizard/app/getCity.php?state=${state}`
            );
            const data = await response.json();
            setCities(data.AvailableCities || []);
        } catch (error) {
            // console.error('Error fetching cities:', error);
        }
    };

    const parseSelectOptions = (htmlString) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');
        const options = Array.from(doc.querySelectorAll('option'));
        return options.map(option => ({
            value: option.value,
            text: option.textContent
        })).filter(opt => opt.value !== '');
    };

    const get_brand = async (leadTypeId) => {
        try {
            const response = await fetch(`https://waterpurifierservicecenter.in/wizard/app/getBrand.php?lead_type_category=${leadTypeId}`);
            const data = await response.json();
            setBrands(data.brand || []);
        } catch (error) {
            // console.error('Error fetching brands:', error);
        }
    };

    const get_time_slot = async (slot_name) => {
        try {
            const response = await fetch(`https://waterpurifierservicecenter.in/wizard/app/getTimeSlots.php?time_slot_name=${slot_name}`);
            const data = await response.json();
            setTimeSlots(data.alltimeslots || []);
        } catch (error) {
            // console.error('Error fetching time slots:', error);
        }
    };

    const get_service = async () => {
        try {
            const response = await fetch(`https://waterpurifierservicecenter.in/wizard/app/getAllServices.php?lead_type_category=${formData.lead_type}&brand=${formData.brand}`);
            const data = await response.json();
            setServices(data.service_details || []);
        } catch (error) {
            // console.error('Error fetching services:', error);
        }
    };

    const mobilevalid = (mobile) => {
        const mob = mobile.replace(/[^\d\+]/g, '');
        return mob.length === 10;
    };

    const validateMobile = (evt) => {
        const theEvent = evt || window.event;
        let key;

        if (theEvent.type === 'paste') {
            key = evt.clipboardData.getData('text/plain');
        } else {
            key = theEvent.keyCode || theEvent.which;
            key = String.fromCharCode(key);
        }

        const regex = /[0-9]|\./;
        if (!regex.test(key)) {
            theEvent.returnValue = false;
            if (theEvent.preventDefault) theEvent.preventDefault();
        }
    };

    const resendOtp = async () => {
        setIsLoading(true);
        try {
            const queryParams = new URLSearchParams({
                name: formData.name,
                mobile: formData.mobile,
                email: formData.email,
                lead_type: formData.lead_type,
                state: formData.state,
                city: formData.city_id,
                complain_type: formData.complain_type,
                site_url: window.location.href,
                check: 'nootp',
                otpsend: '1',
                otp_verify: 'verifyed',
                otp_chk: 'mrserviceexpert'
                // Add this parameter for consistency
            });

            const response = await fetch(`https://waterpurifierservicecenter.in/wizard/app/AddLead_new.php?${queryParams}`);
            const data = await response.json();

            if (data.status === 1) {
                toast.success('OTP sent successfully!');
                setOtpSent(true);
                setOtpError('');
            }
            else if (data.status === 2) {
                toast.success('You have already booked service in this category.');
            } else {
                toast.error('Failed to send OTP. Please try again.');
            }
        } catch (error) {
            // console.error('Error resending OTP:', error);
            toast.error('Error sending OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const skipOtpVerification = () => {
        setCurrentStep('brand_section');
        setOtpError('');
        toast.info('Skipped OTP verification');
    };

    const verifyOtp = async () => {
        if (formData.otp.length !== 6) {
            setOtpError('Please enter 6-digit OTP');
            return;
        }

        setIsLoading(true);
        try {
            // Use the correct parameter names as in PHP
            const queryParams = new URLSearchParams({
                mobile: formData.mobile,
                otp: formData.otp,
                check: 'yesotp',
                otp_verify: 'verifyed' // Add this parameter
            });

            const response = await fetch(`https://waterpurifierservicecenter.in/wizard/app/AddLead_new.php?${queryParams}`);
            const data = await response.json();

            // console.log('OTP Verification Response:', data);

            if (data.status === 1) {
                toast.success('OTP verified successfully!');
                setOtpVerified(true);
                setOtpError('');
                setTimeout(() => {
                    setCurrentStep('brand_section');
                }, 1000);
            } else {
                setOtpError('Invalid OTP. Please try again.');
                toast.error('Invalid OTP');
            }
        } catch (error) {
            // console.error('Error verifying OTP:', error);
            setOtpError('Error verifying OTP');
            toast.error('Error verifying OTP');
        } finally {
            setIsLoading(false);
        }
    };
    const saveData = async () => {
        if (!formData.name.trim()) {
            alert('Please enter your name');
            return false;
        }
        if (!mobilevalid(formData.mobile)) {
            alert('Please enter a valid 10-digit mobile number');
            return false;
        }
        if (!formData.lead_type) {
            alert('Please select a category');
            return false;
        }
        if (!formData.state) {
            alert('Please select a state');
            return false;
        }
        if (!formData.city_id) { // Check city_id instead of city
            alert('Please select a city');
            return false;
        }
        if (!formData.house_no.trim() || !formData.area.trim() || !formData.near_by.trim()) {
            alert('Please fill in complete address details');
            return false;
        }

        setIsLoading(true);

        try {
            const queryParams = new URLSearchParams({
                name: formData.name,
                mobile: formData.mobile,
                email: formData.email,
                lead_type: formData.lead_type,
                pincode: formData.pincode,
                state: formData.state,
                city: formData.city_id,
                house_no: formData.house_no,
                area: formData.area,
                near_by: formData.near_by,
                complain_type: formData.complain_type,
                sev_type_val: formData.service_type,
                new_type_val: formData.new_type,
                new_purchase_type: formData.domcom,
                site_url: window.location.href,
                check: 'nootp',
                otpsend: (formData.complain_type === '1' || formData.lead_type === '3') ? '0' : '1',
                otp_verify: 'verifyed',
                otp_chk: 'mrserviceexpert'
                // Add this parameter
            });

            // console.log('Save Data API URL:', `https://waterpurifierservicecenter.in/wizard/app/AddLead_new.php?${queryParams}`);

            const response = await fetch(`https://waterpurifierservicecenter.in/wizard/app/AddLead_new.php?${queryParams}`);
            const data = await response.json();

            // console.log('Save Data Response:', data);

            if (data.status === 1) {
                if (formData.complain_type === '1' || formData.lead_type === '3') {
                    setCurrentStep('success_message_section');
                } else {
                    setCurrentStep('otp_section');
                    setOtpSent(true);
                    toast.success('OTP sent to your mobile!');
                }
            }
            else if (data.status === 2) {
                toast.warn('You have already booked service in this category.');
            } else {
                toast.error('Failed to send OTP. Please try again.');
            }

        } catch (error) {
            // console.error('Error saving basic details:', error);
            toast.error('Failed to save details');
        } finally {
            setIsLoading(false);
        }
    };



    const updateBrand = async (brandId) => {
        if (!brandId) {
            alert('Please select a brand');
            return false;
        }

        // if (!formData.brand) {
        //     alert('Please select a brand');
        //     return false;
        // }

        setIsLoading(true);
        try {
            await get_service();

            const queryParams = new URLSearchParams({
                name: formData.name,
                mobile: formData.mobile,
                email: formData.email,
                lead_type: formData.lead_type,
                state: formData.state,
                city: formData.city_id, // Use city_id
                complain_type: formData.complain_type,
                brand: formData.brand,
                site_url: window.location.href,
                check: 'nootp',
                otp_chk: 'mrserviceexpert'
            });

            const response = await fetch(`https://waterpurifierservicecenter.in/wizard/app/AddLead_new.php?${queryParams}`);
            const data = await response.json();

            // console.log('Update Brand Response:', data);

            setCurrentStep('time_slot');
        } catch (error) {
            // console.error('Error updating brand:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const updateTimeSlot = async () => {
        if (!formData.meeting_date) {
            alert('Please select a date');
            return false;
        }
        if (!formData.time_slot) {
            alert('Please select a time shift');
            return false;
        }
        if (!formData.time_slots) {
            alert('Please select a time slot');
            return false;
        }

        setIsLoading(true);
        try {
            const queryParams = new URLSearchParams({
                name: formData.name,
                mobile: formData.mobile,
                email: formData.email,
                lead_type: formData.lead_type,
                state: formData.state,
                city: formData.city_id, // Use city_id
                complain_type: formData.complain_type,
                brand: formData.brand,
                appointment_date: formData.meeting_date,
                appointment_time: formData.time_slots,
                site_url: window.location.href,
                check: 'nootp',
                otp_chk: 'mrserviceexpert'
            });

            const response = await fetch(`https://waterpurifierservicecenter.in/wizard/app/AddLead_new.php?${queryParams}`);
            const data = await response.json();

            // console.log('Update Time Slot Response:', data);

            setCurrentStep('service_section');
        } catch (error) {
            // console.error('Error updating time slot:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const select_service = async (service_id, service_name, service_price) => {
        setIsLoading(true);
        try {
            const queryParams = new URLSearchParams({
                name: formData.name,
                mobile: formData.mobile,
                email: formData.email,
                lead_type: formData.lead_type,
                state: formData.state,
                city: formData.city_id,
                complain_type: formData.complain_type,
                brand: formData.brand,
                appointment_date: formData.meeting_date,
                appointment_time: formData.time_slots,
                service_id: service_id,
                service_name: service_name,
                service_price: service_price,
                amount: service_price, // Add amount parameter
                price: service_price,  // Add price parameter
                site_url: window.location.href,
                check: 'nootp',
                otp_chk: 'mrserviceexpert'
            });

            // console.log('Service selection with amount/price:', queryParams.toString());

            const response = await fetch(
                `https://waterpurifierservicecenter.in/wizard/app/AddLead_new.php?${queryParams}`
            );
            const data = await response.json();

            // console.log('Service selection response:', data);

            setSelectedService({
                id: service_id,
                name: service_name,
                price: service_price
            });

            setCurrentStep('show_details_section');
        } catch (error) {
            // console.error('Error selecting service:', error);
        } finally {
            setIsLoading(false);
        }
    };
    const pay_later = () => {

        // console.log('Proceeding to pay later with mobile:', JSON.stringify(formData));

        window.location.href = `https://waterpurifierservicecenter.in/inet/get_popup_data_wizard_auto_for_pay_new.php?mobile=${formData.mobile}`;
    };

    const updateAvailableTimeShifts = () => {
        const hour = new Date().getHours();
        const isToday = formData.meeting_date === new Date().toISOString().split('T')[0];

        if (!isToday) {
            setAvailableTimeShifts(['Morning', 'Afternoon', 'Evening']);
        } else {
            if (hour < 12) {
                setAvailableTimeShifts(['Morning', 'Afternoon', 'Evening']);
            } else if (hour < 18) {
                setAvailableTimeShifts(['Afternoon', 'Evening']);
            } else {
                setAvailableTimeShifts(['Evening']);
            }
        }
    };

    const isToday = (date) => {
        const today = new Date().toISOString().split('T')[0];
        return date === today;
    };

    const getCurrentHour = () => {
        return new Date().getHours();
    };

    const getAvailableTimeShifts = () => {
        const hour = getCurrentHour();
        const isToday = formData.meeting_date === new Date().toISOString().split('T')[0];

        if (!isToday) return ['Morning', 'Afternoon', 'Evening'];

        if (hour < 12) return ['Morning', 'Afternoon', 'Evening'];
        if (hour < 18) return ['Afternoon', 'Evening'];
        return ['Evening'];
    };

    const skipTimeSlot = () => {
        setCurrentStep('service_section');
    };

    const [expandedService, setExpandedService] = useState(null);

    // Handle city selection properly
    const handleCityChange = (e) => {
        const selectedCity = cities.find(city => city.city_name === e.target.value);
        setFormData(prev => ({
            ...prev,
            city: selectedCity?.city_name || '',
            city_id: selectedCity?.city_id || ''
        }));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-4 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Progress Bar */}
                {!['otp_section', 'success_message_section'].includes(currentStep) && currentStep !== 'basic_details' && (
                    <div className="mt-8">
                        <div className="flex justify-between items-center mb-4">
                            {['Basic Details', 'Select Brand', 'Schedule Visit', 'Choose Service'].map((label, index) => {
                                const stepNumber = index + 1;
                                const currentStepNumber =
                                    currentStep === 'brand_section' ? 2 :
                                        currentStep === 'time_slot' ? 3 :
                                            currentStep === 'service_section' ? 4 :
                                                currentStep === 'show_details_section' ? 4 : 1;

                                return (
                                    <div key={index} className="flex items-center">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${currentStepNumber > stepNumber ? 'bg-green-500 text-white' :
                                            currentStepNumber === stepNumber ? 'bg-blue-600 text-white shadow-lg' :
                                                'bg-gray-200 text-gray-500'
                                            }`}>
                                            {currentStepNumber > stepNumber ? <CheckCircle2 size={20} /> : stepNumber}
                                        </div>
                                        {index < 3 && (
                                            <div className={`w-12 sm:w-20 h-1 mx-1 ${currentStepNumber > stepNumber ? 'bg-green-500' : 'bg-gray-200'
                                                }`} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Form Container */}
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

                    {/* Step 1: Basic Details */}
                    {currentStep === 'basic_details' && (
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    {/* <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label> */}
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                        placeholder="Enter your full name"
                                    />
                                </div>
                                <div>
                                    {/* <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number *</label> */}
                                    <input
                                        type="tel"
                                        value={formData.mobile}
                                        // onChange={(e) => handleInputChange('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        onChange={(e) => {
                                            let value = e.target.value;

                                            // Remove everything except numbers
                                            value = value.replace(/[^0-9]/g, "");

                                            // Remove leading zero automatically
                                            value = value.replace(/^0+/, "");

                                            // Limit to 10 digits
                                            if (value.length > 10) value = value.slice(0, 10);

                                            handleInputChange("mobile", value);
                                        }}

                                        onKeyPress={validateMobile}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                        placeholder="10 digit mobile number"
                                    />
                                </div>
                            </div>


                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    {/* <label className="block text-sm font-medium text-gray-700 mb-2">Email</label> */}
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                        placeholder="your@email.com"
                                    />
                                </div>

                                <div>
                                    {/* <label htmlFor="pincode" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                    Pincode *
                                </label> */}
                                    <input
                                        type="text"
                                        id="pincode"
                                        value={formData.pincode}
                                        onChange={(e) => handleInputChange('pincode', e.target.value)}
                                        maxLength={6}
                                        pattern="[0-9]{6}"
                                        className="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm sm:text-base"
                                        required
                                        placeholder="Enter Pincode"
                                    />
                                </div>

                            </div>



                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                        State *
                                    </label>
                                    <select
                                        id="state"
                                        value={formData.state}
                                        onChange={(e) => handleInputChange('state', e.target.value)}
                                        className="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm sm:text-base"
                                        required
                                    >
                                        <option value="">Select State</option>
                                        {states.map((stateObj) => (
                                            <option key={stateObj.state} value={stateObj.state}>
                                                {stateObj.state}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                                        City *
                                    </label>
                                    <select
                                        id="city"
                                        value={formData.city}
                                        onChange={handleCityChange}
                                        className="w-full px-3 py-2 sm:px-4 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-sm sm:text-base"
                                        required
                                    >
                                        <option value="">Select City</option>
                                        {cities.map((cityObj) => (
                                            <option key={cityObj.city_id} value={cityObj.city_name}>
                                                {cityObj.city_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>


                            <div className='md:w-[50%] w-full'>

                                <select
                                    value={formData.lead_type}
                                    onChange={(e) => {
                                        handleInputChange('lead_type', e.target.value);
                                        get_brand(e.target.value);
                                    }}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat.type_id} value={cat.type_id}>{cat.type}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-800">Service Type</h3>
                                <div className="flex gap-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="complain_type"
                                            value="2"
                                            checked={formData.complain_type === '2'}
                                            onChange={(e) => handleInputChange('complain_type', e.target.value)}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <span className="text-gray-700">Service</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="complain_type"
                                            value="1"
                                            checked={formData.complain_type === '1'}
                                            onChange={(e) => handleInputChange('complain_type', e.target.value)}
                                            className="w-4 h-4 text-blue-600"
                                        />
                                        <span className="text-gray-700">New Purchase</span>
                                    </label>
                                </div>

                                {formData.complain_type === '2' && (
                                    <div className="flex gap-4 flex-wrap">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="service_type"
                                                value="2"
                                                checked={formData.service_type === '2'}
                                                onChange={(e) => handleInputChange('service_type', e.target.value)}
                                                className="w-4 h-4 text-blue-600"
                                            />
                                            <span className="text-gray-700">Repair/Service</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="service_type"
                                                value="1"
                                                checked={formData.service_type === '1'}
                                                onChange={(e) => handleInputChange('service_type', e.target.value)}
                                                className="w-4 h-4 text-blue-600"
                                            />
                                            <span className="text-gray-700">Installation/Uninstallation</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="service_type"
                                                value="3"
                                                checked={formData.service_type === '3'}
                                                onChange={(e) => handleInputChange('service_type', e.target.value)}
                                                className="w-4 h-4 text-blue-600"
                                            />
                                            <span className="text-gray-700">AMC</span>
                                        </label>
                                    </div>
                                )}

                                {formData.complain_type === '1' && (
                                    <>
                                        <div className="flex gap-4 flex-wrap">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="new_type"
                                                    value="product"
                                                    checked={formData.new_type === 'product'}
                                                    onChange={(e) => handleInputChange('new_type', e.target.value)}
                                                    className="w-4 h-4 text-blue-600"
                                                />
                                                <span className="text-gray-700">Product</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="new_type"
                                                    value="spare_parts"
                                                    checked={formData.new_type === 'spare_parts'}
                                                    onChange={(e) => handleInputChange('new_type', e.target.value)}
                                                    className="w-4 h-4 text-blue-600"
                                                />
                                                <span className="text-gray-700">Spare Parts</span>
                                            </label>
                                        </div>
                                        <div className="flex gap-4 flex-wrap">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="domcom"
                                                    value="1"
                                                    checked={formData.domcom === '1'}
                                                    onChange={(e) => handleInputChange('domcom', e.target.value)}
                                                    className="w-4 h-4 text-blue-600"
                                                />
                                                <span className="text-gray-700">Domestic</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="domcom"
                                                    value="2"
                                                    checked={formData.domcom === '2'}
                                                    onChange={(e) => handleInputChange('domcom', e.target.value)}
                                                    className="w-4 h-4 text-blue-600"
                                                />
                                                <span className="text-gray-700">Commercial</span>
                                            </label>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-800">Address Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        value={formData.house_no}
                                        onChange={(e) => handleInputChange('house_no', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                        placeholder="House No. / Building No. *"
                                    />
                                    <input
                                        type="text"
                                        value={formData.area}
                                        onChange={(e) => handleInputChange('area', e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                        placeholder="Road Name / Area *"
                                    />
                                </div>
                                <input
                                    type="text"
                                    value={formData.near_by}
                                    onChange={(e) => handleInputChange('near_by', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                    placeholder="Nearby Place / Shop / School *"
                                />
                            </div>

                            <button
                                onClick={saveData}
                                disabled={isLoading}
                                className="w-full btn-style-1 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition transform hover:scale-[1.02] disabled:opacity-50"
                            >
                                {isLoading ? 'Please Wait...' : 'Next Step'}
                            </button>
                        </div>
                    )}

                    {/* OTP Section */}
                    {currentStep === 'otp_section' && (
                        <div className="p-6 space-y-6">
                            <div className="text-center mb-2">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Phone className="text-blue-600" size={24} />
                                </div>
                                <h3 className="text-xl font-semibold text-gray-800 mb-2">OTP Verification</h3>
                                <p className="text-gray-600">We've sent an OTP to your mobile number</p>
                                <p className="font-semibold text-gray-800 text-lg">+91 {formData.mobile}</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Enter OTP *</label>
                                    <input
                                        type="text"
                                        value={formData.otp}
                                        onChange={(e) => {
                                            handleInputChange('otp', e.target.value.replace(/\D/g, '').slice(0, 6));
                                            setOtpError('');
                                        }}
                                        placeholder="Enter 6-digit OTP"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-center text-lg font-semibold"
                                        maxLength={6}
                                    />
                                    {otpError && (
                                        <p className="text-red-500 text-sm mt-2">{otpError}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    <button
                                        onClick={verifyOtp}
                                        disabled={isLoading || formData.otp.length !== 6}
                                        className="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? 'Verifying...' : 'Verify OTP'}
                                    </button>

                                    <div className="text-center">
                                        <button
                                            onClick={resendOtp}
                                            disabled={isLoading}
                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
                                        >
                                            Didn't receive OTP? Resend
                                        </button>
                                    </div>

                                    <button
                                        onClick={skipOtpVerification}
                                        className="bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition duration-200 font-medium"
                                    >
                                        Skip OTP Verification
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Brand Selection */}
                    {currentStep === 'brand_section' && (
                        <div className="p-6 space-y-6">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Select Your Brand</h3>

                            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                                {(showAllBrands ? brands : brands.slice(0, 12)).map(brand => (
                                    <label
                                        key={brand.id}
                                        className={`relative cursor-pointer border-2 rounded-lg p-4 transition hover:shadow-lg ${formData.brand === brand.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-400'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="brand"
                                            value={brand.id}
                                            checked={formData.brand === brand.id}
                                            onChange={(e) => {
                                                handleInputChange('brand', e.target.value);
                                                setSelectedBrandName(brand.name);
                                                updateBrand(e.target.value);
                                            }}
                                            className="sr-only"
                                        />
                                        <img src={brand.image} alt={brand.name} className="w-full h-16 object-contain mb-2" />
                                        <p className="text-center text-sm font-medium text-gray-700">{brand.name}</p>
                                        {formData.brand === brand.id && (
                                            <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-1">
                                                <CheckCircle2 size={16} />
                                            </div>
                                        )}
                                    </label>
                                ))}
                            </div>

                            {/* View More/Less Button */}
                            {brands.length > 12 && (
                                <div className="text-center">
                                    <button
                                        onClick={() => setShowAllBrands(!showAllBrands)}
                                        className="inline-flex items-center gap-2 px-6 py-2 text-blue-600 hover:text-blue-800 font-medium transition"
                                    >
                                        {showAllBrands ? (
                                            <>
                                                View Less
                                                <ChevronDown className="rotate-180 transition-transform" size={20} />
                                            </>
                                        ) : (
                                            <>
                                                View More ({brands.length - 12} more brands)
                                                <ChevronDown size={20} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setCurrentStep('basic_details')}
                                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition flex items-center justify-center gap-2"
                                >
                                    <ArrowLeft size={20} /> Back
                                </button>
                                <button
                                    onClick={updateBrand}
                                    disabled={isLoading || !formData.brand}
                                    className="flex-1 btn-style-1 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
                                >
                                    {isLoading ? 'Loading...' : 'Next Step'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Schedule Visit */}
                    {currentStep === 'time_slot' && (
                        <div className="p-6 space-y-6">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Schedule Engineer Visit</h3>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Date *</label>
                                <input
                                    type="date"
                                    value={formData.meeting_date}
                                    onChange={(e) => {
                                        handleInputChange('meeting_date', e.target.value);
                                        handleInputChange('time_slot', '');
                                        handleInputChange('time_slots', '');
                                        updateAvailableTimeShifts();
                                    }}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                />
                            </div>

                            <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-3">Select Part of the Day *</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {getAvailableTimeShifts().map(shift => (
                                        <label
                                            key={shift}
                                            className={`cursor-pointer border-2 rounded-lg p-4 text-center transition hover:shadow-lg ${formData.time_slot === shift ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-400'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="time_slot"
                                                value={shift}
                                                checked={formData.time_slot === shift}
                                                onChange={(e) => {
                                                    handleInputChange('time_slot', e.target.value);
                                                    handleInputChange('time_slots', '');
                                                    get_time_slot(e.target.value);
                                                }}
                                                className="sr-only"
                                            />
                                            <Clock className="mx-auto mb-2 text-blue-600" size={24} />
                                            <p className="font-semibold text-gray-800">{shift}</p>
                                            {formData.time_slot === shift && (
                                                <div className="mt-2 text-blue-600">
                                                    <CheckCircle2 size={20} className="mx-auto" />
                                                </div>
                                            )}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {formData.time_slot && timeSlots.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-3">Select Preferred Time Slot *</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        {timeSlots.map(slot => (
                                            <label
                                                key={slot.id}
                                                className={`cursor-pointer border-2 rounded-lg p-3 text-center transition hover:shadow-lg ${formData.time_slots === slot.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-400'
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="time_slots"
                                                    value={slot.id}
                                                    checked={formData.time_slots === slot.id}
                                                    onChange={(e) => handleInputChange('time_slots', e.target.value)}
                                                    className="sr-only"
                                                />
                                                <p className="text-sm font-medium text-gray-700">{slot.time_slots}</p>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setCurrentStep('brand_section')}
                                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition flex items-center justify-center gap-2"
                                >
                                    <ArrowLeft size={20} /> Back
                                </button>
                                <button
                                    onClick={skipTimeSlot}
                                    className="flex-1 bg-yellow-500 text-white py-3 rounded-lg font-semibold hover:bg-yellow-600 transition"
                                >
                                    Skip
                                </button>
                                <button
                                    onClick={updateTimeSlot}
                                    disabled={isLoading || !formData.time_slots}
                                    className="flex-1 btn-style-1  text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
                                >
                                    {isLoading ? 'Loading...' : 'Next Step'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Service Selection */}
                    {currentStep === 'service_section' && (
                        <div className="p-4 space-y-4">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Select Required Service</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {services.map(service => (
                                    <div
                                        key={service.id}
                                        className={`border-2 rounded-lg overflow-hidden transition hover:shadow-xl ${formData.service === service.id ? 'border-blue-600 shadow-lg' : 'border-gray-200'
                                            }`}
                                    >
                                        <div className="relative">
                                            <img src={service.image} alt={service.service_name} className="w-full h-24 object-cover" />
                                            {formData.service === service.id && (
                                                <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full p-2">
                                                    <CheckCircle2 size={20} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <h4 className="font-bold text-[17px] text-gray-800 mb-2">{service.service_name}</h4>
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-[15px] font-bold text-blue-600">₹{service.price}</span>
                                                <button
                                                    onClick={() => select_service(service.id, service.service_name, service.price)}
                                                    disabled={isLoading}
                                                    className={`px-2 py-1.5 text-[15px] rounded-lg font-semibold transition ${formData.service === service.id
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                                        } disabled:opacity-50`}
                                                >
                                                    {isLoading ? 'Loading...' : 'Book Now'}
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => setExpandedService(expandedService === service.id ? null : service.id)}
                                                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                                            >
                                                {expandedService === service.id ? 'Hide' : 'Show'} Details
                                                <ChevronDown className={`transition-transform ${expandedService === service.id ? 'rotate-180' : ''}`} size={16} />
                                            </button>
                                            {expandedService === service.id && (
                                                <div
                                                    className="mt-3 text-sm text-gray-600 border-t pt-3"
                                                    dangerouslySetInnerHTML={{ __html: service.description }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setCurrentStep('time_slot')}
                                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition flex items-center justify-center gap-2"
                                >
                                    <ArrowLeft size={20} /> Back
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Review Section */}
                    {currentStep === 'show_details_section' && (
                        <div className="p-6 space-y-6">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Review Your Request</h3>
                            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-start gap-3">
                                        <Phone className="text-blue-600 mt-1" size={20} />
                                        <div>
                                            <p className="text-sm text-gray-600">Name & Contact</p>
                                            <p className="font-semibold text-gray-800">{formData.name}</p>
                                            <p className="text-sm text-gray-700">{formData.mobile}</p>
                                            {formData.email && <p className="text-sm text-gray-700">{formData.email}</p>}
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <MapPin className="text-blue-600 mt-1" size={20} />
                                        <div>
                                            <p className="text-sm text-gray-600">Address</p>
                                            <p className="font-semibold text-gray-800">{formData.house_no}, {formData.area}</p>
                                            <p className="text-sm text-gray-700">{formData.city}, {formData.state}</p>
                                            <p className="text-sm text-gray-700">Near: {formData.near_by}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <Camera className="text-blue-600 mt-1" size={20} />
                                        <div>
                                            <p className="text-sm text-gray-600">Category & Brand</p>
                                            <p className="font-semibold text-gray-800">
                                                {categories.find(c => c.type_id === formData.lead_type)?.type}
                                            </p>
                                            <p className="text-sm text-gray-700">{selectedBrandName}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <Clock className="text-blue-600 mt-1" size={20} />
                                        <div>
                                            <p className="text-sm text-gray-600">Appointment</p>
                                            <p className="font-semibold text-gray-800">{formData.meeting_date}</p>
                                            <p className="text-sm text-gray-700">{formData.time_slot} - {timeSlots.find(ts => ts.id === formData.time_slots)?.time_slots}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t pt-4 mt-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-sm text-gray-600">Selected Service</p>
                                            <p className="text-lg font-bold text-gray-800">{selectedService?.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-600">Amount</p>
                                            <p className="text-2xl font-bold text-blue-600">₹{selectedService?.price}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setCurrentStep('service_section')}
                                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition flex items-center justify-center gap-2"
                                >
                                    <ArrowLeft size={20} /> Back
                                </button>
                                <button
                                    onClick={pay_later}
                                    className="flex-1 btn-style-2  text-white py-3 rounded-lg font-semibold hover:shadow-lg transition transform hover:scale-[1.02]"
                                >
                                    Submit Request
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Success Section */}
                    {currentStep === 'success_message_section' && (
                        <div className="p-8 text-center">
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 className="text-green-600" size={48} />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-800 mb-4">Thank You!</h2>
                            <p className="text-gray-600 mb-8 max-w-md mx-auto">
                                We have successfully received your service request. Our customer care executive will contact you soon to confirm the appointment.
                            </p>
                            <div className="bg-blue-50 rounded-lg p-6 max-w-md mx-auto mb-6">
                                <p className="text-sm text-gray-600 mb-2">Your request details have been sent to:</p>
                                <p className="font-semibold text-gray-800">{formData.mobile}</p>
                                {formData.email && <p className="text-sm text-gray-700">{formData.email}</p>}
                            </div>
                            <button
                                onClick={() => {
                                    setCurrentStep('basic_details');
                                    setFormData({
                                        name: '',
                                        mobile: '',
                                        email: '',
                                        lead_type: '',
                                        pincode: '',
                                        state: '',
                                        city: '',
                                        city_id: '', // Reset city_id
                                        house_no: '',
                                        area: '',
                                        near_by: '',
                                        complain_type: '2',
                                        service_type: '2',
                                        new_type: 'product',
                                        domcom: '1',
                                        brand: '',
                                        meeting_date: new Date().toISOString().split('T')[0],
                                        time_slot: '',
                                        time_slots: '',
                                        service: '',
                                        otp: ''
                                    });
                                }}
                                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                            >
                                Submit Another Request
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}