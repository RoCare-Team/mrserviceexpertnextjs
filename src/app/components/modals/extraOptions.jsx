import React, { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Checkbox from '@mui/material/Checkbox';
import Avatar from '@mui/material/Avatar';


export default function ExtraOptions() {
  const [isOpen, setIsOpen] = useState(false);
  const [checked, setChecked] = useState([1]);

  const handleToggle = (value) => () => {
    const currentIndex = checked.indexOf(value);
    const newChecked = [...checked];

    if (currentIndex === -1) {
      newChecked.push(value);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    setChecked(newChecked);
  };

  const handleConfirm = () => {
    toast.success(`Checked Items: ${checked.join(', ')}`, {
      position: 'top-right',
      autoClose: 3000,
    });
    setIsOpen(false);
  };

  const handleClearAll = () => {
    if (checked.length === 0) return; // Prevents action if nothing is selected
    setChecked([]);
    toast.info('All selections have been cleared.', {
      position: 'top-right',
      autoClose: 2000,
    });
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <ToastContainer />
      {/* Button to open modal */}
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded"
        onClick={() => setIsOpen(true)}
      >
        Edits
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">

            {/* Heading and Description */}
            <div className="briefInfo mb-4">
              <h3 className="text-xl font-bold mb-2">Small Heading</h3>
              <p className="mb-4">In brief we list our options</p>
              <div className="serviceTime flex items-center gap-2 mb-4">
                <img src="/assets/images/timeForService.png" alt="Service Time" className="w-6 h-6" />
                <h5 className="m-0">Service Time: 60 mins</h5>
              </div>
            </div>

            <div className="breifList">
              <h4 className='m-0 p-0'>Different features of the services</h4>
              {/* Checkbox List */}
              <List dense sx={{ width: '100%', bgcolor: 'background.paper' }}>
                {[0, 1, 2, 3].map((value) => {
                  const labelId = `checkbox-list-secondary-label-${value}`;
                  return (
                    <ListItem
                      key={value}
                      secondaryAction={
                        <Checkbox
                          edge="end"
                          onChange={handleToggle(value)}
                          checked={checked.includes(value)}
                          inputProps={{ 'aria-labelledby': labelId }}
                        />
                      }
                      disablePadding
                    >
                      <ListItemButton>
                        <ListItemAvatar>
                          <Avatar
                            alt={`Avatar n°${value + 1}`}
                            src={`/static/images/avatar/${value + 1}.jpg`}
                          />
                        </ListItemAvatar>
                        <ListItemText id={labelId} primary={`List item ${value + 1}`} />
                      </ListItemButton>
                    </ListItem>
                  );
                })}

                {/* Clear All Option */}
                <ListItem key="clear-all" disablePadding>
                  <ListItemButton
                    onClick={handleClearAll}
                    disabled={checked.length === 0}
                    sx={{
                      opacity: checked.length === 0 ? 0.5 : 1,
                      cursor: checked.length === 0 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: '#f44336' }}>X</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary="Clear All Selections"
                      primaryTypographyProps={{
                        color: checked.length === 0 ? 'text.disabled' : 'error',
                        fontWeight: 'bold',
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              </List>
              <hr />
              <div className="discount flex items-center gap-2 mt-2">
                <img src="/assets/images/offer.png" alt="Offer" className="w-6 h-6" />
                <p className='mb-0'>10% discount if more than 200</p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-between mt-4">
              <button
                className="px-4 py-2 bg-gray-500 text-white rounded mr-2"
                onClick={() => setIsOpen(false)}
              >
                Close
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded"
                onClick={handleConfirm}
              >
                Confirm
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
