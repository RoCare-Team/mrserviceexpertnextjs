import React from 'react'


function BlogContent() {
    return (
        <div className='bg-white p-4 rounded-2xl flex flex-col justify-start items-start gap-4'>
            <div className='blog-img-section w-full'>
                <img src={'/assets/images/blog_14_thumb.jpg'} alt='blog card image' className=' h-64 w-full ' />
            </div>
            <div className=' flex md:flex-row w-full items-center justify-between'>
                <span className='text-gray-400'><b>Posted On: 2023-12-13</b></span>
                <span className='text-gray-400'><b>Author:</b> By RO Care India </span>
               

            </div>
            <div className='flex flex-col items-start gap-2'>
                <h3 className='text-xl mb-2'><b>Reverse Osmosis: What Does It Mean?</b></h3>
                <p className=' text-gray-400 mb-2'>Shedding light on reverse osmosis at first is more important. This is a feasible method to purify water in an effective manner. Hazardous contaminants and impurities from the water come out through a cellophane-similar membrane that’s semi-permeable. This water purification process completely adheres to the osmosis principle in a reverse manner. The process of osmosis is all about the movement of water molecules from a lower solute concentration area to a higher solute concentration area via a semi-permeable membrane. The opposite occurs in reverse osmosis, which is why the water molecules move in the opposite direction. Things will be crystal clear once you check the RO plant process flow diagram properly. The reverse osmosis process takes place in an RO plant by applying pressure to the concentrated part. The forced water undergoes the purification process and comes to the dilute part through the membrane, leaving the unwanted elements behind.</p>

            </div>
          
        </div>
    )
}

export default BlogContent