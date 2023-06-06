const recaptchaClientKey = siteKey;
let captcha_token = '';
let captcha_expired = false;

const json = surveyJson;

var verifyCallback = function(response) {
    document.getElementById('captcha-error').innerHTML = "";
    captcha_expired = false;
};
function expiredCallback() {
    captcha_expired = true;
}

Survey.StylesManager.applyTheme("defaultV2");

async function sendDataToServer(survey) {
    try{
        console.log(JSON.stringify({...survey.data, captcha_token}))
        //send Ajax request to your web server
        const requestBody = getFlatteningJson({...survey.data, captcha_token});
        const response = await postApi("/content/moonraft/us/en/jcr:content.gSheets.json", requestBody);
        console.log(response);
        captcha_token = '';
    }catch(error){
		console.log(error);
    }
}

var survey = new Survey.Model(json);
$("#surveyContainer").Survey({
    model: survey,
    onComplete: sendDataToServer
});


survey.onCompleting.add(function (sender, options) {
    var response = grecaptcha.getResponse();
    console.log(response);
    if (response.length == 0) {
        if(!captcha_expired){
			document.getElementById('captcha-error').innerHTML =
            '<span class="text-danger"><ul><li>Google reCAPTCHA validation failed</li></ul ></span >';
        }else{
			document.getElementById('captcha-error').innerHTML = '';
        }

        options.allowComplete = false;
    } else {
        captcha_token = response;
        options.allowComplete = true;
    } 
});

const postApi = (url, data)=>{
    return new Promise(async (resolve, reject)=>{
    	// loading token...
        const tokenRes = await getToken("/libs/granite/csrf/token.json");
        const headers = {};
        if(tokenRes && tokenRes.token){
            headers['headers'] = {"CSRF-Token": tokenRes.token}; 
        }
		console.log(tokenRes);
    	fetch(url, {
			method: "POST",
            ...headers,
    		body: JSON.stringify(data)
		})
        .then(res=> res.json())
        .then((result)=> resolve(result))
        .catch((error)=> reject(error));
	})
}

const getToken = (url) => {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then((response) => response.json())
      .then((json) => { resolve(json);})
      .catch((error) => { reject(error);})
  })
}

function getFlatteningJson(data) {
    const flattenJson = {}

    for (let i = 0; i < data['applicant-info'].length; i++) {
        if (data["applicant-info"][i]) {
            if (data["applicant-info"][i]["full-name"]) {
                flattenJson[`applicant-info-first-name-${i + 1}`] = data["applicant-info"][i]["full-name"]["first-name"] || "";
                flattenJson[`applicant-info-last-name-${i + 1}`] = data["applicant-info"][i]["full-name"]["last-name"] || "";
            }
            flattenJson[`applicant-info-street-address-${i + 1}`] = data["applicant-info"][i]["street-address"] || "";
            flattenJson[`applicant-info-city-${i + 1}`] = data["applicant-info"][i]["city"] || "";
            flattenJson[`applicant-info-zip-${i + 1}`] = data["applicant-info"][i]["zip"] || "";
            if (data["applicant-info"][i]["birth-info"]) {
                flattenJson[`applicant-info-birthplace-${i + 1}`] = data["applicant-info"][i]["birth-info"]["birthplace"] || "";
                flattenJson[`applicant-info-birthdate-${i + 1}`] = data["applicant-info"][i]["birth-info"]["birthdate"] || "";
            }
            flattenJson[`applicant-info-phone-${i + 1}`] = data["applicant-info"][i]["phone"] || "";
            flattenJson[`applicant-info-country-${i + 1}`] = data["applicant-info"][i]["country"] || "";
        }
    }

    for (let i = 0; i < data.employer.length; i++) {
        if (data.employer[i]) {
            flattenJson[`employer-organization-${i + 1}`] = data["employer"][i]["organization"] || ""
            if (data["employer"][i]["occupation"]) {
                flattenJson[`employer-occupation-${i + 1}`] = data["employer"][i]["occupation"]["position"] || "";
            }
            if (data["employer"][i]["income"]) {
                flattenJson[`employer-basic-salary-${i + 1}`] = data["employer"][i]["income"]["basic-salary"] || ""
                flattenJson[`employer-guaranteed-bonus-${i + 1}`] = data["employer"][i]["income"]["guaranteed-bonus"] || ""
                flattenJson[`employer-nonguaranteed-bonus-${i + 1}`] = data["employer"][i]["income"]["nonguaranteed-bonus"] || ""
            }
            flattenJson[`employer-have-other-income-sources-${i + 1}`] = data["employer"][i]["have-other-income-sources"]
            flattenJson[`employer-other-income-sources-${i + 1}`] = data["employer"][i]["other-income-sources"]
            if (data["employer"][i]["employment-verification-letter"] && data["employer"][i]["employment-verification-letter"].length) {
                for (let j = 0; j < data["employer"][i]["employment-verification-letter"].length; j++) {
                    flattenJson[`employment-verification-letter-name-${i + 1}-${j + 1}`] = data["employer"][i]["employment-verification-letter"][j]["name"]
                    flattenJson[`employment-verification-letter-type-${i + 1}`] = data["employer"][i]["employment-verification-letter"][j]["type"]
                    flattenJson[`employment-verification-letter-content-${i + 1}`] = data["employer"][i]["employment-verification-letter"][j]["content"]
                }
            }
        }
    }

    flattenJson["used-as-main-residence"] = data["used-as-main-residence"] || "";
    flattenJson["used-for-business"] = data["used-for-business"] || "";
    flattenJson["loan-purpose"] = data["loan-purpose"] || "";
    flattenJson["guarantor"] = data["guarantor"] || false;
    flattenJson["property-use"] = data["property-use"] || "";
    flattenJson["street-address"] = data["street-address"] || "";
    flattenJson["city"] = data["city"] || "";
    flattenJson["zip"] = data["zip"] || "";
    flattenJson["country"] = data["country"] || "";
    flattenJson["used-as-main-residence"] = data["used-as-main-residence"] || false;
    flattenJson["used-for-business"] = data["used-for-business"] || false;

    if (data['ids']) {
        if (data.ids["first-id-info"]) {
            flattenJson['first-id-info-id-type'] = data.ids["first-id-info"]["id-type"] || "";
            flattenJson['first-id-info-expiration-date'] = data.ids["first-id-info"]["expiration-date"] || "";
        }

        if (data.ids["second-id-info"]) {
            flattenJson['second-id-info-id-type'] = data.ids["second-id-info"]["id-type"] || "";
            flattenJson['second-id-info-expiration-date'] = data.ids["second-id-info"]["expiration-date"] || "";
        }
    }

    if (data["first-id"]) {
        data["first-id"].forEach((item, i) => {
            flattenJson[`first-id-name-${i + 1}`] = item["name"] || "";
            flattenJson[`first-id-type-${i + 1}`] = item["type"] || "";
            flattenJson[`first-id-content-${i + 1}`] = item["content"] || "";
        })

    }

    if (data["second-id"]) {
        data["second-id"].forEach((item, i) => {
            flattenJson[`second-id-name-${i + 1}`] = item["name"] || "";
            flattenJson[`second-id-type-${i + 1}`] = item["type"] || "";
            flattenJson[`second-id-content-${i + 1}`] = item["content"] || "";
        })
    }
    flattenJson["loan-amount"] = data["loan-amount"] || "";
    flattenJson["loan-tenure"] = data["loan-tenure"] || 0;

    flattenJson["captcha-token"] = data["captcha_token"] || "";
    flattenJson["resource-path"]=resource_path;
    return flattenJson;
}
