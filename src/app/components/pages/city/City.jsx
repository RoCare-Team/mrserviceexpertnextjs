
import Tabs from "@/app/components/pages/Services/AllServices";
import Assurance from "@/app/components/Assurance/Assurance";
import ServiceProcedure from '@/app/components/serviceProcedure/index';
import AllServicesList from "@/app/components/pages/Services/Services";
import ServicesList from "@/app/components/service/ServicesList";


const City = ({city,cityData}) => {

    


    console.log("test"+cityData);

    if (cityData.status === "1")
        return (
            <div>
                <div className="services-page common-spacing">
                    <div className="mobileBanner">
                        <img src="/assets/cityBanner/Front Banner.webp" alt='All Services in india' title="All Services in india" width={475} height={345} style={{
                            borderRadius: '17px', width: '100%'
                        }} /></div>
                    <div className="left-side lg:w-1/4 flex-col mb-1.5">
                        <div className="sticky top-20">
                            <h1 className="cityHeadings">Most Loved Services by Our Customers!</h1>
                            <Tabs />
                        </div>
                    </div>
                    <div className="right-side lg:w-3/4">
                        <div className="rightSidePortion justify-center">
                            <div className="lg:w-1/2">
                                <h2 className="ml-2.5 mt-1.5 text-3xl">Services All Over {cityData?.city_name}</h2>
                                <div className="mb-3.5 flex items-center justify-center desktopBanner ">
                                    {/* {!cityImageLoad && (
                                        <img src="/assets/cityBanner/Front Banner.webp" alt='All Services in india' title={`Our All Services`} width={475} height="auto"  style={{
                                            borderRadius: '17px', width: '100%'
                                        }} />
                                    )} */}

                                    <img src="/assets/cityBanner/Front Banner.webp" alt='All Services in india' title={`Our Services in ${cityData?.city_name}`} width={475} height="auto" style={{
                                        borderRadius: '17px', width: '100%',
                                    }} />

                                </div>
                                <AllServicesList />
                            </div>
                            <div className="lg:w-5/12 cartContainer">
                                <div className="cart-body-section">

                                    <Assurance />
                                    <ServiceProcedure />
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
                            <div className='brandsServices '>
                                <a href={`${city.city_url}`} title={`${city.city_url}`}>
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
                            <Tabs cat={city} />
                        </div>
                    </div>
                    <div className="right-side lg:w-3/4">
                        <div className="rightSidePortion justify-center">
                            <div className="lg:w-1/2">
                                <h2 className="ml-2.5 mt-1.5 text-3xl"><b>{cityData?.categorydetail?.category_name}</b></h2>
                               
                                    <div className="mb-3.5 flex items-center justify-center ">
                                    <img src={`/assets/categorybanner/${cityData.catbanner}`} alt={`${cityData?.categorydetail?.category_name}`} title={`${cityData?.categorydetail?.category_name}`} width={475} height={345} style={{
                                        borderRadius: '17px', width: '100%'
                                    }} /></div>
                               

                                <ServicesList category={city} status={cityData.status} />
                            </div>
                            <div className="lg:w-5/12 cartContainer">
                                <div className="cart-body-section">

                                    <Assurance />
                                    <ServiceProcedure />
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
                {/* <div className="bg-white common-spacing">
                    <h3 className="catgoreyTitle">Popular Brands of {cityData?.categorydetail?.category_name}</h3>
                    <div className="brandsServices flex items-center flex-wrap gap-2.5 ">
                        {cityData.brands?.map((city) => (
                            // brands
                            <div className='brandsServices '>
                                <a href={`${city.brand_url}`}>
                                    <li className='brand-btn-style'>
                                        {city.brand_name}
                                        <span></span>
                                    </li>
                                </a>
                            </div>
                        ))}
                    </div>
                </div> */}


            </div>

        );

};

export default City;