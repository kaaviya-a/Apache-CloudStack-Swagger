const url = 'http://localhost:8100';

window.onload = function() {
  window.ui = SwaggerUIBundle({
    url: url+ "/swagger.json",
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    plugins: [
      SwaggerUIBundle.plugins.DownloadUrl
    ],
    layout: "StandaloneLayout",
    requestInterceptor: requestInterceptor
  });
  
  let logo = document.body.querySelector("img[alt='Swagger UI']");
  logo.setAttribute('src', url + '/cloudstack.png')
  let favIcon = document.getElementById('img1')
  favIcon.setAttribute('href', url + '/icon.png')

  let text = document.createElement("span");
  text.innerHTML = 'Swagger'
  let get = document.getElementsByClassName("link");
  get[0].appendChild(text)
};

// requestInterceptor
const requestInterceptor = (request) => {

  if (request.url.includes('secretKey') && request.url.includes('apiKey')) {
    
    // Create signature
    
    var regex = /[?&;](.+?)=([^&;]+)/g;
    var match;
    let params = {};

    if (request.url) {
        while (match = regex.exec(request.url)) {
            params[match[1]] = decodeURIComponent(match[2]);
        }
    }

    params['command'] = request.url.split('client/api')[1].split('?')[0];
		params['response'] = 'json';

    let secretkey = params['secretKey'];
    delete params['secretKey']

    params['signature'] = calculateSignature(params, secretkey)
    params.signature = params.signature.toString()

    let newurl = request.url.split('client/api')[0] + 'client/api?'
    for (let p in params) {
      newurl = newurl + p + "=" + params[p] + "&"
    }
    
    request.url = newurl.substring(0, newurl.length - 1)
  }

  return request;
};

function calculateSignature (queryDict, secretkey) {
  let orderedQuery = Qs.stringify(queryDict, { encode: true }).replace(/\%5B(\D*?)\%5D/g, '.$1').replace(/\%5B(\d*?)\%5D/g, '[$1]').split('&').sort().join('&').toLowerCase();
  let hmac1 = CryptoJS.HmacSHA1(orderedQuery, secretkey)
  var hashInBase64 = CryptoJS.enc.Base64.stringify(hmac1);
  return encodeURIComponent(hashInBase64);
}