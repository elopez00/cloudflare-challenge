/************************** Event Listener **************************/

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

/************************** Extra Credit **************************/

/**
 * Returns url stored in "cloud-flare-challenge" cookie.
 * @param {Request} request
 * @return {String}         returns the url stored in the cookie as a string
 */
getCookie = request => {
  let cookiesStr = request.headers.get('Cookie');
  let url;
  
  if (cookiesStr) {
    let cookies = cookiesStr.split(';'); // splits cookie str at the ';' char
    cookies.forEach(cookie => {
      if (cookie.split('=')[0].trim() === "cloud-flare-challenge") // compares the cookie name to target
      url = cookie.split('=')[1]; // sets url 
    })
  }
  return url;
}

class ElementHandler {
  constructor(variant, id) {
    this.id = id;
    this.variant = variant;
  }

  element(element) {
    switch (element.tagName) {
      case ("title"): 
        element.setInnerContent(`Eddie's Challenge #${this.variant}`); 
        break;
      
      case ("h1"):  
        if (element.getAttribute("id") === this.id) 
          element.setInnerContent(`Eddie's Challenge #${this.variant}`)
      break;

      case ("p"): 
        if (element.getAttribute("id") === this.id)
          element.setInnerContent(`This was variant ${this.variant} of my challenge`)
      break;

      case ("a"): 
        let link = this.variant === '1' ? "https://github.com/elopez00" // if the variant is equal to 1, it will redirect to my github
          : this.variant === '2' ? "https://www.linkedin.com/in/eduardo-lopez-4bb787194/" // if the variant is equal to 2, it will redirect to my linkedin
          : null; // else it will return null
        let text = this.variant === '1' ? "Go to GitHub" // if the variant is 1, then the button will say "Go to GitHub"
          : this.variant === '2' ? "Go to Linkedin" // if the variant is 2, the button will say "Go to Linkedin"
          : null; // else the button won't do anything

        if (element.getAttribute("href") && element.getAttribute("id") === this.id) {
          element.setAttribute("href", link);
          element.setInnerContent(text);
        }
      break;
    }
  }
}

/************************** Functions **************************/

/**
 * fetches the urls from "variants" array and returns any of the two.
 * @returns {String}      one of the two urls from the "variants" array
 */
getUrl = () => {
  return fetch("https://cfw-takehome.developers.workers.dev/api/variants")
    .then(res => res.json())
    .then(raw => {
      let {variants} = raw;
      return Math.random() > .5 ? variants[0] : variants[1];
    }).catch(err => console.error(err));
}

/**
 * gets the html response from the url and turns it into text.
 * @param {String} url    url that the user wants to fetch in html form.
 * @returns {String}      returns the HTML as a string
 */
getHtml = url => {
  // gets the number at the end of the url to determine the original variant
  let variant = url.substring(url.length - 1);

  // instantiate rewriter object
  let rewriter = new HTMLRewriter()
    .on('title', new ElementHandler(variant))
    .on('h1', new ElementHandler(variant, 'title'))
    .on('p', new ElementHandler(variant, 'description'))
    .on('a', new ElementHandler(variant, 'url'));

  return fetch(url)
    .then(res => rewriter.transform(res).text())
    .catch(err => console.error(err));
}

/************************** Handler **************************/

/**
 * Respond with html
 * @param {Request} request
 * @returns {Response}
 */
async function handleRequest(request) {
  // check if cookie url exists
  let cookieUrl = await getCookie(request);

  // if the cookie url exists set it to the url var, else set one of the two urls to the var instead
  let url = cookieUrl || await getUrl();

  //get the html from the url
  let html = await getHtml(url);

  // set the cookie if the cookieUrl could not be retrieved
  let setCookie = !cookieUrl ? {'set-cookie': `cloud-flare-challenge=${url}`} : {};

  return new Response(html, {
    headers: { 'content-type': 'text/html' , ...setCookie} // add setCookie
  }) 
}