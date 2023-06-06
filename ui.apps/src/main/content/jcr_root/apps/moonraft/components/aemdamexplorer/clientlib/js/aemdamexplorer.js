console.log("aem explorer");
rootPath = rootPath.replace('/content/dam','/api/assets');
var searchUrl = window.location.href.split('.html')[0] + base_Url +currentResource;
var protocol = window.location.protocol;
var hostname = window.location.hostname;
var port = window.location.port || (protocol === "https:" ? "443" : "80");

var apiPath = protocol + "//" + hostname;
if (port) {
  apiPath += ":" + port;
}
console.log(apiPath+rootPath+'.json')
var APIURL=apiPath+rootPath+'.json';
console.log(rootPath);
// loading files for the root directory...
let prevPage = '';
// TODO: Replace with the actual url...
let currentPage = 'http://localhost:4502/api/assets/moonraft.json?'//window.location.href.split('.html')[0] + base_url;
console.log("currentPage----" + currentPage)
const breadcrum = {};
const pagination = {};
const names = {};
const SORT_TRACK = {};
const KEYS = {
    NAME: 'NAME_SORT',
    TYPE: 'TYPE_SORT',
    SORT_DEFAULT: 'fa-sort',
    SORT_ASC: 'fa-sort-asc',
    SORT_DESC: 'fa-sort-desc',
}
const init = async (folderId) => {
    try {
        console.log("---------**************-----------" + folderId)
        SORT_TRACK[folderId] = {
            [KEYS.NAME]: KEYS.SORT_DEFAULT,
            [KEYS.TYPE]: KEYS.SORT_DEFAULT
        };
		let apiUrl = `${APIURL}?limit=${pageSize}&offset=0` 
        console.log(apiUrl)
        const result = await getApi(apiUrl, folderId);
        const id = result.properties.name;//result.files.length ? result.files[0].parents[0] : 'root';
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

async function clik(val, folderId, type, name) {
    console.log(val.value, folderId);
    if (type.includes("folder")) {
        const url = `${val.value}?limit=${pageSize}&offset=0`
        breadcrum[folderId].push(url);
        names[url] = name;
        pagination[folderId][url] = [];
        // TODO: Needs to replace with the actual url using folder id...
        const result = await getApi(url, folderId);
        prepareTable(result, folderId, url);
        pageManage(url, folderId);
    }
    else if (type.includes("files")) {
        // Download files
        let link = document.createElement("a");
        console.log(val.value);
        link.download = name;
        link.href = val.value;
        link.click();
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
    // previousButton(folderId);
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
    // previousButton(folderId);
}
async function onSearch(folderId) {
    // read the value from input search bar...
    let query = document.getElementById(`searchBar-${folderId}`).value;
    // TODO: Replace with the actual url
    const url = `${searchUrl}?q=${query}`//currentPage + "q=" + query;
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
            // previousButton(folderId);
        }

    } catch (error) {
        console.log(error);
    }
}

// to get the icon
const getIcon = (json) => {
    if (json.class.includes("assets/folder")) {
        return "/etc.clientlibs/moonraft/clientlibs/clientlib-base/resources/assets/folder.png";
    } else {
        return getLogo(json.properties.name.split('.')[1]);
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
    const url = pagination[folderId][breadcrumTitle][pagination[folderId][breadcrumTitle].length - 1];
    reloadPage(url, folderId);
    console.log('sort console');
}

const reloadPage = async (url, folderId) => {
    const result = await getApi(url, folderId);
    prepareTable(result, folderId, url);
}

const prepareTable = (json, folderId, optional = null) => {
    console.log('Prepare Table - ' + folderId);
    // fa-sort
    // fa-sort-desc
    // fa-sort-asc
    document.getElementById("connectors-" + folderId).innerHTML = `
    <tr style='height: 50px;'>
      <th onclick="sort('NAME_SORT', '${folderId}')" colspan='2' width='20px' style='padding-left: 16px; padding-right: 16px'>Name <i class="fa ${SORT_TRACK[folderId][KEYS.NAME]}" aria-hidden="true"></i></th>
      <th onclick="sort('TYPE_SORT', '${folderId}')">Type <i class="fa ${SORT_TRACK[folderId][KEYS.TYPE]}" aria-hidden="true"></i></th>
    </tr>
  `;
    if (json.entities && json.entities.length) {
        for (i = 0; i < json.entities.length; i++) {
            const icon = getIcon(json.entities[i]);
            const type = json.entities[i].class.includes('assets/folder') ? 'folder' : 'files';
            const fileType = type === 'folder' ? json.entities[i].class : json.entities[i].properties.metadata['dc:format'];
            document.getElementById("connectors-" + folderId).innerHTML +=
                "<tr id='impT'><td width='20px' style='padding: 16px 16px 8px 16px;'><img width='20px' height='20px' src =" +
                icon +
                "></td> <td><button style='all: unset; cursor: pointer;' value=" +
                json.entities[i].links[0].href +
                " onclick='clik(this, \"" + folderId + "\", \"" + type + "\", \"" + json.entities[i].properties.name + "\")' >" +
                json.entities[i].properties.name +
                "</button></td><td>" +
                fileType +
                "</td></tr>";
        }
    }
    document.getElementById("connector-" + folderId).innerHTML = '';
    // next page button
    let nextPageURL = '';
    const nextPageObj = json.links && json.links.find((item) => item.rel[0] === 'next');
    console.log('nextPageObj', nextPageObj);
    if (nextPageObj) {
        nextPageURL = nextPageObj.href;
    }
    if (nextPageURL !== '') {
        document.getElementById("connector-" + folderId).innerHTML +=
            "<br />&nbsp;&nbsp;<button class='link' value=" +
            nextPageURL +
            " onclick='next(this, \"" + folderId + "\")'>Next</button>";
    }
    // prev page button
    let prevPageURL = '';
    const prevPageObj = json.links && json.links.find((item) => item.rel[0] === 'prev');
    if (prevPageObj) {
        prevPageURL = prevPageObj.href;
    }
    if (prevPageURL !== '') {
        document.getElementById("connector-" + folderId).innerHTML +=
            "<br />&nbsp;&nbsp;<button class='link' value=" +
            prevPageURL +
            " onclick='prev(this, \"" + folderId + "\")' style='margin-right: 8px;'>Previous</button>";
    }
    updateBreadcrum(folderId);
    if (json.entities === undefined) {
        document.getElementById("noData-" + folderId).innerHTML = `<p>No files found</p>`;
    } else {
        document.getElementById("noData-" + folderId).innerHTML = "";
    }
}

/**
*Breadcrum
*/

const updateBreadcrum = (folderId) => {
    console.log('***********breadcrum****************');
    console.log(breadcrum);
    const mapped = breadcrum[folderId].map((bread, index) => {
        return `<button class="breadcrum" value='${bread}' onclick='goBack(this, "${folderId}")'>${index === 0 ? bread : names[bread]}</button>`;
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
                // do sorting here....
                // SORT_TRACK[folderId]['NAME_SORT']
                // SORT_TRACK[folderId]['TYPE_SORT']
                // json.entities[i].properties.name
                // json.entities[i].class
                const entities = json.entities && json.entities.length ? json.entities : [];
                if (SORT_TRACK[folderId][KEYS.NAME] !== KEYS.SORT_DEFAULT) {
                    entities.sort(function (a, b) {
                        if (SORT_TRACK[folderId][KEYS.NAME] === KEYS.SORT_ASC) {
                            return ('' + a.properties.name).localeCompare(b.properties.name);
                        } else if (SORT_TRACK[folderId][KEYS.NAME] === KEYS.SORT_DESC) {
                            return ('' + b.properties.name).localeCompare(a.properties.name);
                        }
                    });
                }

                if (SORT_TRACK[folderId][KEYS.TYPE] !== KEYS.SORT_DEFAULT) {
                    entities.sort(function (a, b) {
                        if (SORT_TRACK[folderId][KEYS.TYPE] === KEYS.SORT_ASC) {
                            return ('' + a.class).localeCompare(b.class);
                        } else if (SORT_TRACK[folderId][KEYS.TYPE] === KEYS > SORT_DESC) {
                            return ('' + b.class).localeCompare(a.class);
                        }
                    });
                }

                resolve({ ...json, entities }); loader.style.visibility = "hidden";
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
