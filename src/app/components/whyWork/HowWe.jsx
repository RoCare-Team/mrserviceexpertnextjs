import React from 'react';

export default function HowWe({ whyWork, imgWork, secondSectionData = [] }) {
    return (
        <div className='whyWork'>
            <h2 className='text-blue-500'>{whyWork}</h2>
            <img src={imgWork} alt='' />
            {/* Dynamic second portion */}
            <div className='secondPortion'>
                {secondSectionData.map((item, index) => (
                    <div className='secondSection' key={index}>
                        <img src={item.img} alt='' />
                        <div>
                            <h3>{item.subHead}</h3>
                            <p>{item.subPara}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}