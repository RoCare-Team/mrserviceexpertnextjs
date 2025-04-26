import React from 'react'
import roimg from '../../../assets/images/blog_14_thumb.jpg';

function BlogContent() {
    return (
        <div className='bg-white common-spacing flex flex-col gap-4'>
            <div className='blog-img-section'>
                <img src={roimg} alt='blog card image' className='h-auto w-full ' />
            </div>
            <div className=''>
                <h3>RO Water: Main Stages of RO Plant Process and Health Benefits</h3>
                <span>By RO Care India / 2023-12-13</span>
                <p>Besides human beings, several other living species cannot survive without water. Often, people, especially those from villages and suburbs, suffer from various health problems because of the consumption of impure, non-hygienic water. The need of the hour is to ensure that everyone has easy and seamless access to clean, potable water. The human body requires a certain amount of water and food on a daily basis to remain healthy and active. One is bound to fall ill if they stay thirsty and hungry for only a few days. People must understand that it’s high time to start giving priority to drinking Reverse Osmosis (RO) water. Keep reading to enrich your knowledge of the RO water treatment plant process, RO use and health advantages of drinking RO water.</p>

            </div>
            <div>
                <h3>Reverse Osmosis: What Does It Mean?</h3>
                <p>Shedding light on reverse osmosis at first is more important. This is a feasible method to purify water in an effective manner. Hazardous contaminants and impurities from the water come out through a cellophane-similar membrane that’s semi-permeable. This water purification process completely adheres to the osmosis principle in a reverse manner. The process of osmosis is all about the movement of water molecules from a lower solute concentration area to a higher solute concentration area via a semi-permeable membrane. The opposite occurs in reverse osmosis, which is why the water molecules move in the opposite direction. Things will be crystal clear once you check the RO plant process flow diagram properly. The reverse osmosis process takes place in an RO plant by applying pressure to the concentrated part. The forced water undergoes the purification process and comes to the dilute part through the membrane, leaving the unwanted elements behind.</p>

            </div>
            <div>
                <h3>Different Stages of Reverse Osmosis Procedure</h3>
                <p>Everyone needs to have a clear understanding of several stages of the RO process. RO plants treat and purify water by removing unwanted substances, which include chlorides, salts and several other elements.

                    <br /> <strong> Sediment Filtration</strong><br />
                    The water passes through a filter prior to the application of pressure to get rid of debris, sediments and large indigestible particles. The sole objective of this step is to prevent inappropriate substances from damaging or clogging the RO semi-permeable membrane.

                    <br /> <strong> Carbon Pre-Filtration</strong><br />
                    The second stage is restraining varying contaminants from affecting the RO membrane performance. The carbon pre-filtration is a crucial step of the RO water treatment process. The lifespan of the reverse osmosis membrane reduces because of chlorine and different by-products of it. Therefore, the water passes through at the second stage, and chlorine and chloramines are left behind.</p>
            </div>
        </div>
    )
}

export default BlogContent