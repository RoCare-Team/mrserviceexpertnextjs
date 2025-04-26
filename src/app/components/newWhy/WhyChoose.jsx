import React from 'react'

export default function WhyChoose() {
  return (
     <div className=" why-choose-us">
      <div className="row why-choose-innerPart">
        <div className="col-lg-6">
          <div className="finix-text">
            <h6>Transparent process</h6>
            <h2>Why Choose Us for Water Purifier Service</h2>
            <img src="https://raw.githubusercontent.com/farazc60/Project-Images/main/why_choose_us.png" alt="" />
            <div className="ct-btn">
              <a href="#" className=""><i className="fas fa-play-circle"></i></a>
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="row">
            <div className="col-lg-6">
              <div className="feature-box mt-4">
                <div className="feature-box-content text-center">
                  <div className="fbc-btn">
                    <i className="fas fa-percent"></i>
                  </div>
                  <h3>Doorstep Service</h3>
                  <p>Technician visits your location for service</p>
                </div>
              </div>
            </div>
            <div className="col-lg-6">
              <div className="feature-box">
                <div className="feature-box-content text-center">
                  <div className="fbc-btn">
                    <i className="fas fa-percent"></i>
                  </div>
                  <h3>Verified Technicians</h3>
                  <p>Professionals with proper background checks</p>
                </div>
              </div>
            </div>
            <div className="col-lg-6 ">
              <div className="feature-box">
                <div className="feature-box-content text-center">
                  <div className="fbc-btn">
                    <i className="fas fa-percent"></i>
                  </div>
                  <h3>Genuine Parts</h3>
                  <p>Only original spare parts are used</p>
                </div>
              </div>
            </div>
            <div className="col-lg-6 mt-3" >
              <div className="feature-box active-feature">
                <div className="feature-box-content text-center">
                  <div className="fbc-btn">
                    <i className="fas fa-percent"></i>
                  </div>
                  <h3>Quick Support</h3>
                  <p>Fast and reliable customer support</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
