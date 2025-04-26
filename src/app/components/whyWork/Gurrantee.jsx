import React from 'react'

export default function Gurrantee({ imgWork3, whyWork, boxData }) {
    return (
        <div className='whyWork'>
            <h2>{whyWork}</h2>
            <div className="thirdSection">
                <img src={imgWork3} alt='' />
                <div className='thirdPop'>
                    {boxData.map((item, index) => (
                        <div className="boxImg" key={index}>
                            <a href={item.link || '/'}>
                                <img src={item.img} alt='' />
                                <h5>{item.text}</h5>
                            </a>
                        </div>
                    ))}
                </div>
            </div>
            
        </div>
    )
}
