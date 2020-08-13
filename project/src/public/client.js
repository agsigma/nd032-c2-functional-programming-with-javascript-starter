const Map = Immutable.Map;
const List = Immutable.List;

let store = new Map({
  apod: '',
  rovers: new List(['Curiosity', 'Opportunity', 'Spirit']),
  photos: new List([]),
  roversData: new Map(),
});

const debounce = function(fn, ms) {
  let timeout = null;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(function() {
      fn.apply({}, args);
    }, ms);
  };
};

// add our markup to the page
const root = document.getElementById('root');

const updateStore = newState => {
  store = store.mergeDeep(newState);
  render(root, store);
};

const render = debounce((root, state) => {
  root.innerHTML = App(state);
}, 20);

const App = state => {
  if (location.hash.match(/curiosity$/)) {
    return RoverGallery(state, 'curiosity');
  }
  if (location.hash.match(/opportunity$/)) {
    return RoverGallery(state, 'opportunity');
  }
  if (location.hash.match(/spirit$/)) {
    return RoverGallery(state, 'spirit');
  }
  return Home(state);
};

const Header = function(state) {
  const buttons = ['home'].concat(
    state
      .get('rovers')
      .toArray()
      .map(string => string.toLowerCase()),
  );
  return `
        <header>${buttons
          .map(button => '<a href="#' + button + '">' + button + '</a>')
          .join('')}</header>
    `;
};

const Footer = function(state) {
  return `
        <footer>All images comes from NASA API: https://api.nasa.gov/</footer>
    `;
};

const Home = function(state) {
  const apod = state.get('apod');
  return `
        ${Header(state)}
        <main>            
            <section>
                <h3>NASA - Astronomy Picture of the Day</h3>                
                ${ImageOfTheDay(apod) || ''}
            </section>            
        </main>
        ${Footer()}
    `;
};

// listening for load event because page should load before any JS is called
window.addEventListener('load', () => {
  render(root, store);
});

// listening for tab change
window.addEventListener('hashchange', () => {
  render(root, store);
});

// ------------------------------------------------------  COMPONENTS

// Example of a pure function that renders infomation requested from the backend
const ImageOfTheDay = apod => {
  // If image does not already exist, or it is not from today -- request it again
  const today = new Date();
  const photodate = new Date(apod.date);
  if (!apod || apod.date === today.getDate()) {
    getImageOfTheDay(store);
    return ``;
  }

  // check if the photo of the day is actually type video!
  if (apod.media_type === 'video') {
    return `
            <p>See today's featured video <a href="${apod.url}">here</a></p>
            <p>${apod.title}</p>
            <p>${apod.explanation}</p>
        `;
  } else {
    return `
            <img src="${apod.get('image').get('url')}" width="100%" />
            <p>${apod.get('image').get('explanation')}</p>
        `;
  }
};

const RoverGallery = (state, roverName) => {
  const roverData = state.get('roversData').get(roverName);
  if (!roverData || !roverData.get('photos')) {
    getRoverData(roverName);
  }
  if (
    !roverData ||
    !roverData.get('photos') ||
    roverData.get('photos').size === 0
  ) {
    return `${Loading()}`;
  }
  return `
      ${Header(state)}
      ${RoverGalleryHTML(roverData)}
      ${Footer()}
  `;
};

const RoverGalleryHTML = roverData => {
  return `    
    <main>            
        <section>
            <h3>${roverData.get('roverData').get('name')}</h3>
            <p>
                <strong>Mission start:</strong> ${roverData
                  .get('roverData')
                  .get('launch_date')} <br>
                <strong>Mission landed:</strong> ${roverData
                  .get('roverData')
                  .get('landing_date')} <br>
                <strong>Status</strong>: ${roverData
                  .get('roverData')
                  .get('status')}
            </p>
            <div class='imgContainer'>${roverData
              .get('photos')
              .map(photo =>
                RoverPhoto(photo.get('img_src'), photo.get('earth_date')),
              )
              .join('')}</div>
        </section>            
    </main>
  `;
};

const RoverPhoto = (src, earth_date) => {
  return `<div class='imgThumbnail' style='background-image: url("${src}");'><span class='overlay'>${earth_date}</span></div>`;
};

const Loading = () => {
  return `<h1 class='loading'>Loading...</h1>`;
};
// ------------------------------------------------------  API CALLS

const getImageOfTheDay = () => {
  fetch(`http://localhost:3000/apod`)
    .then(res => res.json())
    .then(apod => {
      updateStore({ apod: apod });
    })
    .catch(err => console.error('getImageOfTheDay', err));
};

const getRoverData = roverName => {
  updateStore({
    roversData: {
      [roverName]: {
        photos: [],
      },
    },
  });
  return fetch(`http://localhost:3000/rovers/${roverName}`)
    .then(res => res.json())
    .then(photos => {
      updateStore({
        roversData: {
          [roverName]: {
            photos: photos.photos,
            roverData: photos.photos[0].rover,
          },
        },
      });
    })
    .catch(err => console.error('getRoverData', err));
};
