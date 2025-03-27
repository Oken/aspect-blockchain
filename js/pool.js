/**
 * This script is jQuery-depended
 */
//This uses indexDb to temporary store and retrieve the selected
//pool options

//Collect the pool form data on submission

let data = document.forms.data;

if (data) {
    data.addEventListener('submit', function (e) {
        // prevent the form from submitting
        e.preventDefault();


        checked = false;

        if ($('#selected p').text() === 'Other') {
            // This is tested when 'Other' is selected as pool option
            if (
                checkForDuplicatePoolAttempt('#selected', '#select', '.menu-pool-items') &&
                processRequiredInput('#pool-account-stratum', 'Mining pool stratum cannot be empty') &&
                processSelection('#selected', '#select') &&
                processRequiredInput('#pool-account-username', 'Mining pool username cannot be empty')
                ) {
                checked = true;
            }
        } else if (
            // This is tested for every other pool options
            checkForDuplicatePoolAttempt('#selected', '#select', '.menu-pool-items') &&
            processSelection('#selected', '#select') &&
            processRequiredInput('#pool-account-username', 'Mining pool username cannot be empty')
            ) {
            checked = true;
        } else {
            //If none of the pool form check tests pass, do not do anything
            // but set submitted to false
            submitted = false;
            return;
        }

        //Grab the important pool data from the form at this point

        if (checked) {
            //prepare the form data for storage
            poolData = {
                name: $('#selected p')[0].textContent,
                img: $('#selected img')[0].src,
                rel: 'pool',
                username: data['pool-account-username'].value,
                nickname: data['pool-account-nickname'].value,
            }
            //Update the database with the form data
            updated = addPoolObject(poolData);
            //Form submitted successfully
            submitted = 'true';
            // Initiate a click event to exit the form
            data['add'].click();
        }
    });
}

/**
 *
 *      POOL FORM INPUTS PROCESSING
 *
 */

const isRequired = value => value === '' ? false : true;

const showError = (input, message) => {

    if ($(`${input} ~ small`)[0]) {
        $(`${input} ~ small`).remove();
    }
    // show the error message
    $(`<small class="form-error">${message}</small>`).insertAfter($(input));
};

const hideError = (selector) => {
    $(`${selector} ~ small`).remove();
}

function processRequiredInput(selector, errorMsg) {
    let valid = false;

    const elem = $(selector);
    const letters = elem.val().trim();

    if (!isRequired(letters)) {
        showError(selector, errorMsg);
    } else {
        hideError(selector);
        valid = true;
    }
    return valid;
}

function checkForDuplicatePoolAttempt(selection, parent, selector) {
    let valid = true;

    selectedText = $(`${selection} p`).text();

    if ($(`${selector}`)[0]) {
        $(`${selector} p`).each((k, v) => {
            menuPoolText = $(v).text();
            if (menuPoolText === selectedText) {
                valid = false;
                showError(parent, 'You have added this pool already.')

            }
        })
    } else {
        if (selection !== 'Select an option') {
            hideError(parent);
        }
    }
    return valid;
}

function processSelection(selector, parent) {
    let valid = false;
    // Get the selection text
    const selection = $(`${selector} p`).text();

    if (selection === 'Select an option') {
        showError(parent, 'You must make a selection before form submission!');
    } else {
        hideError(parent);
        valid = true;
    }
    return valid;
}


/**
 *
 *  DATABASE UPDATING AND QUERYING
 *
 */
// This utility function asynchronously obtains the database object (creating
// and initializing the DB if necessary) and passes it to the callback.
function withDB(callback, record = null) {
    let request = indexedDB.open("aspectblockchain", 1); // Request v1 of the database
    request.onerror = console.error; // Log any errors
    request.onsuccess = () => { // Or call this when done
        let db = request.result; // The result of the request is the database
        callback(db); // Invoke the callback with the database
    };

    // If version 1 of the database does not yet exist, then this event
    // handler will be triggered. This is used to create and initialize
    // object stores and indexes when the DB is first created or to modify
    // them when we switch from one version of the DB schema to another.
    request.onupgradeneeded = (event) => {
        if (record === null) {
            return;
        }
        initdb(event, callback, record);
    };
}

// withDB() calls this function if the database has not been initialized yet.
// We set up the database and populate it with data, then pass the database to
// the callback function.
//
// We use the "name" property of form object as the database
// key and create an index for the rel property
function initdb(db, callback, record) {
    db = event.target.result
    // Create the object store, specifying a name for the store and
    // an options object that includes the "key path" specifying the
    // property name of the key field for this store.
    store = db.createObjectStore("pools", // store name
        { keyPath: "name" });
    // Now index the object store by rel property of the
    // form data object as well as by zip code.
    // With this method the key path string is passed directly as a
    // required argument rather than as part of an options object.
    store.createIndex("relationship", "rel");
    // Now get the data we are going to initialize the database with.

    if (record !== null) {
        // In order to insert record data into the database we need a
        // transaction object. To create our transaction object, we need
        // to specify which object stores we'll be using (we only have
        // one) and we need to tell it that we'll be doing writes to the
        // database, not just reads:
        let transaction = event.target.transaction;

        transaction.onerror = console.error;
        // Get our object store from the transaction
        let store = transaction.objectStore("pools");
        // Add (or update) our records:
        store.put(record)
        // When the transaction completes successfully, the database
        // is initialized and ready for use, so we can call the
        // callback function that was originally passed to withDB()
        transaction.oncomplete = () => { callback(db); };
    }
}

function addPoolObject(record) {

    if (navigator.userAgent.match(/firefox|fxios/i)) {
        // For Firefox that does not fully support indexedDB
        const strStore = localStorage.aspectblockchain
        if (strStore) {
            //if store exists, we append a fresh new record
            arrStore = JSON.parse(strStore);
            for (let item of arrStore) {
                // We check to see if there is an existing item in the store
                // with the same pool name as that of the record we want to add
                // We won't add the record if they are same
                if (item.name === record.name) {
                    return;
                }
            }

            // At this point, we can safely add the new record
            arrStore.push(record);

            // We overwrite the existing store
            localStorage.aspectblockchain = JSON.stringify(arrStore);

            // Update the web dashboard menu as well
            lookupPools('pool', updatePage);
        } else {
            // If the store does not exist yet, we create it
            let arrStore = [];
            arrStore.push(record);
            let strStore = JSON.stringify(arrStore);
            localStorage.aspectblockchain = strStore;
            lookupPools('pool', updatePage);
        }
    } else {
        // For chrome, edge and other browsers that fully support indexedDB
        withDB(db => {
            // Add form data object to an already existing indexDb
            let transaction = db.transaction(["pools"], "readwrite");
            //transaction.onerror = console.error;
            // Get our object store from the transaction
            store = transaction.objectStore("pools");
            // Add (or update) our records:
            let add = store.add(record);

            // Check for errors
            let error = false;

            add.onerror = (e) => {
                error = true;
            }

            add.onsuccess = (e) => {
                lookupPools('pool', updatePage);
            }
        }, record)
    }
}

function usingDB(callback) {
    let request = indexedDB.open("aspectblockchain", 1); // Request v1 of the database
    request.onerror = console.error; // Log any errors
    request.onsuccess = () => { // Or call this when done
        let db = request.result; // The result of the request is the database
        callback(db); // Invoke the callback with the database
    };

    request.onupgradeneeded = (event) => {
        db = event.target.result
        // Create the object store
        store = db.createObjectStore("pools", // store name
            { keyPath: "name" });
        // Now index the object store by rel property
        store.createIndex("relationship", "rel");

        // callback function that was originally passed to withDB()
        //transaction.oncomplete = () => { callback(db); };
    };
}
// Given a name of pool, use the IndexedDB API to asynchronously look up
// the store objects with that name, and pass it to the
// specified callback, or pass null if no records  are found.
function lookupPool(name, callback = null) {
    withDB(db => {
        // Create a read-only transaction object for this query. The
        // argument is an array of object stores we will need to use.
        let transaction = db.transaction(["pools"]);
        // Get the object store from the transaction
        let pools = transaction.objectStore("pools");
        // Now request the object that matches the specified name.
        // The lines above were synchronous, but this one is async.
        let request = pools.get(name);
        request.onerror = console.error; // Log errors
        request.onsuccess = () => { // Or call this function on success
            let record = request.result; // This is the query result
            if (record) { // If we found a match, pass it to the callback
                callback(`${record.city}, ${record.state}`);
            } else { // Otherwise, tell the callback that we failed
                callback(null);
            }
        };
    });
}
// Given the rel of a pool, use the IndexedDB API to asynchronously
// look up all pool records that have that (case-sensitive)
// rel value.
function lookupPools(rel, callback) {
    if (navigator.userAgent.match(/firefox|fxios/i)) {
        // We retrieve the stored pools for firefox users if already created
        if (localStorage.aspectblockchain) {
            let arrStore = JSON.parse(localStorage.aspectblockchain)

            // pass the arrStore to the callback function
            callback(arrStore);
        } else {
            return;
        }
    } else {
        usingDB(db => {
            // We create a transaction and get the object store
            let transaction = db.transaction(["pools"]);
            let store = transaction.objectStore("pools");
            // This time we also get the city index of the object store
            let index = store.index("relationship");
            // Ask for all matching records in the index with the specified
            // rel property, and when we get them we pass them to the callback.
            // If we expected more results, we might use openCursor() instead.
            let request = index.getAll(rel);
            request.onerror = console.error;
            request.onsuccess = () => {
                callback(request.result);
            };
        });
    }
}

function updatePage(pools) {
    for (let i = 0, len = pools.length; i < len; ++i) {
        if (pools[i] === pools[len - 1]) {

        }

        if (i === 0) {
            // This handles updating the first pool on the page menu
            // both the mobile and desktop menus
            //
            // Removes a child node of the default pool area
            $('.menu-pool-default').each((index, elem) => {
                $(elem).remove();
            });

            // Remove the previously appended pools
            if ($('.docker')[0]) {
                $('.docker').each((index, elem) => {
                    $(elem).remove();
                });
            }

            // Replaces the removed node
            $('.menu-pools').each((index, elem) => {
                $(elem).append(`
                    <div class="docker w-full flex overflow-hidden">
                        <div class="menu-pool-items w-full flex-col justify-center self-center cursor-pointer">
                            <div class="pool flex flex-row justify-start w-full mb-1 bg-white pl-2 shadow-4xl border border-gray-950 p-1:10">
                                <div class="flex justify-start mr-1" style="min-width: 48px;"><img class="w-12 h-12" src="${pools[i].img}" alt="" title=""></div>
                                <div class="flex flex-col justify-center items-start">
                                    <p class="font-semibold w-full">${pools[i].name}</p>
                                    <p class="w-full flex flex-row items-center justify-start">${pools[i].username}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `);
            });

            // Display a summary of the just added pools and display them
            $('#pool-summary').removeClass('hidden');
            $('#pool-summary .pool-image').attr({
                src: `${pools[i].img}`,
                alt: `${pools[i].name}`,
                title: `${pools[i].name}`
            });
            $('#pool-summary .pool-name').text(`${pools[i].name}`);
            $('#pool-summary .nickname').text(`${pools[i].nickname}`);
            $('#pool-summary .username').text(`${pools[i].username}`);
        } else {
            // Update the rest of the pools
            $('.menu-pool-items').each((index, elem) => {
                $(elem).append(`
                    <div class="flex flex-row justify-start w-full mb-1 bg-white pl-2 shadow-4xl border border-gray-950 p-1:10">
                        <div class="flex justify-start mr-1" style="min-width: 48px;"><img class="w-12 h-12" src="${pools[i].img}" alt="" title=""></div>
                        <div class="flex flex-col justify-center items-start">
                            <p class="font-semibold w-full">${pools[i].name}</p>
                            <p class="w-full flex flex-row items-center justify-start">${pools[i].username}</p>
                        </div>
                    </div>
                `);
            });
        }
    }
}

lookupPools('pool', updatePage);