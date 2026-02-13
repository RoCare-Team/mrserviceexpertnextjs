"use client"

import { faFile } from '@fortawesome/free-regular-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React, { useEffect, useState } from 'react'
import BlogContent from '../components/pages/blogContent/BlogContent'

function Blog() {
    const [categories, setCategories] = useState([]);
    const [blogContent, setBlogContent] = useState([]);

    
    useEffect(() => {
        const blogContent = async () => {
            const response = await fetch("https://mannubhai.in/web_api/blog_category.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
                cache: "no-store",
            });

            const data = await response.json();

            // console.log(data);
            setCategories(data.data || []);
        }

        const fetchDefaultBlog = async () => {
            const response = await fetch("https://mannubhai.in/web_api/get_blog_with_catid.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(),
                cache: "no-store",
            });
            const data = await response.json();
            console.log(data);

            setBlogContent(data.data || []);
        };



        fetchDefaultBlog();
        blogContent();
    }, [])

    const handleblogcontent = async (id) => {
        // const cat_id=id;
        const response = await fetch("https://mannubhai.in/web_api/get_blog_with_catid.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cat_id: id }),
            cache: "no-store",
        });

        const data = await response.json();
        console.log(data);
        setBlogContent(data.data || [])

    };
    return (
        <div className='flex items-start md:flex-row flex-col-reverse common-spacing'>

            <div className='w-full md:w-2/3'>

                {blogContent.length > 0 && (
                    <h1 className='ml-3 text-xl'><b>Blogs of {blogContent[0].category}</b></h1>
                )}




                {/* <a href="#" target="_blank" rel="noopener noreferrer"> </a> */}
                <div className="blogs-section">

                    {/* blog 1 */}
                    {blogContent.length > 0 ? (
                        blogContent.map((blog) => (
                            <div key={blog.id} className="blog-card-style" title={blog.title}>
                                <div className='w-full'>
                                    <img src='/assets/images/blog_14_thumb.webp' alt='RO water Blogs' title={blog.title} className='h-auto w-full  blog-img' />
                                </div>
                                <div className="blog-card-content">

                                    <h2 className='text-3xs'>{blog.title}
                                    </h2>
                                    <div>
                                        <span className='text-gray-500 text-xs' >Reverse osmosis plants operating for mun</span>
                                    </div>
                                    <div className='flex justify-between'>
                                        {/* <span><img src={blog.file_url} alt='blog tilte' title='author of the blog' /></span> */}
                                        <span className='text-xs'>Author: <strong>{blog.author}</strong></span>
                                        <span className='text-gray-400 text-xs'>{blog.publishdate}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (<div>
                        {/* <button><BlogContent/></button> */}

                        <p className='text-xl text-red-500'>No Blogs for this Categories</p>
                    </div>)}
                </div>
            </div>

            <div className='bg-white h-auto w-full md:w-1/3 shadow-md p-4 rounded-xl hover:shadow-purple-300'>
                {/*Categories portion*/}
                <h2 className='bg-purple-300 px-2 py-1 rounded-xl text-xl text-white mb-2'><b>Categories</b></h2>

                {categories?.map((Service) => (
                    <div key={Service.id} onClick={() => handleblogcontent(Service.id)} className='flex items-center mb-1 gap-2 hover:-translate-y-0.5 hover:bg-blue-200 rounded-2xl  border-b-2 p-2 border-gray-300'>
                        <span className='bg-blue-300  px-2  rounded-2xl text-white text-xl'><FontAwesomeIcon icon={faFile} /></span>
                        <h2>{Service.name}</h2>
                        <span className='text-gray-400 '>(23)</span>

                    </div>
                ))}





            </div>
            

        </div>
    )
}

export default Blog
