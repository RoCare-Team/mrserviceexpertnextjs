import React from 'react';
import AcImg from "../../assets/images/massage.png";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';

function Services() {
  return (
    <div className="serviceListContainer col-lg-6 ">
        <h4 className="servicesHeading">Air Conditioner Services</h4>
        <div className='servicePortionDetails'>
            <div className="serviceDetails">
                <h3 className="serviceVarities">AC Servicing & Repairs</h3>
                   <div>
                   <span className="serviceReview">
                    <FontAwesomeIcon icon={faStar} /> 4.4 (43 reviews)
                </span>
                <div className="prices">
                <span>
                  {'Ac installtion'} - ₹{500} 
                </span>
                <span className="actualPrice">₹{900}</span>
                </div>
                <hr className="dashedLine" />
                   </div>
                <li className="briefInfo2">
                    Professional AC cleaning, gas refilling, cooling efficiency check, and repair services to keep your AC running smoothly.
                </li>
            </div>
            <div className="serviceDetailsImg">
                <img src={AcImg} alt="AC Service" />
            </div>
        </div>
    </div>
  );
}

export default Services;
