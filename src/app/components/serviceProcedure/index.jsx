import React from "react";


function index() {
   
  return (
   
    <div className="serviceStepper">
       
        <ol className="serviceStyle">
        <p className="text-violet-400  text-lg font-medium mb-3"><b>Service Process</b></p>

           <div className="flex flex-col relative gap-2.5">
           <div className="verticalLine"></div>
           <li className="serviceSteps"> Choose Your Service</li>
            <li className="serviceSteps">Expert Consultation & Quote</li>
            <li className="serviceSteps">Approval & Hassle-Free Scheduling</li>
            <li className="serviceSteps">Seamless Service Execution</li>
            <li className="serviceSteps">Secure Payment on Completion</li>
            <li className="serviceSteps">Share Your Feedback & Experience</li>
           </div>
        </ol>


    </div>
    
  )
}

export default index