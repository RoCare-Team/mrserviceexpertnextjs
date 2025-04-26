import { faAnglesLeft, faAnglesRight, faArrowRight } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useState } from 'react'

const Brands = [
    { id: 1, brandName: 'Doctor Fresh', link: '' },
    { id: 2, brandName: 'Kent RO', link: '' },
    { id: 3, brandName: 'Aqua Fresh', link: '' },
    { id: 4, brandName: 'Aqua Plus', link: '' },
    { id: 5, brandName: 'Pureit', link: '' },
    { id: 6, brandName: 'Blue Star', link: '' },
    { id: 7, brandName: 'Livpure', link: '' },
    { id: 8, brandName: 'AO Smith', link: '' },
    { id: 9, brandName: 'Havells', link: '' },
    { id: 10, brandName: 'Eureka Forbes', link: '' },
    { id: 11, brandName: 'Prestige', link: '' },
    { id: 12, brandName: 'Hindustan Unilever', link: '' },
    { id: 13, brandName: 'Tata', link: '' },
    { id: 14, brandName: 'Bajaj', link: '' },
    { id: 15, brandName: 'Singer', link: '' },
    { id: 16, brandName: 'Philips', link: '' },
    { id: 17, brandName: 'Godrej', link: '' },
    { id: 18, brandName: 'Samsung', link: '' },
    { id: 19, brandName: 'LG', link: '' },
    { id: 20, brandName: 'Whirlpool', link: '' },
    { id: 21, brandName: 'Sharp', link: '' },
    { id: 22, brandName: 'Panasonic', link: '' },
    { id: 23, brandName: 'Hitachi', link: '' },
    { id: 24, brandName: 'IFB', link: '' },
    { id: 25, brandName: 'Crompton', link: '' },
    { id: 26, brandName: 'Usha', link: '' },
    { id: 27, brandName: 'Orient', link: '' },
    { id: 28, brandName: 'Maharaja Whiteline', link: '' },
    { id: 29, brandName: 'Voltas', link: '' },
    { id: 30, brandName: 'Midea', link: '' },
    { id: 31, brandName: 'Carrier', link: '' },
    { id: 32, brandName: 'Blue Mount', link: '' },
    { id: 33, brandName: 'Nasaka', link: '' },
    { id: 34, brandName: 'Aquaguard', link: '' },
    { id: 35, brandName: 'Zero B', link: '' },
    { id: 36, brandName: 'Propello', link: '' },
    { id: 37, brandName: 'Moonbow', link: '' },
    { id: 38, brandName: 'Faber', link: '' },
    { id: 39, brandName: 'Pigeon', link: '' },
    { id: 40, brandName: 'Croma', link: '' },
    { id: 41, brandName: 'MarQ', link: '' },
    { id: 42, brandName: 'Thomson', link: '' },
    { id: 43, brandName: 'Maharaja', link: '' },
    { id: 44, brandName: 'Kutchina', link: '' },
    { id: 45, brandName: 'Luminous', link: '' },
    { id: 46, brandName: 'Hindware', link: '' },
    { id: 47, brandName: 'Morphy Richards', link: '' },
    { id: 48, brandName: 'Wonderchef', link: '' },
    { id: 49, brandName: 'Bosch', link: '' },
    { id: 50, brandName: 'Dyson', link: '' }
];

function BrandServices() {
    const [visibleBrands,setVisibleBrands]=useState(false);

    const handleLoadMore=()=>{
       
       setVisibleBrands(true)
        
    }
    const displayBrands= visibleBrands ? Brands : Brands.slice(0,11);
    return (
        <div className="bg-white common-spacing">
            <h3>Brands Service in India</h3>
            <div className="brandsServices flex items-center flex-wrap gap-2.5 ">
                {displayBrands.map((brand) => (
                    <div key={brand.id} className='brandsServices '>
                        <a href="/">
                        <li className='brand-btn-style'>
                            {brand.brandName} RO services 
                            <span><FontAwesomeIcon icon={faAnglesRight}/></span>
                        </li>
                        </a>
                    </div>
                ))}

                {!visibleBrands && (
                    <div>
                        <button onClick={handleLoadMore} className='readMore'>Read More</button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default BrandServices