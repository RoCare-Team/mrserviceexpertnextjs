import React, { useState, useEffect } from 'react';
import axios from 'axios';

function LocationSelector() {
  // State variables
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Load states when the component first loads
  useEffect(() => {
    async function loadStates() {
      try {
        setLoading(true);
        const response = await axios.get('https://www.waterpurifierservicecenter.in/wizard/app/getState.php');
        
        if (response.data && response.data.AvailableState) {
          // Get just the state names from the response
          const stateList = response.data.AvailableState.map(item => item.state);
          setStates(stateList);
        }
      } catch (error) {
        setMessage('Error loading states. Please try again.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    
    loadStates();
  }, []);

  // When state changes, load cities for that state
  useEffect(() => {
    async function loadCities() {
      if (!selectedState) return;
      
      try {
        setLoading(true);
        setCities([]);
        
        const response = await axios.get(`https://www.waterpurifierservicecenter.in/wizard/app/getCity.php?state=${selectedState}`);
        
        if (response.data && response.data.AvailableCities) {
          // Get just the city names from the response
          const cityList = response.data.AvailableCities.map(item => item.city_name);
          setCities(cityList);
        }
      } catch (error) {
        setMessage('Error loading cities. Please try again.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    
    loadCities();
  }, [selectedState]);

  // When pincode changes and is 6 digits, look up the location
  async function handlePincodeChange(e) {
    const newPincode = e.target.value;
    setPincode(newPincode);
    
    // Clear message
    setMessage('');
    
    // Only proceed if pincode is 6 digits
    if (newPincode.length === 6) {
      try {
        setLoading(true);
        
        const response = await axios.get(`https://inet.waterpurifierservicecenter.in/include/ajax/get_city_with_pincode.php?pincode=${newPincode}`);
        
        if (response.data && response.data.state) {
          // Set the state from pincode response
          setSelectedState(response.data.state);
          
          // Set the city from pincode response
          if (response.data.city) {
            setSelectedCity(response.data.city);
          }
        } else {
          setMessage('No location found for this pincode.');
        }
      } catch (error) {
        setMessage('Error looking up pincode. Please try again.');
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <h2>Location Selector</h2>
      
      {/* Pincode field */}
      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="pincode" style={{ display: 'block', marginBottom: '5px' }}>Pincode</label>
        <input
          type="text"
          id="pincode"
          value={pincode}
          onChange={handlePincodeChange}
          placeholder="Enter 6-digit pincode"
          style={{ 
            width: '100%', 
            padding: '8px', 
            border: '1px solid #ccc', 
            borderRadius: '4px' 
          }}
          maxLength={6}
        />
        <small style={{ color: '#666' }}>Enter pincode to auto-fill state and city</small>
      </div>
      
      {/* State dropdown */}
      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="state" style={{ display: 'block', marginBottom: '5px' }}>State</label>
        <select
          id="state"
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          style={{ 
            width: '100%', 
            padding: '8px', 
            border: '1px solid #ccc', 
            borderRadius: '4px' 
          }}
        >
          <option value="">Select State</option>
          {states.map((state, index) => (
            <option key={index} value={state}>{state}</option>
          ))}
        </select>
      </div>
      
      {/* City dropdown */}
      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="city" style={{ display: 'block', marginBottom: '5px' }}>City</label>
        <select
          id="city"
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          style={{ 
            width: '100%', 
            padding: '8px', 
            border: '1px solid #ccc', 
            borderRadius: '4px' 
          }}
          disabled={!selectedState}
        >
          <option value="">Select City</option>
          {cities.map((city, index) => (
            <option key={index} value={city}>{city}</option>
          ))}
        </select>
      </div>
      
      {/* Status message */}
      {loading && <p style={{ color: 'blue' }}>Loading...</p>}
      {message && <p style={{ color: 'red' }}>{message}</p>}
      
      {/* Current selection display */}
      {(selectedState || selectedCity || pincode) && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '4px' 
        }}>
          <h3>Current Selection:</h3>
          <p>State: {selectedState || "None"}</p>
          <p>City: {selectedCity || "None"}</p>
          {pincode && <p>Pincode: {pincode}</p>}
        </div>
      )}
    </div>
  );
}

export default LocationSelector;