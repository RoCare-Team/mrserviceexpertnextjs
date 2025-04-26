"use client"
import { faAddressBook, faEnvelope, faPerson, faPhone, faUser, faUserCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import EditDetails from '../components/modals/EditDetails';
import { toast, ToastContainer } from 'react-toastify';
import Link from 'next/link';

function Profile() {
    const [userPhone, setUserPhone] = useState('');
    const [userAddress, setUserAddress] = useState('');
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [updateOpen, setUpdateOpen] = useState(false);

    // Load user data from localStorage
    const loadUserData = () => {
        setUserPhone(localStorage.getItem('userPhone') || '');
        setUserEmail(localStorage.getItem('email') || '');
        setUserName(localStorage.getItem('name') || '');




        const address = localStorage.getItem('bookingAddress');
        if (address) {
            try {
                const addressObj = JSON.parse(address);
                setUserAddress(addressObj);
            } catch (error) {
                console.error("Error parsing address:", error);
            }
        }
    };

    // Load data on component mount
    useEffect(() => {
        loadUserData();
    }, []);

    // Handle opening the edit dialog
    const handleOpenUpdate = () => {
        setUpdateOpen(true);
    };

    // Handle closing the edit dialog
    const handleCloseUpdate = () => {
        setUpdateOpen(false);
        // Reload user data after dialog closes to show any updates
        loadUserData();
    };

    // Handle form submission from EditDetails
    const handleSubmitDetails = async (userData) => {
        // console.log("Received updated user data:", userData);
        // toast.success('Details Updated');
        // Here you would typically send this data to your backend
        // For now, we'll just reload the user data from localStorage
        loadUserData();
        return Promise.resolve(); // Return a resolved promise
    };

    return (
        <div className="flex justify-center items-center flex-col common-login-spacing mb-5">
             <ToastContainer/>

            <div className='flex items-start justify-start text-left gap-0.5 mb-2.5 col-4'>
                <Link href={'/'} className='mb-0 text-black'><span className='mb-0 '>Home</span></Link>
                <span className='mb-0 text-black'> {'>'}</span>
                <span className='mb-0 text-purple-600'>Profile</span>
            </div>

            <div className="bg-white flex flex-col w-full max-w-lg shadow-md rounded-md">
                <div className='flex items-center justify-between text-white bg-purple-600 p-4 booking-container '>
                    <h4>My Account</h4>


                    <button className='text-white' onClick={handleOpenUpdate}>Edit</button>
                </div>

                {/* <div className="dashedLine"></div> */}

                <div className="profileSection p-3">

                    <div className='flex gap-1.5 py-3 items-center text-gray-500 justify-between'>
                        <div className='flex gap-1.5 items-center'>
                            <span><FontAwesomeIcon icon={faUser} /></span>
                            <p className='mb-0'>Name: {userName || 'Not provided'}</p>
                        </div>
                        {/* <div>
                            <button className='' onClick={handleOpenUpdate}>Edit</button>
                        </div> */}
                    </div>

                    <div className='flex gap-1.5 py-3 items-center text-gray-500 justify-between'>
                        <div className='flex gap-1.5 items-center'>
                            <span><FontAwesomeIcon icon={faEnvelope} /></span>
                            <p className='mb-0'>Email: {userEmail || 'Not provided'}</p>
                        </div>
                        {/* <div>
                            <button className='' onClick={handleOpenUpdate}>Edit</button>
                        </div> */}
                    </div>

                    <div className='flex gap-1.5 py-3 items-center text-gray-500 justify-between'>
                        <div className='flex gap-1.5 items-center'>
                            <span><FontAwesomeIcon icon={faPhone} /></span>
                            <p className='mb-0'>Phone: {userPhone ? `+91 ${userPhone}` : 'Not provided'}</p>
                        </div>
                        {/* <div>
                            <button className='' onClick={handleOpenUpdate}>Edit</button>
                        </div> */}
                    </div>

                    {/* {userAddress && userAddress.formattedAddress && (
                        <div className='flex py-3 gap-1.5 items-center text-gray-500 justify-between'>
                            <div className='flex gap-1.5 items-center'>
                                <span><FontAwesomeIcon icon={faAddressBook} /></span>
                                <p className='mb-0'>Address: {userAddress.formattedAddress}</p>
                            </div>
                            <div>
                                <button className='' onClick={handleOpenUpdate}>Edit</button>
                            </div>
                        </div>
                    )} */}
                </div>
            </div>

            {/* Pass the correct props to EditDetails */}
            <EditDetails
                open={updateOpen}
                setOpen={handleCloseUpdate}
                phoneNumber={userPhone}
                onSubmitDetails={handleSubmitDetails}
            />
        </div>
    )
}

export default Profile;