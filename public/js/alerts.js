// using parcel web bundler : npm  install parcel-bundler --save-dev or npm i parcel-bundler@1.12.3 --save-dev

export const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) {
    el.parentElement.removeChild(el);
  }
};

// type 'success' or 'error'
export const showAlert = (type, msg, time = 7) => {
  hideAlert();
  const markup = `<div class="alert alert--${type}">${msg}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup); // inside of the body but right at the beginning

  // hide alert after 5 seconds
  window.setTimeout(hideAlert, time * 1000);
};
