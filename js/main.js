// Initiate the wowjs animation library
new WOW().init();

// Nav links control
const menuLink = document.querySelectorAll('.nav-link')

for (let i = 0; i < menuLink.length; i++) {
    menuLink[i].addEventListener('click', (e) => {
        document.querySelector('.active').classList.remove('active');

        menuLink[i].classList.add('active');
    })
}


//Menu bar toggle controls
function toggleOn() {
  //We get the nav element object and add a class to its classlist.
  //The class we add has a css transformation property
  //to translate the hidden nav bar to view from right to left
  $('.menu-bar').toggleClass('toggled-on')

  //Add backdrop
  if (!$('.backdrop')[0]) {
    $('body').append(`<div class="backdrop"></div>`);
    $('.backdrop').click(toggleOff);
  }
  $('.backdrop').toggleClass('show-backdrop');
}

function toggleOff() {
  //This function just removes the class we added
  //and returns the nav bar to its original hiddden possition
  $('.menu-bar').removeClass('toggled-on');

  // Remove backdrop
  $('.backdrop').remove()
}