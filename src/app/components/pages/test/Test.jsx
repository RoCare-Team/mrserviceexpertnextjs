import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

function Test() {
  const { city, cat } = useParams();
  const [cityName, setCityName] = useState("");
  const [categoryName, setCategoryName] = useState("");

  useEffect(() => {

    fetch('http://rocareindia.online/web_api/get_page_data.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ city,cat })

    })
    .then(res => res.json())
    .then(data => console.log("Backend Response:", data))
    .catch(err => console.error("Error sending city to backend:", err));
    setCityName(city);
    setCategoryName(cat);
  }, [city, cat]);  

  return (
    <div className="common-spacing bg-orange-300">
      test here<br />
      Category: {categoryName}<br />
      City: {cityName}
    </div>
  );
}

export default Test;
