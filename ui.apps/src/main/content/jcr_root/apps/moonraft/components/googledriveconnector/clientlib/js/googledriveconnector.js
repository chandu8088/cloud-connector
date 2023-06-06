var dataFromJson = {};
console.log('Starting of dataFromJson');
// loading files for the root directory...
let prevPage = '';
// TODO: Replace with the actual url...
let currentPage = window.location.href.split('.html')[0] + base_url;
console.log("currentPage----" + currentPage)
const breadcrum = {};
const pagination = {};
const names = {};
const SORT_TRACK = {};
const KEYS = {
  NAME: 'NAME_SORT',
  TYPE: 'TYPE_SORT',
  LAST_MODIFIED: 'LAST_MODIFIED_SORT',
  FILE_SIZE: 'FILE_SIZE_SORT',
  SORT_DEFAULT: 'fa-sort',
  SORT_ASC: 'fa-sort-asc',
  SORT_DESC: 'fa-sort-desc',
}
const init = async (folderId) => {
  try {
    console.log("---------**************-----------" + folderId)
    SORT_TRACK[folderId] = {
      [KEYS.NAME]: KEYS.SORT_DEFAULT,
      [KEYS.TYPE]: KEYS.SORT_DEFAULT,
      [KEYS.LAST_MODIFIED]: KEYS.SORT_DEFAULT,
      [KEYS.FILE_SIZE]: KEYS.SORT_DEFAULT
    };
    console.log(SORT_TRACK);
    let apiUrl = base_folderId ? currentPage + '/folder/' + base_folderId : currentPage;
    const result = await getApi(apiUrl, folderId);
    const id = result.files.length ? result.files[0].parents[0] : 'root';
    breadcrum[folderId] = [id];
    pagination[folderId] = {};
    pagination[folderId][id] = [];
    prepareTable(result, folderId);
    pageManage(apiUrl, folderId);

    // adding event on input
    const input = document.getElementById("searchBar-" + folderId);
    // Execute a function when the user presses a key on the keyboard
    input.addEventListener("keypress", function (event) {
      // If the user presses the "Enter" key on the keyboard
      if (event.key === "Enter") {
        // Cancel the default action, if needed
        event.preventDefault();
        // Trigger the button element with a click
        document.getElementById("searchButton-" + folderId).click();
      }
    });
  } catch (error) {
    console.log(error);
  }
}
const pageManage = (url, folderId) => {
  if (pagination[folderId][breadcrum[folderId][breadcrum[folderId].length - 1]]) {
    pagination[folderId][breadcrum[folderId][breadcrum[folderId].length - 1]].push(url);
  } else {
    pagination[folderId][breadcrum[folderId][breadcrum[folderId].length - 1]] = [url];
  }
  // after adding using the length value
}
async function clik(val, folderId) {
  console.log(val.value, folderId);
  var url;
  for (let i = 0; i < dataFromJson[folderId].files.length; i++) {
    if (val.value === dataFromJson[folderId].files[i].id) {
      if (dataFromJson[folderId].files[i].mimeType.includes("folder")) {
        url = '/folder/' + val.value;
        breadcrum[folderId].push(val.value);
        names[val.value] = dataFromJson[folderId].files[i].name
        pagination[folderId][val.value] = [];
        // TODO: Needs to replace with the actual url using folder id...
        const result = await getApi(currentPage + url, folderId);
        prepareTable(result, folderId, currentPage + url);
        pageManage(currentPage + url, folderId)
      }
      else if (!(dataFromJson[folderId].files[i] && dataFromJson[folderId].files[i].mimeType && dataFromJson[folderId].files[i].mimeType.includes("folder"))) {
        url = '/file/' + val.value;
        // Download files
        let link = document.createElement("a");
        link.download = name;
        link.href = currentPage + url;
        link.click();
      }
    }
  }
}
const previousButton = (folderId) => {
  if (pagination[folderId][breadcrum[folderId][breadcrum[folderId].length - 1]] && pagination[folderId][breadcrum[folderId][breadcrum[folderId].length - 1]].length > 1) {
    document.getElementById("connector-" + folderId).innerHTML +=
      "<br />&nbsp;&nbsp;<button class='link' value=" +
      pagination[folderId][breadcrum[folderId][breadcrum[folderId].length - 1]][pagination[folderId][breadcrum[folderId][breadcrum[folderId].length - 1]].length - 2] +
      " onclick='prev(this, \"" + folderId + "\")' style='margin-right: 8px;'>Previous</button>";
  }
}
async function next(val, folderId) {
  const url = val.value;
  // TODO: Change with the actual url
  const result = await getApi(url, folderId);
  folderUrl = url.split('/npToken')[0]
  prepareTable(result, folderId, folderUrl);
  pageManage(url, folderId);
  previousButton(folderId);
}
async function prev(val, folderId) {
  const url = val.value;
  // TODO: Change with the actual url
  const result = await getApi(url, folderId);
  pagination[folderId][breadcrum[folderId][breadcrum[folderId].length - 1]].splice(pagination[folderId][breadcrum[folderId][breadcrum[folderId].length - 1]].length - 1, 1);
  console.log(`
  AFTER
  Pagination ${JSON.stringify(pagination)}
  `);
  prepareTable(result, folderId);
  previousButton(folderId);
}
async function onSearch(folderId) {
  // read the value from input search bar...
  let query = document.getElementById(`searchBar-${folderId}`).value;
  // TODO: Replace with the actual url
  const url = currentPage + "/q/" + query;
  const result = await getApi(url, folderId);
  prepareTable(result, folderId);
}
async function goBack(val, folderId) {
  console.log(val.value, folderId);
  try {
    const id = val.value;
    console.log(JSON.stringify(breadcrum));
    // deleting key from the pagination on goBack
    const indexOf = breadcrum[folderId].indexOf(id);
    console.log(indexOf, id);
    //&& indexOf !== breadcrum.length - 1
    if (indexOf > -1) {
      for (let index = indexOf + 1; index < breadcrum[folderId].length; index++) {
        delete pagination[folderId][breadcrum[folderId][index]];
        breadcrum[folderId].splice(indexOf + 1);
      }
      // breadcrum.splice(breadcrum.length - 1, 1);
      console.log(JSON.stringify(pagination))
      console.log(JSON.stringify(breadcrum))
      /**
       * pagination = {id: [1, 2, 3], id: [1, 2, 3]}
       * breadcrum = {id: [1, 2, 3], id: [1, 2, 3]}
       */
      const url = pagination[folderId][breadcrum[folderId][breadcrum[folderId].length - 1]][pagination[folderId][breadcrum[folderId][breadcrum[folderId].length - 1]].length - 1];
      const result = await getApi(url, folderId);
      prepareTable(result, folderId);
      previousButton(folderId);
    }

  } catch (error) {
    console.log(error);
  }
}

// to get the icon
const getIcon = (json) => {
  if (json.hasThumbnail) {
    return json.iconLink;
  } else if (json.mimeType.includes(".folder")) {
    return "/etc.clientlibs/moonraft/clientlibs/clientlib-base/resources/assets/folder.png";
  } else {
    return getLogo(json.fileExtension);
  }
}

const sort = (colName, folderId) => {
  if (SORT_TRACK[folderId][colName] === KEYS.SORT_DEFAULT) {
    SORT_TRACK[folderId][colName] = KEYS.SORT_ASC;
  } else if (SORT_TRACK[folderId][colName] === KEYS.SORT_ASC) {
    SORT_TRACK[folderId][colName] = KEYS.SORT_DESC;
  } else if (SORT_TRACK[folderId][colName] === KEYS.SORT_DESC) {
    SORT_TRACK[folderId][colName] = KEYS.SORT_DEFAULT;
  }
  console.log(pagination);
  console.log(breadcrum);
  const breadcrumTitle = breadcrum[folderId][breadcrum[folderId].length - 1]
  let url = pagination[folderId][breadcrumTitle][pagination[folderId][breadcrumTitle].length - 1];
  // TODO: update the url based on sorting...
  if (SORT_TRACK[folderId][KEYS.NAME] === KEYS.SORT_ASC) {
    url = `${url}/orderBy/name`;
  } else if (SORT_TRACK[folderId][KEYS.NAME] === KEYS.SORT_DESC) {
    url = `${url}/orderBy/name/desc`;
  }
  console.log('After sort added', url);
  reloadPage(url, folderId);
  console.log('sort console');
}

const reloadPage = async (url, folderId) => {
  const result = await getApi(url, folderId);
  prepareTable(result, folderId, url);
}

function formatFileSize(bytes, decimalPoint) {
  if (bytes == 0) return '0 Byte';
  const k = 1024;
  const dm = decimalPoint || 2;
  const sizes = ['Byte', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const prepareTable = (json, folderId, optional = null) => {
  dataFromJson[folderId] = json;
  console.log('Prepare Table - ' + folderId)
  console.log(base_folderId)
  // <th onclick="sort('${KEYS.TYPE}', '${folderId}')">File type <i class="fa ${SORT_TRACK[folderId][KEYS.TYPE]}" aria-hidden="true"></i></th>
  // <th onclick="sort('${KEYS.LAST_MODIFIED}', '${folderId}')">Last modified <i class="fa ${SORT_TRACK[folderId][KEYS.LAST_MODIFIED]}" aria-hidden="true"></i></th>
  // <th onclick="sort('${KEYS.FILE_SIZE}', '${folderId}')">File size <i class="fa ${SORT_TRACK[folderId][KEYS.FILE_SIZE]}" aria-hidden="true"></i></th>

  document.getElementById("connectors-" + folderId).innerHTML = `
    <tr style='height: 50px;'>
      <th onclick="sort('${KEYS.NAME}', '${folderId}')" colspan='2' width='20px' style='padding-left: 16px; padding-right: 16px'>Name <i class="fa ${SORT_TRACK[folderId][KEYS.NAME]}" aria-hidden="true"></i></th>
      <th>File type</th>
      <th>Last modified</th>
      <th>File size</th>
    </tr>
  `;
  for (i = 0; i < json.files.length; i++) {
    var arrayType;
    if (json.files[i].mimeType.includes("folder")) {
      arrayType = "folder";
    } else if (json.files[i].fileExtension) {
      arrayType = json.files[i].fileExtension;
    }
    var dateType = json.files[i].createdTime.split("T");
    var sizeType;
    if (json.files[i].size) {
      sizeType = formatFileSize(json.files[i].size)//json.files[i].size + "KB";
      // sizeType = json.files[i].size + "KB";
    } else {
      sizeType = "";
    }
    const icon = getIcon(json.files[i]);
    //json.files[i].hasThumbnail ?  : ;
    document.getElementById("connectors-" + folderId).innerHTML +=
      "<tr id='impT'><td width='20px' style='padding: 16px 16px 8px 16px;'><img width='20px' height='20px' src =" +
      icon +
      "></td> <td><button style='all: unset; cursor: pointer;' value=" +
      json.files[i].id +
      " onclick='clik(this, \"" + folderId + "\")' >" +
      json.files[i].name +
      "</button></td><td>" +
      arrayType +
      "</td><td>" +
      dateType[0] +
      "</td><td>" +
      sizeType +
      "</td></tr>";
  }
  document.getElementById("connector-" + folderId).innerHTML = '';
  if (dataFromJson[folderId].nextPageToken) {
    let nextPageURL = currentPage + '/folder/' + breadcrum[folderId][breadcrum[folderId].length - 1] + '/npToken/' + dataFromJson[folderId].nextPageToken;
    document.getElementById("connector-" + folderId).innerHTML +=
      "<br />&nbsp;&nbsp;<button class='link' value=" +
      nextPageURL +
      " onclick='next(this, \"" + folderId + "\")'>Next</button>";
  }
  updateBreadcrum(folderId);
  if (dataFromJson[folderId] && !dataFromJson[folderId].files.length) {
    console.log(no_content);
    document.getElementById("noData-" + folderId).innerHTML = `<p>${no_content}</p>`;
  } else {
    document.getElementById("noData-" + folderId).innerHTML = "";
  }
}

/**
*Breadcrum
*/

const updateBreadcrum = (folderId) => {
  const mapped = breadcrum[folderId].map((bread, index) => {
    return `<button class="breadcrum" value='${bread}' onclick='goBack(this, "${folderId}")'>${index === 0 ? 'My Drive' : names[bread]}</button>`;
  }).join(" > ");
  document.getElementById("breadcrum-" + folderId).innerHTML = mapped;
}


/**
 * To get the Data from server
 * @param {} url
 * @returns
 */
const getApi = (url, folderId) => {
  const loader = document.getElementById("loader-" + folderId);
  loader.style.visibility = "visible";
  return new Promise((resolve, reject) => {
    fetch(url)
      .then((response) => response.json())
      .then((json) => {
        resolve(json); loader.style.visibility = "hidden";
      })
      .catch((error) => {
        reject(error); loader.style.visibility = "hidden";
      })
  })
}
const getLogo = (ext) => {
  const allExt = ['txt', 'pdf', 'xlx', 'doc', 'zip', 'doc'];
  if (allExt.includes(ext)) {
    return `/etc.clientlibs/moonraft/clientlibs/clientlib-base/resources/assets/${ext}.png`;
  } else {
    return '/etc.clientlibs/moonraft/clientlibs/clientlib-base/resources/assets/default.png';
  }
}
// init();
