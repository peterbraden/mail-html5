/**
 * Handles storing of JSON objects in IndexedDB
 */
app.dao.IndexedDbDAO = function(window) {
	'use strict';

	var idb;
	var dbName = 'data-store';
	var version = 1;

	/**
	 * Initializes the data store.
	 */
	this.init = function(callback) {
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
	 * Read a single item by its key	 
	 * @param type [String] The type of item e.g. 'email'
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
	 * @param offset [Number] The offset of items to fetch (0 is the last stored item)
	 * @param num [Number] The number of items to fetch (null means fetch all)
	 */
	this.list = function(type, offset, num, callback) {
		var list = [];
		var trans = idb.transaction([type], 'readwrite');
		var store = trans.objectStore(type);
		var countRequest = store.count();

		countRequest.onsuccess = function(e) {
			var count = e.target.result;
			var counter = 0;
			var from = (num) ? count - offset - num : 0;
			var to = count - 1 - offset;

			// Get everything in the store;
			var keyRange = window.IDBKeyRange.lowerBound(0);
			var cursorRequest = store.openCursor(keyRange);

			cursorRequest.onsuccess = function(e) {
				var cursor = e.target.result;
				if (cursor && counter >= from && counter <= to) {
					list.push(cursor.value);
				}
				if (cursor) {
					cursor.continue();
				} else {
					callback(null, list);
				}
				counter++;
			};

			cursorRequest.onerror = function(e) {
				callback(e);
			};
		};

		countRequest.onerror = function(e) {
			callback(e);
		};
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
		var self = this;
		var request = window.indexedDB.deleteDatabase(dbName);
		request.onsuccess = function (e) {
			callback();
		};
		request.onerror = function (e) {
			callback(e);
		};
	};

};