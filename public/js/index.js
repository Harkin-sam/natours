import '@babel/polyfill';
import { login, logout } from './login';
import { updateUserSettings } from './updateSettings';
import { displayMap } from './mapbox';
import { bookTour } from './stripe';
// This file is to get data form the user interface and delegate the action, it just normal javascript

// TO prevent mapbox rendering errors running on all pages that is not required

// DOM ELEMENT
const mapBox = document.getElementById('map');
const loginForm = document.getElementById('login-btn');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataBtn = document.getElementById('userDataSubmit');
const userPasswordBtn = document.getElementById('userPasswordSubmit');
const bookBtn = document.getElementById('book-tour');

// DELEGATION
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);

  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('click', (e) => {
    e.preventDefault();

    // VALUES
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // console.log(email,password);
    login(email, password);
  });
}

if (logOutBtn) {
  logOutBtn.addEventListener('click', logout);
}

if (userDataBtn) {
  userDataBtn.addEventListener('click', (e) => {
    e.preventDefault();

    // Programmatically re-create multi-part Form data
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]); // select the first element in the array

    // console.log(form);

    updateUserSettings(form, 'data'); // AXIOS will recognize form as object and it works
  });
}

if (userPasswordBtn) {
  userPasswordBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    userPasswordBtn.textContent = 'Updating...';

    // VALUES
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    // we are awaiting it because we want to wait for it to finish so that we can clear and update the user input fields
    await updateUserSettings(
      { passwordCurrent, password, passwordConfirm },
      'password'
    );

    userPasswordBtn.textContent = 'Save Password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}

if (bookBtn) {
  bookBtn.addEventListener('click', (e) => {
    e.target.textContent = 'Processing...';
    const { tourId } = e.target.dataset;
    bookTour(tourId);
  });
}


// install polyfiller for order browser npm i @babel/polyfill
