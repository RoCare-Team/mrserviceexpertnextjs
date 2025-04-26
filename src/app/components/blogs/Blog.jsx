import React from 'react'
import roimg from '../../assets/images/blog_14_thumb.jpg';

function Blog() {
    return (
        <div className='flex items-start flex-col common-spacing'>
            <h3 className=''>Blogs</h3>
            <div className="blogs-section">
                {/* blog 1 */}
                <div className="blog-card-style">
                    <div className='w-full'>
                        <img src={roimg} alt='blog card image' className='h-auto w-full blog-img' />
                    </div>
                    <div className="blog-card-content">
                        <a href="/blogs/1/ro-water-main-stages-of-ro-plant-process-and-health-benefits" target="_blank" rel="noopener noreferrer">
                            <h5>RO Water: Main Stages of RO Plant Process and Health Benefits
                                This is a feasible method to puri</h5></a>
                        <div>
                            <span className='text-gray-500'>This is a feasible method to purify water in an effective manner. Hazardous contaminants and impurities from the water come out through a cellophane-similar membrane that’s semi-permeable.</span>
                        </div>
                        <div className='flex justify-between'>
                            <span>Author: <strong>RO Care</strong></span>
                            <span className='text-gray-400'>10-march-2025</span>
                        </div>
                    </div>
                </div>

                {/* blog 2 */}
                <div className="blog-card-style">
                    <div className='w-full'>
                        <img src={roimg}  alt='blog card image' className='h-auto w-full blog-img' />
                    </div>
                    <div className="blog-card-content">
                        <a href="#" target="_blank" rel="noopener noreferrer">
                            <h5>RO Plant Maintenance Checklist for Optimal Performance
                            </h5></a>
                        <div>
                            <span className='text-gray-500'>Reverse osmosis plants operating for municipal and industrial projects and producing in large volumes can run without any such operational issues. If there are operational problems, it can impact the system’s capacity to perform.</span>
                        </div>
                        <div className='flex justify-between'>
                            <span>Author: <strong>RO Care</strong></span>
                            <span className='text-gray-400'>10-march-2025</span>
                        </div>
                    </div>
                </div>


                 {/* blog 3 */}
                 <div className="blog-card-style">
                    <div className='w-full'>
                        <img src={roimg}  alt='blog card image' className='h-auto w-full blog-img' />
                    </div>
                    <div className="blog-card-content">
                        <a href="#" target="_blank" rel="noopener noreferrer">
                            <h5>RO Plant Maintenance Checklist for Optimal Performance
                            </h5></a>
                        <div>
                            <span className='text-gray-500'>Reverse osmosis plants operating for municipal and industrial projects and producing in large volumes can run without any such operational issues. If there are operational problems, it can impact the system’s capacity to perform.</span>
                        </div>
                        <div className='flex justify-between'>
                            <span>Author: <strong>RO Care</strong></span>
                            <span className='text-gray-400'>10-march-2025</span>
                        </div>
                    </div>
                </div>
            </div>


        </div>
    )
}

export default Blog