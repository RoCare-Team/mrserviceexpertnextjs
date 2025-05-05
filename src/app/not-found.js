"use client"
import Link from "next/link";
import { useRouter } from "next/navigation";

const NotFoundPage = () => {

  const navigate=useRouter();
  setTimeout(()=>{
  navigate.push('/');
  },4000)

  return (
    <div className="common-spacing bg-white">

      {/* 404 page */}

      <div className="text-black flex w-full justify-center flex-col items-center ">
        <h1 className="text-2xl"><b>Page Not Found !</b></h1>
       <div>
       <img
          src="/assets/images/404.gif"
          alt="service logo"
          style={{ height: "auto", width: '600px' }}
        />
       </div>
        <Link href={'/'} className="text-black">
          <button className="text-black text-2xl hover:underline hover:text-purple-600">
            Go Back Home
          </button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;