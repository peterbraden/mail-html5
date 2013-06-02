/**
 * High level storage api that handles all persistence on the device. If
 * SQLcipher/SQLite is available, all data is securely persisted there,
 * through transparent encryption. If not, the crypto API is
 * used to encrypt data on the fly before persisting via a JSON store.
 */
app.dao.DeviceStorage = function(util, crypto, jsonDao, sqlcipherDao) {
	'use strict';

	/**
	 * Stores a list of encrypted items in the object store
	 * @param list [Array] The list of items to be persisted
	 * @param type [String] The type of item to be persisted e.g. 'email'
	 */
	this.storeEcryptedList = function(list, type, callback) {
		// nothing to store
		if (list.length === 0) {
			callback();
			return;
		}

		jsonDao.batch(type, list, function(err) {
			callback(err);
		});
	};

	/**
	 * List stored items of a given type
	 * @param type [String] The type of item e.g. 'email'
	 * @param offset [Number] The offset of items to fetch (0 is the last stored item)
	 * @param num [Number] The number of items to fetch (null means fetch all)
	 */
	this.listEncryptedItems = function(type, offset, num, callback) {
		// fetch all items of a certain type from the data-store
		jsonDao.list(type, offset, num, function(err, encryptedList) {
			callback(err, encryptedList);
		});
	};

	/**
	 * Clear the whole device data-store
	 */
	this.clear = function(callback) {
		jsonDao.clear(callback);
	};

};