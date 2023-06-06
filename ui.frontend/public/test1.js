var dataFromJson;

// loading files for the root directory...
let prevPage = '';
// TODO: Replace with the actual url...
let currentPage = './data.json';
const breadcrum = ['root'];
let indexAt = 0;
const pagination = {};
pagination['root'] = [];

const init = async () => {
  try {
    const result = await getApi(currentPage);
    prepareTable(result);
    pageManage(currentPage);
  } catch (error) {
    console.log(error);
  }
}

const pageManage = (url) => {
  if (pagination[breadcrum[breadcrum.length - 1]]) {
    pagination[breadcrum[breadcrum.length - 1]].push(url);
  } else {
    pagination[breadcrum[breadcrum.length - 1]] = [url];
  }
  // after adding using the length value
  indexAt = pagination[breadcrum[breadcrum.length - 1]].length - 1;
}

async function clik(val) {
  var url;
  for (let i = 0; i < dataFromJson.files.length; i++) {
    if (val.value === dataFromJson.files[i].id) {
      if (dataFromJson.files[i].mimeType.includes("folder")) {
        url = 'folder/' + val.value;
        breadcrum.push(val.value);
        pagination[val.value] = [];
        // TODO: Needs to replace with the actual url using folder id...
        const result = await getApi('./sub.data.json');
        prepareTable(result);
      }
      if (!dataFromJson.files[i].mimeType.includes("folder")) {
        url = 'file/' + val.value;
        // Download files
        let link = document.createElement("a");
        link.download = name;
        link.href = './sample.txt';
        link.click();
      }
    }
  }
}

const previousButton = () => {
  if (pagination[breadcrum[breadcrum.length - 1]] && pagination[breadcrum[breadcrum.length - 1]].length > 1) {
    document.getElementById("connector").innerHTML +=
      "<br />&nbsp;&nbsp;<button value=" +
      pagination[breadcrum[breadcrum.length - 1]][indexAt - 1] +
      " onclick='prev(this)'>Previous</button>";
  }
}

async function next(val) {
  const url = val.value;
  // TODO: Change with the actual url
  const result = await getApi(url);
  prepareTable(result);
  pageManage(url);
  previousButton();

}

async function prev(val) {
  const url = val.value;
  // TODO: Change with the actual url
  const result = await getApi(url);
  pagination[breadcrum[breadcrum.length - 1]].splice(pagination[breadcrum[breadcrum.length - 1]].length - 1, 1);
  prepareTable(result);
  previousButton();
}

async function onSearch() {
  // read the value from input search bar...
  let query = document.getElementById('searchBar').value;
  // TODO: Replace with the actual url
  const url = `./search.data.json?q=${query}`;
  const result = await getApi(url);
  prepareTable(result);
}

async function goBack() {
  try {
    // deleting key from the pagination on goBack
    delete pagination[breadcrum[breadcrum.length - 1]];
    breadcrum.splice(breadcrum.length - 1, 1);
    indexAt = pagination[breadcrum[breadcrum.length - 1]].length - 1;
    const url = pagination[breadcrum[breadcrum.length - 1]][pagination[breadcrum[breadcrum.length - 1]].length - 1];
    const result = await getApi(url);
    prepareTable(result);
    previousButton();
  } catch (error) {
    console.log(error);
  }
}

const goBackButton = () => {
  if (breadcrum.length > 1) {
    document.getElementById('goBack').style.visibility = 'visible';
  } else {
    document.getElementById('goBack').style.visibility = 'hidden';
  }
}

const prepareTable = (json) => {
  dataFromJson = json;
  document.getElementById("connectors").innerHTML = `
    <tr style='height: 50px;'>
      <th colspan='2' width='20px' style='padding-left: 16px; padding-right: 16px'>Name</th>
      <th>File type</th>
      <th>Last modified</th>
      <th>File size</th>
    </tr>
  `;
  for (i = 0; i < json.files.length; i++) {
    var arrayType;
    if (json.files[i].mimeType.includes("folder")) {
      arrayType = "folder";
    }
    if (json.files[i].mimeType.includes("text")) {
      arrayType = "text";
    }
    if (json.files[i].mimeType.includes("pdf")) {
      arrayType = "pdf";
    }
    var dateType = json.files[i].createdTime.split("T");
    var sizeType;
    if (json.files[i].size) {
      sizeType = json.files[i].size + "KB";
    } else {
      sizeType = "";
    }
    const icon = json.files[i].hasThumbnail ? getLogo(json.files[i].fileExtension) : "./assets/folder.png";
    document.getElementById("connectors").innerHTML +=
      "<tr id='impT'><td width='20px' style='padding: 16px 16px 8px 16px;'><img width='20px' height='20px' src =" +
      icon +
      "></td> <td><button style='all: unset; cursor: pointer;' value=" +
      json.files[i].id +
      " onclick='clik(this)' >" +
      json.files[i].name +
      "</button></td><td>" +
      arrayType +
      "</td><td>" +
      dateType[0] +
      "</td><td>" +
      sizeType +
      "</td></tr>";
  }
  document.getElementById("connector").innerHTML = '';

  if (json.nextPageToken) {
    document.getElementById("connector").innerHTML +=
      "<br />&nbsp;&nbsp;<button value=" +
      json.nextPageToken +
      " onclick='next(this)'>Next</button>";
  }

  goBackButton();
}

/**
 * To get the Data from server
 * @param {} url 
 * @returns 
 */
const getApi = (url) => {
  return new Promise((resolve, reject) => {
    fetch(url)
      .then((response) => response.json())
      .then((json) => { resolve(json) })
      .catch((error) => { reject(error) })
  })
}

const getLogo = (ext) => {
  const allExt = ['txt', 'pdf', 'xlx', 'doc', 'zip', 'doc'];
  if (allExt.includes(ext)) {
    return `./assets/${ext}.png`;
  } else {
    return './assets/default.png';
  }
}


init();

// Testing serveyjs...
Survey.StylesManager.applyTheme("defaultV2");

var surveyJSON = {"logoPosition":"right","pages":[{"name":"page1","elements":[{"type":"text","name":"question1","title":"First Name","isRequired":true},{"type":"text","name":"question2","title":"Last Name","isRequired":true},{"type":"text","name":"question3","title":"Email","isRequired":true},{"type":"text","name":"question4","title":"Phone","isRequired":true},{"type":"dropdown","name":"question5","title":"City","isRequired":true,"choices":[{"value":"Item 1","text":"BLR"},{"value":"Item 2","text":"VNS"},{"value":"Item 3","text":"GZP"},{"value":"Item 4","text":"HYD"}]}],"title":"Contact Form","description":"Please enter all required data"},{"name":"page2","elements":[{"type":"text","name":"question6","title":"Course"},{"type":"text","name":"question7","title":"Branch"}]},{"name":"page3","elements":[{"type":"text","name":"question8","title":"Address"}]}],"showTitle":false};

function sendDataToServer(survey) {
    //send Ajax request to your web server
    alert("The results are: " + JSON.stringify(survey.data));
}

var survey = new Survey.Model(surveyJSON);
$("#surveyContainer").Survey({
    model: survey,
    onComplete: sendDataToServer
});