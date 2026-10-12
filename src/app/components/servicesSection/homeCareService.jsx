'use client';

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HOME_CARE_SERVICES } from "@/lib/homeCare";

// Icons shown on mobile before "View All Services" is tapped (2 rows of 3).
const MOBILE_VISIBLE = 6;

/**
 * Icon grid for a service group. Defaults to Home Care; the home and city
 * pages also render it with the Handyman list. Links are relative to the
 * current page, so on /delhi they go to /delhi/{service}.
 */
function HomeCareService({ title = "Home Care Services", services = HOME_CARE_SERVICES }) {
    const [showAllServices, setShowAllServices] = useState(false);
    const urlPath = usePathname();

    const toggleAllServices = (e) => {
        e.preventDefault();
        setShowAllServices(!showAllServices);
    };

    return (
        <div className="">
            <h3 className="serviceHeadings ">{title}</h3>
            <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-5 servicesHero">
                {services.map((Service, index) => {
                    const basePath = urlPath === "/" ? "" : urlPath;
                    const href = `${basePath}/${Service.url}`;
                    return (
                        <div
                            key={Service.url}
                            className={`flex items-center flex-col serviceSectionn relative ${!showAllServices && index >= MOBILE_VISIBLE ? 'hidden sm:flex' : ''
                                }`}
                        >
                            <Link href={href} className="text-black">
                                <div className="imgSection">
                                    {Service.image ? (
                                        <img
                                            src={Service.image}
                                            alt={`${Service.name} services`}
                                            title={`${Service.name} services`}
                                            className="serviceImg w-28 h-28"
                                            height={112}
                                            width={112}
                                            // Fixed square tile: globals.css sets .serviceImg
                                            // height:auto, so 300x200 icons rendered shorter
                                            // than the 500x500 ones. Contain keeps them uncropped.
                                            style={{ width: 112, height: 112, objectFit: "contain" }}
                                        />
                                    ) : (
                                        // No icon yet — keep the tile the same size.
                                        <span
                                            className="serviceImg w-28 h-28 flex items-center justify-center text-5xl"
                                            title={`${Service.name} services`}
                                            aria-hidden="true"
                                        >
                                            🔨
                                        </span>
                                    )}
                                </div>
                                <p className="text-2xs text-wrap mb-1 text-center serviceSectionName text-black">
                                    <b>{Service.name}</b>
                                </p>
                            </Link>
                        </div>
                    );
                })}

            </div>
            {services.length > MOBILE_VISIBLE && (
                <div className="text-center mt-4 mb-4 block sm:hidden">
                    <button
                        className="text-white  view-btn-style font-medium px-4 py-2 border border-purple-300  bg-purple-700 "
                        onClick={toggleAllServices}
                    >
                        {showAllServices ? "Show Less Services" : "View All Services"}
                    </button>
                </div>
            )}
        </div>
    );
}

export default HomeCareService;
