import React from 'react'

function Advantages({whyWork,subPara}) {
    return (
        <div className='whyWork'>
            <h2>
                {whyWork}
            </h2>
            
            <p style={{
                padding:'0px 20px'
            }}>{subPara}</p>
           </div>
    )
}

export default Advantages