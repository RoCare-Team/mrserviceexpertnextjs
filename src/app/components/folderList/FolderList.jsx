import React, { useState } from 'react';
import { Box, Typography, Button, Avatar, Stack } from '@mui/material';

const FolderList = ({ data }) => {
  const [showAll, setShowAll] = useState(false);

  const toggleShowAll = () => setShowAll(!showAll);

  return (
    <Box
    sx={
        {
            backgroundColor:'white',
            borderRadius:'20px',
            padding:'16px',
        }
    }>
      {(showAll ? data : data.slice(0, 1)).map((item, index) => (
        <Stack
          key={index}
          direction="row"
          spacing={2}
          alignItems="center"
          sx={{
            padding: 2,
            border: '1px solid #ddd',
            borderRadius: '8px',
            marginBottom: 2,
          }}
        >
          <Avatar
            src={item.image}
            alt="folder-img"
            sx={{ width: 56, height: 56 ,borderRadius: 4 }}
            variant="square"
          />
          <Box>
            <Typography variant="h6">{item.heading}</Typography>
            <Typography variant="body2" color="text.secondary">
              {item.info}
            </Typography>
          </Box>
        </Stack>
      ))}

      {data.length > 1 && (
        <Box textAlign="center">
          <Button variant="outlined" onClick={toggleShowAll}>
            {showAll ? 'Show Less' : 'Read More'}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default FolderList;
