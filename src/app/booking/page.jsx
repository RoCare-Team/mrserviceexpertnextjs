"use client"
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PaymentModal from '../components/modals/paymentModal';

function Booking() {
    const [activeTab, setActiveTab] = useState('active');
    const [open, setOpen] = useState(false);
    const [leadDetails, setLeadDetails] = useState([]);
    const [currentServices, setCurrentServices] = useState([]);
    const [allLeadData, setAllLeadData] = useState([]);
    const [leadStatus, setLeadStatus] = useState([]);

    const router = useRouter();

    useEffect(() => {
        const userVerified = JSON.parse(localStorage.getItem("userPhone"));
        if (!userVerified) {
            router.push('/');
        } else {
            const allServices = JSON.parse(localStorage.getItem("all_cmpl") || "[]");
            setCurrentServices(allServices);
            setAllLeadData(allServices); 
        }
    }, []);

    const getcmpldetls = async (lead_id) => {
        const payload = { lead_id };

        const res = await fetch("https://waterpurifierservicecenter.in/customer/ro_customer/lead_details.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const data = await res.json();
        setLeadDetails(data.service_details[0]);
        setOpen(true);
    };

    const handleClose = () => setOpen(false);

    // console.log(+"fdfsg");
    // const dippperrrr=JSON.stringify(allLeadData);
    // console.log(JSON.parse(dippperrrr));
    
    

    useEffect(() => {
        if (allLeadData.length > 0) {
            let filtered = [];
            if (activeTab === 'active') {
                filtered = allLeadData.filter(lead => 
                    lead.status === 'Active' || lead.status === 'Follow-up');
            } else if (activeTab === 'delivered') {
                filtered = allLeadData.filter(lead => 
                    lead.status === 'Complete' );
            } else if (activeTab === 'cancelled') {
                filtered = allLeadData.filter(lead => 
                    lead.status === 'Cancelled' || lead.status === 'Inactive');
            }

            setLeadStatus(filtered);
        }
    }, [activeTab, allLeadData]);

    const handleTabClick = (tab) => {
        setActiveTab(tab);
    };

    return (
        <div className="flex justify-center common-login-spacing flex-col items-center mb-5">

            <div className='flex items-start justify-start text-left mb-3 w-1/3'>
                <Link href={'/'} className='mb-0 text-black'><span className='mb-0 text-black'>Home</span></Link>
                <span className="mx-2">/</span>
                <span className="text-purple-600 font-medium">Booking</span>
            </div>

            <div className='bg-white flex flex-col w-full max-w-lg shadow-md rounded-md booking-container'>
                <div className='mb-4 bg-purple-600 p-4 booking-container'>
                    <h3 className="text-lg font-semibold mb-2 text-white">Active & Upcoming...</h3>
                    {/* <span className='text-white'>{leadStatus.length > 0 ? 'active booking': 'no booking available'}</span> */}
                </div>

                <div className="dashedLine"></div>

                <div className="previousBookings p-3">
                    <h3 className="text-lg font-semibold mb-3">History</h3>
                    <div className="bookingTabs flex gap-2 mb-4 flex-wrap">
                        <button
                            className={`${activeTab === 'active' ? 'bg-violet-400 tabStyle text-white' : 'tabStyle text-gray-400'}`}
                            onClick={() => handleTabClick('active')}
                        >
                            Active
                        </button>

                        <button
                            className={`${activeTab === 'delivered' ? 'bg-violet-400 tabStyle text-white' : 'tabStyle text-gray-400'}`}
                            onClick={() => handleTabClick('delivered')}
                        >
                            Completed
                        </button>

                        <button
                            className={`${activeTab === 'cancelled' ? 'bg-violet-400 tabStyle text-white' : 'tabStyle text-gray-400'}`}
                            onClick={() => handleTabClick('cancelled')}
                        >
                            Cancelled
                        </button>
                    </div>

                    <div className="tabsContent flex flex-col gap-3 max-h-96 overflow-y-auto">
                        {leadStatus.length > 0 ? (
                            leadStatus.map((service) => (
                                <div key={service.lead_id} onClick={() => getcmpldetls(service.lead_id)} className="tabDetails services-section flex items-center gap-2 border border-gray-200 rounded-md cursor-pointer">
                                    <div className="w-14 h-14 tabImgService">
                                        <img src={service.image || "/assets/images/no-photos.webp"} alt={service.lead_type} className='w-full h-full object-cover rounded' />
                                    </div>
                                    <div className="serviceCard flex-1 flex flex-row justify-between">
                                        <div className="flex service_info sm:flex-row sm:justify-between">
                                            <h4 className='font-medium'>{service.lead_type} ({service.complain_id})</h4>
                                            <span className={`bookingStatus ${
                                                service.status === 'Complete' ? 'text-green-500' :
                                                service.status === 'Ongoing' ? 'text-yellow-500' :
                                                service.status === 'Pending-denied' ? 'text-red-500' :
                                                service.status === 'Follow-up' ? 'text-gray-500' :
                                                service.status === 'Inactive' ? 'text-red-500' :
                                                service.status === 'Active' ? 'text-blue-400' : ''
                                            }`}>
                                                status: {service.status}
                                            </span>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <span className="timingDate text-gray-500"><b>Rs.{service.amount}</b></span>
                                            <span className="timingDate text-gray-500">{service.lead_add_date}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no_booking">
                                <div className="text-center py-4 text-gray-500">No services in this category</div>
                                <div>
                                    <Link href={'/service'}>
                                        <p className='text-xl text-violet-700 mb-3.5 text-center'>Explore Our Services</p>
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <PaymentModal
                    open={open}
                    handleClose={handleClose}
                    leadDetails={leadDetails}
                />
            </div>
        </div>
    );
}

export default Booking;
