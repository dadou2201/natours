/* eslint-disable*/
//type is 'success' or 'error'
export const showAlert = (type, msg) => {
  const markup = `<div class="alert--${type}">${msg}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin');
};
