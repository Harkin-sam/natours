//install axios npm i axios
import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
  try {
    const result = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:8000/api/v1/users/login',
      data: {
        email: email,
        password: password,
      },
    });

    if (result.data.status === 'success') {
      showAlert('success', 'Logged in successfully');
      // reload/redirecting to home page after 1.5 seconds
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
    // console.log(result);
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:8000/api/v1/users/logout',
    });

    if (res.data.status === 'success') {
      location.reload(true); // to programmatically reload the page after the token is deleted ot effect the change
      // setting it to 'true' set a reload from the server and not from the browser cache cos we want a fresh page coming from the server
    }
  } catch (err) {
    showAlert('error', 'Error logging out. Try again!');
  }
};
