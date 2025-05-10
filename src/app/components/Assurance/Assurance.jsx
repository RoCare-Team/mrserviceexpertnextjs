"use client"
import React from 'react';
// import AssurdImg from '../../assets/images/quality-assurance.png';
// import TimeIcon from '../../assets/images/thirtyMin.png';

function Assurance() {
    return (
        <div className="assuredContainer">
            <h5 className='flex '>
                Doorstep Service in <img src="/assets/images/thirtyMin.webp" alt="30 min" title='30 min services' height="auto" width={40} className="timeIcon" /> minutes
            </h5>
            <div className="assureBody">
                <div className="assureList">
                    <li className="assureListItems">Genuine Parts</li>
                    <li className="assureListItems">Best Prices</li>
                    <li className="assureListItems">Reliable Service</li>
                    <li className="assureListItems">Expert Professionals</li>
                </div>
                <div>

                    <img src="/assets/images/quality-assurance.webp" alt="Assured Quality" height="auto" title='Assured quality services' width={72} className="assuredImg" />
                </div>
            </div>
        </div>
    );
}

export default Assurance;
