import React, { useState, useEffect, useCallback } from "react";
// import Tabs from "../../tabs/Tabs";
import WashingTab from "../../tabs/washingTab";
// import ServicesList from "../../service/ServicesList";
import WashingServiceList from "../../service/washingServiceList";
import Cart from "../../cart/Cart";
import Roimg from "../../../assets/images/ro-homepage-banner.png";
import { useLocation,useParams } from "react-router-dom";
import FolderList from '../../folderList/FolderList';
import Assurance from "../../Assurance/Assurance";
import ServiceProcedure from '../../serviceProcedure';
import ServiceBanner from '../../../assets/images/serviceBrands/washingBanner.jpeg';
import BrandServices from "../../brandServices/BrandServices";

const WashingPage = () => {
    const location = useLocation();
    const { state ,brand } = useParams();  // Extract city ,brands from URL
    const formattedState = state ? state.replace("-", " ").toLowerCase() : "Delhi"; 
    const formattedBrands = brand ? brand.replace('-','').toLowerCase() : '';
    const [selectedServices, setSelectedServices] = useState([]);
    const [addedServices, setAddedServices] = useState([]); // Track added service IDs
    const [totalAmount, setTotalAmount] = useState(0);
    const [cartLoaded, setCartLoaded] = useState(false);

    // Create a memoized cart load callback
    const handleCartLoad = useCallback((loadedItems, loadedTotal) => {
        console.log("Cart load callback received items:", loadedItems);
        if (loadedItems && loadedItems.length > 0) {
            setSelectedServices(loadedItems);
            setTotalAmount(loadedTotal);
            
            // Update addedServices state with ids from loaded cart items
            const serviceIds = loadedItems.map(item => item.id);
            setAddedServices(serviceIds);
            setCartLoaded(true);
        }
    }, []);

    // Load cart data from localStorage when component mounts
    useEffect(() => {
        const loadCartFromLocalStorage = () => {
            try {
                const savedCartItems = localStorage.getItem('service_name');
                const savedCartTotal = localStorage.getItem('total_price');

                // const cartItems=localStorage.getItem(cartItems);
        // console.log('selected serice'+savedCartItems);
                
                if (savedCartItems && savedCartTotal) {
                    const parsedItems = JSON.parse(savedCartItems);
                    const parsedTotal = parseFloat(savedCartTotal);
                    
                    console.log("ServicePage loading cart from localStorage:", parsedItems);
                    
                    setSelectedServices(parsedItems);
                    setTotalAmount(parsedTotal);
                    
                    // Update addedServices array with ids from loaded cart items
                    const serviceIds = parsedItems.map(item => item.id);
                    setAddedServices(serviceIds);
                    setCartLoaded(true);
                }
            } catch (error) {
                console.error("Error loading cart from localStorage:", error);
            }
        };
        
        loadCartFromLocalStorage();
    }, []);

    // Get the category from URL parameters when component mounts
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const category = params.get('category');
        
        if (category) {
            // Give time for the component to render before scrolling
            setTimeout(() => {
                const element = document.getElementById(category);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 500);
        }
    }, [location.search]);

    const handleAddToCart = (service) => {
        // Update selectedServices state
        setSelectedServices((prev) => {
            // Check if service already exists
            const existingService = prev.find(s => s.id === service.id);

            if (existingService) {
                // If exists, increment quantity
                return prev.map(s =>
                    s.id === service.id
                        ? { ...s, quantity: (s.quantity || 1) + 1 }
                        : s
                );
            } else {
                // If new, add with quantity 1
                return [...prev, { ...service, quantity: 1 }];
            }
        });
        
        // Also update addedServices state if not already included
        if (!addedServices.includes(service.id)) {
            setAddedServices([...addedServices, service.id]);
        }
    };

    const handleRemoveFromCart = (serviceId) => {
        // Update selectedServices state
        setSelectedServices((prev) => {
            const updatedServices = prev.filter((s) => s.id !== serviceId);
            return updatedServices;
        });
        
        // Also update addedServices state
        setAddedServices((prev) => prev.filter(id => id !== serviceId));
    };

    const handleDecrementService = (serviceId) => {
        setSelectedServices((prev) => {
            const updatedServices = prev
                .map(s =>
                    s.id === serviceId
                        ? {
                            ...s,
                            quantity: Math.max(0, (s.quantity || 1) - 1)
                        }
                        : s
                )
                // Remove the service completely if quantity becomes 0
                .filter(s => s.quantity > 0);
            
            // If service is completely removed, also update addedServices
            if (!updatedServices.some(s => s.id === serviceId)) {
                setAddedServices(prev => prev.filter(id => id !== serviceId));
            }
            
            return updatedServices;
        });
    };

    const handleIncrementService = (serviceId) => {
        setSelectedServices((prev) => {
            const updatedServices = prev.map(s =>
                s.id === serviceId
                    ? { ...s, quantity: Math.min(5, (s.quantity || 1) + 1) }
                    : s
            );
            
            return updatedServices;
        });
    };

    // Calculate total and update localStorage whenever selectedServices changes
    useEffect(() => {
        if (selectedServices.length > 0) {
            const total = selectedServices.reduce(
                (acc, curr) => acc + (curr.price * (curr.quantity || 1)),
                0
            );
            
            setTotalAmount(total);
            
            // Update localStorage with the latest cart state
            // localStorage.setItem('cartItems', JSON.stringify(selectedServices));
            // localStorage.setItem('cartTotal', total.toString());
        } else {
            // setTotalAmount(0);
            // localStorage.removeItem('cartItems');
            // localStorage.removeItem('cartTotal');
        }
    }, [selectedServices]);

    // Debug logging
    useEffect(() => {
        console.log("Current selectedServices:", selectedServices);
        console.log("Current totalAmount:", totalAmount);
        
        
    }, [selectedServices, totalAmount]);

      // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [state]);


    return (
        <div className="services-page common-spacing">
            <div className="left-side lg:w-1/4 flex-col mb-1.5">
               <div className="sticky top-20">
               <h3 className="cityHeadings"> {formattedState}'s Top Picks: Most Loved Services by Our Customers!</h3>
               <WashingTab />
               </div>
            </div>
            <div className="right-side lg:w-3/4">
                <div className="rightSidePortion justify-center">
                    <div className="lg:w-1/2">
                        <h2 className="ml-2.5 mt-1.5">{formattedBrands} Services in {formattedState}</h2>
                        <div className="mb-3.5 flex items-center justify-center ">
                        <img src={ServiceBanner} alt='service img' width={475} height={345} style={{
                            borderRadius:'17px',width:'100%'
                        }}/></div>

                        < WashingServiceList 
                            onAddToCart={handleAddToCart} 
                            addedServices={addedServices}
                            state={formattedState}
                        />
                    </div>
                    <div className="lg:w-5/12 cartContainer">
                        <div className="cart-body-section">
                            <Cart
                                // selectedServices={selectedServices}
                                // total={totalAmount}
                                onRemove={handleRemoveFromCart}
                                onIncrement={handleIncrementService}
                                onDecrement={handleDecrementService}
                                // onCartLoad={handleCartLoad}
                            />
                            <Assurance />
                            <ServiceProcedure/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WashingPage;