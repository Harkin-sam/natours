// using API call to update user data

import axios from 'axios';
import { showAlert } from './alerts';

// type is either "password" or "data"
export const updateUserSettings = async (data, type) => {

    // data here will be an object of the info
    try {

        const url = type === 'password' ? '/api/v1/users/updateMyPassword': '/api/v1/users/updateMe'


      const result = await axios({
        method: 'PATCH',
        url,
        data
      });
  
      if (result.data.status === 'success') {
        showAlert('success', `${type.toUpperCase()} updated successfully!` );
      }
      // console.log(result);
    } catch (err) {
      showAlert('error', err); // Message property is the one we define on the server when theres is an error 
    }
  };