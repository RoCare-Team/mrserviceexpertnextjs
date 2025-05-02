import React, { useState } from 'react';
import { TextField, InputAdornment, Box, Typography, List, ListItem } from '@mui/material';
import { styled } from '@mui/system';
import { useRouter } from 'next/navigation';

const SearchBarWrapper = styled('div')({
  position: 'relative',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '10px',
  borderRadius: '50px',
  border: '1px solid #7A7A7A',
  backgroundColor: '#fff',
  width: 'fit-content',
  '&:hover': {
    borderColor: '#220A33',
  },
  '& .Mui-focused': {
    borderColor: '#220A33',
  },
});

const CustomTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    borderRadius: '30px',
    '& fieldset': {
      borderColor: 'transparent',
    },
    '&:hover fieldset': {
      borderColor: 'transparent',
    },
    '&.Mui-focused fieldset': {
      borderColor: 'transparent',
    },
    '& .MuiOutlinedInput-input': {
      padding: 0,
    },
  },
});

const SuggestionsContainer = styled(Box)({
  position: 'absolute',
  top: 'calc(100% + 5px)',
  left: 0,
  width: '100%',
  backgroundColor: '#fff',
  borderRadius: '10px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  zIndex: 10,
  maxHeight: '300px',
  overflowY: 'auto',
});

const CategoryHeading = styled(Typography)({
  padding: '8px 16px',
  fontWeight: 600,
  color: '#7A7A7A',
  fontSize: '14px',
});

const SuggestionItem = styled(ListItem)({
  padding: '10px 16px',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: '#f5f5f5',
  },
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
});

const ServiceIcon = styled('div')({
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  backgroundColor: '#f0f0f0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const SearchBar = () => {
  const [searchValue, setSearchValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const navigate=useRouter();



  // Mock data for services and popular searches
  const popularServices = [
    { name: 'RO Service', icon: '🔧',URL:'/ro-water-purifier' },
    // { name: 'Vaccum Cleaner', icon: '',URL:'/service/ro-service?category=ro-repair' },
    // { name: 'Ro Installation', icon: '🧹',URL:'/service/ro-service?category=ro-installation' },
    {name:'Geyser',icon:'🔧',URL:'/geyser-repair'},
    { name: 'AC Repair', icon: '❄️',URL:'/ac' },
    { name: 'Washing Service', icon: '❄️',URL:'/washing-machine-repair' },
  ];

  // new page become vendor ,job,blog,contact
  const topSearches = [
    { name: 'Plumbing Services', icon: '🚿' },
    { name: 'Electrician', icon: '⚡' },
    { name: 'Home Cleaning', icon: '🧹' },
    { name: 'Pest Control', icon: '🐜' },
  ];

  // Filter suggestions based on search input
  const filteredServices = searchValue.length > 0
    ? popularServices.filter(service => 
        service.name.toLowerCase().includes(searchValue.toLowerCase())
      )
    : popularServices;

  const handleSearchChange = (e) => {
    setSearchValue(e.target.value);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchValue(suggestion.name);
    setShowSuggestions(false);

    if(suggestion.URL){
      navigate.push(suggestion.URL);
    }
    // console.log(suggestion.URL);
    
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow for clicking on them
    // setTimeout(() => setShowSuggestions(false), 200);
    // if (!isNavigating) {
    //   setTimeout(() => setShowSuggestions(false), 200);
    // }
    if(!isNavigating){
      setTimeout(()=> setShowSuggestions(false),200);
    }
    // // Reset the navigating state
    setIsNavigating(false);
  };

  return (
    <SearchBarWrapper>
      <CustomTextField
        variant="outlined"
        placeholder="Search for services..."
        fullWidth
        value={searchValue}
        onChange={handleSearchChange}
        onFocus={() => setShowSuggestions(true)}
        onBlur={handleBlur}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <img src="/assets/images/search_normal.svg" alt="Search Icon" style={{ width: '24px', height: '24px' }} />
            </InputAdornment>
          ),
        }}
      />

      {showSuggestions && (
        <SuggestionsContainer>
          {searchValue.length === 0 && (
            <>
              <CategoryHeading>Popular Services</CategoryHeading>
              <List disablePadding>
                {popularServices.map((service, index) => (
                  <SuggestionItem key={`popular-${index}`} onClick={() => handleSuggestionClick(service)}>
                    <ServiceIcon>{service.icon}</ServiceIcon>
                    <Typography>{service.name}</Typography>
                  </SuggestionItem>
                ))}
              </List>
              
              <CategoryHeading>Top Searches</CategoryHeading>
              <List disablePadding>
                {topSearches.map((search, index) => (
                  <SuggestionItem key={`top-${index}`} onClick={() => handleSuggestionClick(search)}>
                    <ServiceIcon>{search.icon}</ServiceIcon>
                    <Typography>{search.name}</Typography>
                  </SuggestionItem>
                ))}
              </List>
            </>
          )}

          {searchValue.length > 0 && filteredServices.length > 0 && (
            <>
              <CategoryHeading>Services</CategoryHeading>
              <List disablePadding>
                {filteredServices.map((service, index) => (
                  <SuggestionItem key={`filtered-${index}`} onClick={() => handleSuggestionClick(service)}>
                    <ServiceIcon>{service.icon}</ServiceIcon>
                    <Typography>{service.name}</Typography>
                  </SuggestionItem>
                ))}
              </List>
            </>
          )}

          {searchValue.length > 0 && filteredServices.length === 0 && (
            <Box p={2} textAlign="center">
              <Typography color="textSecondary">No services found for "{searchValue}"</Typography>
            </Box>
          )}
        </SuggestionsContainer>
      )}
    </SearchBarWrapper>
  );
};

export default SearchBar;