"use client"
import React, { useState, useEffect, useCallback } from "react";
import Tabs from "../Services/AllServices";

import Assurance from "../../Assurance/Assurance";
import ServiceProcedure from '../../serviceProcedure';

import AllServicesList from "../Services/Services";
import ServicesList from "@/app/components/service/ServicesList";
import { useParams } from "next/navigation";


const City = () => {

    const { city  } = useParams(); 
    // const [cityName,setCityName]=useState(""); // Extract city ,brands from URL
  const [cityData,setCityData]=useState([]);
 
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [city]);

  useEffect(() => {
  
      fetch('https://mannubhai.in/web_api/get_city_page_data.php', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ city })
  
      })
      .then(res => res.json())
      .then(data => {
          console.log("Backend Response:", data);
  
          // console.log(JSON.stringify(data));
          // console.log("brands name"+data.brands[2].brand_url);
          
          if(!data.error){
              // setCategoryName()
              setCityData(data);
          }
      })
      .catch(err => console.error("Error sending city to backend:", err));
      
    }, [city]);

// console.log(cityData);

if(cityData.status==="1")
    return (
        <div>
            <div className="services-page common-spacing">
            <div className="left-side lg:w-1/4 flex-col mb-1.5">
               <div className="sticky top-20">
               <h3 className="cityHeadings">Most Loved Services by Our Customers!</h3>
               <Tabs />
               </div>
            </div>
            <div className="right-side lg:w-3/4">
                <div className="rightSidePortion justify-center">
                    <div className="lg:w-1/2">
                        <h2 className="ml-2.5 mt-1.5 text-3xl">Services All Over {cityData.city_name}</h2>
                        <div className="mb-3.5 flex items-center justify-center ">
                        <img src="/assets/cityBanner/Front Banner.webp" alt='service img' width={475} height={345} style={{
                            borderRadius:'17px',width:'100%'
                        }}/></div>
                        <AllServicesList/>
                    </div>
                    <div className="lg:w-5/12 cartContainer">
                        <div className="cart-body-section">
                           
                            <Assurance />
                            <ServiceProcedure/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      
   <div className="common-spacing bg-white">
   

   </div>
  <div className="common-spacing">
  <div className=" bg-white aboutStyle">
   <h3 className="catgoreyTitle">ABOUT MR. SERVICE EXPERT {cityData.city_name}</h3>
   <p className="catgoreyContent">{cityData?.city_detail?.city_content}</p>
   </div>
  </div>
  <div className="bg-white common-spacing">
                            <h3 className="catgoreyTitle">Popular City in India</h3>
                            <div className="brandsServices flex items-center flex-wrap gap-2.5 ">
                                {cityData.recent_cities?.map((city) => (
                                    <div  className='brandsServices '>
                                        <a href={`${city.city_url}`}>
                                        <li className='brand-btn-style'>
                                             {city.city_name}
                                            <span></span>
                                        </li>
                                        </a>
                                    </div>
                                 ))} 
                            </div>
                        </div>


        </div>
        
    );
else
    return (
        <div>
            <div className="services-page common-spacing">
            <div className="left-side lg:w-1/4 flex-col mb-1.5">
               <div className="sticky top-20">
               <h3 className="cityHeadings">Most Loved Services by Our Customers!</h3>
               <Tabs cat={city}/>
               </div>
            </div>
            <div className="right-side lg:w-3/4">
                <div className="rightSidePortion justify-center">
                    <div className="lg:w-1/2">
                        <h2 className="ml-2.5 mt-1.5 text-3xl">{cityData?.categorydetail?.category_name}</h2>
                        <div className="mb-3.5 flex items-center justify-center ">
                        <img src={`/assets/categorybanner/${cityData.catbanner}`} alt='service img' width={475} height={345} style={{
                            borderRadius:'17px',width:'100%'
                        }}/></div>
                       
                        <ServicesList category={city} status={cityData.status}/>
                    </div>
                    <div className="lg:w-5/12 cartContainer">
                        <div className="cart-body-section">
                           
                            <Assurance />
                            <ServiceProcedure/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      
   <div className="common-spacing bg-white">
   

   </div>
  <div className="common-spacing">
  <div className=" bg-white aboutStyle">
   <h3 className="catgoreyTitle">ABOUT MR. SERVICE EXPERT {cityData.city_name}</h3>
   <div dangerouslySetInnerHTML={{ __html: cityData?.categorydetail?.category_content }} className="serviceContentStyle" />
   {/* <p className="catgoreyContent" >{cityData?.categorydetail?.category_content   }</p> */}
   </div>
  </div>
  <div className="bg-white common-spacing">
                            <h3 className="catgoreyTitle">Popular City in India</h3>
                            <div className="brandsServices flex items-center flex-wrap gap-2.5 ">
                                {cityData.recent_cities?.map((city) => (
                                    <div  className='brandsServices '>
                                        <a href={`${city.city_url}`}>
                                        <li className='brand-btn-style'>
                                             {city.city_name}
                                            <span></span>
                                        </li>
                                        </a>
                                    </div>
                                 ))} 
                            </div>
                        </div>


        </div>
        
    );

};

export default City;