/**
 * Handles storing of JSON objects in IndexedDB
 */
app.dao.IndexedDbDAO = function(window) {
	'use strict';

	var idb;
	var version = 2;

	/**
	 * Initializes the data store.
	 */
	this.init = function(dbName, callback) {
		var request = window.indexedDB.open(dbName, version);

		// We can only create Object stores in a versionchange transaction.
		request.onupgradeneeded = function(e) {
			var db = e.target.result;

			// A versionchange transaction is started automatically.
			e.target.transaction.onerror = function(e) {
				callback(e);
			};

			// email store
			if (db.objectStoreNames.contains('email')) {
				db.deleteObjectStore('email');
			}
			var emailStore = db.createObjectStore('email', {
				keyPath: 'sentDate'
			});

			// public key store
			if (db.objectStoreNames.contains('publickey')) {
				db.deleteObjectStore('publickey');
			}
			var pubkeyStore = db.createObjectStore('publickey', {
				keyPath: '_id'
			});

			// private key store
			if (db.objectStoreNames.contains('privatekey')) {
				db.deleteObjectStore('privatekey');
			}
			var privkeyStore = db.createObjectStore('privatekey', {
				keyPath: '_id'
			});
		};

		request.onsuccess = function(e) {
			idb = e.target.result;
			callback();
		};

		request.onerror = function(e) {
			callback(e);
		};
	};

	/**
	 * Create or update an object.
	 * @param type [String] The type of item e.g. 'email'
	 */
	this.put = function(type, object, callback) {
		var trans = idb.transaction([type], 'readwrite');
		var store = trans.objectStore(type);
		var request = store.put(object);

		request.onsuccess = function(e) {
			callback();
		};

		request.onerror = function(e) {
			callback(e);
		};
	};

	/**
	 * Persist a bunch of items at once	 
	 * @param type [String] The type of item e.g. 'email'
	 */
	this.batch = function(type, list, callback) {
		var self = this;

		var after = _.after(list.length, function() {
			callback();
		});

		_.each(list, function(i) {
			self.put(type, i, function(err) {
				if (err) {
					callback(err);
					return;
				}

				after();
			});
		});
	};

	/**
	 * Read a single item by query
	 * @param type [String] The type of item e.g. 'email'
	 * @param query [Object] The query used to filter correct objects
	 */
	this.find = function(type, query, callback) {
		var trans = idb.transaction([type], 'readwrite');
		var store = trans.objectStore(type);

		// Get everything in the store;
		var keyRange = window.IDBKeyRange.lowerBound(0);
		var cursorRequest = store.openCursor(keyRange);

		cursorRequest.onsuccess = function(e) {
			var cursor = e.target.result;
			if (cursor) {
				// check matching key value pair
				for (var key in query) {
					if (cursor.value[key] === query[key]) {
						callback(null, cursor.value);
						return;
					}
				}
				cursor.continue();

			} else {
				callback(null, null);
			}
		};

		cursorRequest.onerror = function(e) {
			callback(e);
		};
	};

	/**
	 * List all the items of a certain type
	 * @param type [String] The type of item e.g. 'email'
	 * @param query [Object] The query used to filter correct objects
	 * @param offset [Number] The offset of items to fetch (0 is the last stored item)
	 * @param num [Number] The number of items to fetch (null means fetch all)
	 */
	this.list = function(type, query, offset, num, callback) {
		var from, to,
			matching = [],
			interval = [];

		var trans = idb.transaction([type], 'readwrite');
		var store = trans.objectStore(type);
		var countRequest = store.count();

		countRequest.onsuccess = function(e) {
			var count = e.target.result;
			from = (num) ? count - offset - num : 0;
			to = count - 1 - offset;

			// Get everything in the store;
			var keyRange = window.IDBKeyRange.lowerBound(0);
			var cursorRequest = store.openCursor(keyRange);

			cursorRequest.onsuccess = function(e) {
				var cursor = e.target.result;
				if (cursor) {
					if (query) {
						// filter through query
						for (var key in query) {
							if (cursor.value[key] === query[key]) {
								// add matching item to results
								matching.push(cursor.value);
							}
						}

					} else {
						// no special query required
						matching.push(cursor.value);
					}
					cursor.continue();

				} else {
					getInterval();
				}
			};

			cursorRequest.onerror = function(e) {
				callback(e);
			};
		};

		countRequest.onerror = function(e) {
			callback(e);
		};

		function getInterval() {
			// filter items within requested interval
			for (var i = 0; i < matching.length; i++) {
				if (i >= from && i <= to) {
					interval.push(matching[i]);
				}
			}

			matching = null; // free space
			callback(null, interval);
		}
	};

	/**
	 * Removes an object liter from local storage by its key (delete)
	 */
	this.remove = function(type, key, callback) {
		var trans = idb.transaction([type], 'readwrite');
		var store = trans.objectStore(type);
		var request = store.delete(key);

		request.onsuccess = function(e) {
			callback();
		};

		request.onerror = function(e) {
			callback(e);
		};
	};

	/**
	 * Clears the whole local storage cache
	 */
	this.clear = function(callback) {
		idb.transaction(['email'], 'readwrite').objectStore('email').clear().onsuccess = function(e) {
			idb.transaction(['publickey'], 'readwrite').objectStore('publickey').clear().onsuccess = function(e) {
				idb.transaction(['privatekey'], 'readwrite').objectStore('privatekey').clear().onsuccess = function(e) {
					callback();
				};
			};
		};
	};

};